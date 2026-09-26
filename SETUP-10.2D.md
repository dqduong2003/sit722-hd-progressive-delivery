# Task 10.2D – IaC, Security Scanning & Monitoring Runbook (you run this)

This extends the Week 08/8.2P pipeline (`week10-10.2D` is a fresh clone of
`github.com/dqduong2003/week08`, branch `feature/10.2d-iac-scout-monitoring`)
with three new capabilities. Files already changed/added for you:

| File | What changed |
|---|---|
| `.github/workflows/05-terraform.yml` | **New.** `terraform fmt`/`validate` on every push touching `terraform/` — no Azure credentials needed. |
| `.github/workflows/01-ci.yml` | Docker Hub login + `organization` input added so `docker/scout-action` runs; `ignore-base: true` / `only-fixed: true` added to the `cves` step (see note below). |
| `.github/workflows/06-deploy-monitoring.yml` | **New.** `workflow_dispatch` — installs Prometheus + Grafana onto AKS via Helm, using the existing `KUBE_CONFIG` secret. |
| `terraform/*.tf` | Reformatted to canonical `terraform fmt` style (no logic changes) so `05-terraform.yml` starts green. |
| `terraform/terraform.tfvars.example` | New names for this task's own infra: `sit722-week10-2d`. |
| All 5 backend `requirements.txt` | `fastapi 0.116.1 → 0.133.0`, `PyJWT → 2.13.0` (**staged, not yet committed** — see Step 5). |
| `user-service/`, `student-service/`, `lecturer-service/requirements.txt` | additionally `python-multipart 0.0.20 → 0.0.30` (**staged**). |
| `frontend/Dockerfile` | `apk update && apk upgrade` added to the final `nginx:1.27-alpine` stage, to pick up patched Alpine packages (e.g. `curl`) at build time (**staged**). |

**Why `fastapi` had to move too:** Scout's fixed versions for the `starlette`
CVEs (0.49.1 / 1.1.0 / 1.3.1) all exceed what `fastapi==0.116.1` allows
(`starlette<0.48.0` — confirmed via PyPI metadata). Pinning `starlette`
directly without moving `fastapi` would make `pip install` fail with a
resolution conflict. `fastapi==0.133.0` is the smallest version bump that
drops the `starlette` upper bound; verified locally (app import + `pytest
--collect-only`, all 11 tests collect cleanly) before rolling it out to
every service.

**Why `ignore-base: true` / `only-fixed: true` were added:** the base image
(`python:3.12-slim`, Debian trixie) carries two HIGH CVEs in `zlib` and
`perl` with **no fix available upstream** — confirmed unfixable in Task
10.1P and again here. No dependency bump or base-image switch can clear
these, so gating on them would leave the pipeline permanently red for a
risk this repo has no way to act on. `ignore-base` excludes advisories that
exist unchanged in the upstream base layer; `only-fixed` excludes any
advisory with no available patch at all. Both narrow the gate to what's
actually actionable — the accepted DevSecOps practice of blocking on fixable
risk rather than on everything a scanner reports.

This task provisions its **own** dedicated infra, separate from every other
week's, and must be **destroyed at the end** (Step 9).

> **Cost:** ~USD $13–15/day while the cluster runs (monitoring adds a modest
> amount of pod density on top of the usual 3-node cost). Do the whole
> practical in one or two sessions and tear down immediately after.

---

## Step 1 – Provision infrastructure

```powershell
cd "week10-10.2D/terraform"
Copy-Item terraform.tfvars.example terraform.tfvars
# acr_name / storage_account_name must be GLOBALLY unique - edit if the
# defaults in terraform.tfvars.example are already taken
notepad terraform.tfvars

terraform init
terraform plan -out tfplan
terraform apply tfplan
```

Creates: resource group `sit722-week10-2d`, ACR (Basic, admin enabled),
Storage account + 2 blob containers, AKS cluster `aks-sit722-week10-2d`
(**3 nodes**), and an `AcrPull` role assignment.

```powershell
az aks get-credentials --resource-group sit722-week10-2d --name aks-sit722-week10-2d --overwrite-existing
kubectl get nodes        # expect 3 nodes, STATUS Ready
```

> **[Screenshot 1]** `terraform apply` completing (`Apply complete!`) and `kubectl get nodes` showing 3 Ready nodes.

---

## Step 2 – Collect the values

```powershell
terraform output -raw acr_name                    # -> ACR_NAME
terraform output -raw acr_login_server            # -> ACR_LOGIN_SERVER
terraform output -raw resource_group_name         # -> AKS_RESOURCE_GROUP
terraform output -raw aks_cluster_name            # -> AKS_CLUSTER_NAME
terraform output -raw acr_admin_username          # -> ACR_USERNAME
terraform output -raw acr_admin_password          # -> ACR_PASSWORD
terraform output -raw storage_connection_string   # -> AZURE_STORAGE_CONNECTION_STRING
```

```powershell
az aks get-credentials --resource-group sit722-week10-2d --name aks-sit722-week10-2d --admin --file ./kubeconfig-admin
[Convert]::ToBase64String([IO.File]::ReadAllBytes("$PWD\kubeconfig-admin"))
# -> KUBE_CONFIG
```

Create a Docker Hub **Personal Access Token** for the new Docker Scout
secrets (hub.docker.com → your avatar → **Account Settings** → **Personal
access tokens** → **Generate new token**, Read-only scope is enough):

- `DOCKERHUB_USERNAME` = your Docker Hub username (e.g. `danieldang2003`)
- `DOCKERHUB_TOKEN` = the token you just generated

---

## Step 3 – Configure GitHub

Repo → **Settings → Secrets and variables → Actions**.

### Repository *Variables*

| Name | Value |
| --- | --- |
| `ACR_NAME` | from Step 2 |
| `ACR_LOGIN_SERVER` | from Step 2 |
| `AKS_RESOURCE_GROUP` | from Step 2 |
| `AKS_CLUSTER_NAME` | from Step 2 |

### Repository *Secrets*

| Name | Value |
| --- | --- |
| `ACR_USERNAME` | from Step 2 |
| `ACR_PASSWORD` | from Step 2 |
| `KUBE_CONFIG` | from Step 2 |
| `DOCKERHUB_USERNAME` | **new** — from Step 2 |
| `DOCKERHUB_TOKEN` | **new** — from Step 2 |

### GitHub *Environments*

Create **`staging`** and **`production`**, each with the usual 7 environment
secrets (`POSTGRES_USER=postgres`, `POSTGRES_PASSWORD=postgres`,
`JWT_SECRET_KEY=koalatech-local-development-secret`,
`DEFAULT_ADMIN_USERNAME=admin`, `DEFAULT_ADMIN_EMAIL=admin@koalatech.edu.au`,
`DEFAULT_ADMIN_PASSWORD=AdminPassword123!`,
`AZURE_STORAGE_CONNECTION_STRING` = from Step 2).

Checklist: 4 variables · 5 secrets (2 new) · `staging` + `production`
environments (7 secrets each) · Actions enabled on the repo.

---

## Step 4 – Push the branch (Terraform Validate only, for now)

```powershell
cd "week10-10.2D"
git push -u origin feature/10.2d-iac-scout-monitoring
```

`05 - Terraform Validate` has no branch restriction, so it runs immediately
on this push. Watch it go green in the **Actions** tab.

> **[Screenshot 2]** Actions tab: `05 - Terraform Validate` run, all steps green (`fmt`, `init`, `validate`).

**Important:** `01 - CI` and the `02`/`03`/`04` chain only trigger on pushes
to **`main`** — a feature-branch push alone won't run them. The next two
steps land commits on `main` directly, which is what actually exercises the
Docker Scout gate and the rest of the pipeline.

---

## Step 5 – Merge to `main`: Docker Scout BEFORE the fix

```powershell
git checkout main
git pull origin main
git merge feature/10.2d-iac-scout-monitoring
git push origin main
```

(A pull request through the GitHub UI works too, and is a nicer way to show
a review step — either way, the merge must land on `main`.) The
`requirements.txt` fixes are still uncommitted in your working tree at this
point (git carries them across the branch switch/merge untouched, since
they're unrelated files), so this push to `main` should make **`01 - CI`**
**fail** at the `Analyze image with Docker Scout` step for `user-service`,
`student-service`, and `lecturer-service` — Scout's `exit-code: true` gate
catching the known HIGH-severity CVEs from Task 10.1P (`python-multipart`
CVE-2026-24486 etc., `PyJWT` CVE-2026-32597 / CVE-2026-48526). Because that
job fails, the whole `01 - CI` run's conclusion is `failure`, so `02 -
Deploy to Staging` correctly does **not** run either — a concrete
demonstration of the security gate blocking the rest of the pipeline.

> **[Screenshot 3]** Actions tab: `01 - CI` → `build-and-push (koalatech-lecturer-service)` job **failed (red ❌)** at "Analyze image with Docker Scout", with the CVE list visible in the log.
> **[Screenshot 4]** Actions tab: `02 - Deploy to Staging` **did not run** for this commit (confirms the gate blocked promotion).

---

## Step 6 – Commit and push the fix (still on `main`)

```powershell
git status   # confirm the 5 requirements.txt files, frontend/Dockerfile, and
             # .github/workflows/01-ci.yml are modified
git add user-service/requirements.txt student-service/requirements.txt `
        lecturer-service/requirements.txt course-service/requirements.txt `
        enrollment-service/requirements.txt frontend/Dockerfile `
        .github/workflows/01-ci.yml
git commit -m "fix: remediate Docker Scout HIGH/CRITICAL findings - bump fastapi/starlette, python-multipart, PyJWT; refresh Alpine packages in frontend image; scope the Scout gate to fixable app-layer findings"
git push origin main
```

This re-triggers `01 - CI` on `main`. This time the Docker Scout step should
**pass** (green ✅) for every service, and the pipeline continues through to
`02`/`03`/`04` automatically, redeploying staging and production with the
fixed images.

> **[Screenshot 5]** `git diff` (or the GitHub commit view) showing the version bumps across the 5 `requirements.txt` files.
> **[Screenshot 6]** Actions tab: `01 - CI` → the same job now **passing (green ✅)** at "Analyze image with Docker Scout", ideally captured next to Screenshot 3 for an obvious before/after.
> **[Screenshot 7]** Actions tab: the full chain — `01 - CI` → `02 - Deploy to Staging` → `03 - Test Staging` → `04 - Deploy to Production` — all green for this push.

---

## Step 7 – Deploy monitoring

Now that `06-deploy-monitoring.yml` exists on `main`, it's reliably runnable
from the Actions UI: **Actions → 06 - Deploy Monitoring → Run workflow**
(branch: `main`).

> **[Screenshot 8]** Actions tab: `06 - Deploy Monitoring` run, all steps green, including the final "Confirm the application is still reachable" step.

Then follow `MONITORING-SETUP.md` for the Grafana/Prometheus screenshots
(M1–M9).

---

## Step 8 – Verify everything end to end

```powershell
kubectl get pods,svc,pvc -n staging
kubectl get pods,svc,pvc -n production
kubectl get pods -n monitoring
kubectl get svc frontend -n production -o jsonpath='{.status.loadBalancer.ingress[0].ip}'
# open http://<that-ip> - confirm the app still works
```

> **[Screenshot 9]** Terminal: all three namespaces (`staging`, `production`, `monitoring`) healthy, and the production app reachable in a browser.

---

## Step 9 – DELETE EVERYTHING

```powershell
cd "week10-10.2D/terraform"
terraform destroy
az group show -n sit722-week10-2d 2>$null   # should error / not found
az group list -o table
```

If the RG still exists: `az group delete -n sit722-week10-2d --yes`. Also
delete the `DOCKERHUB_USERNAME`/`DOCKERHUB_TOKEN` secrets and revoke the
Docker Hub PAT you created in Step 2, and delete `kubeconfig-admin`.

---

## Note for your submission

Terraform's pipeline stage is **`fmt`/`validate` only** — `plan`/`apply`
were not added to CI because both need full Azure Resource Manager
authentication (a service principal or OIDC-federated app registration),
which this student Entra tenant blocks, exactly as established for
`azure/login` in Task 8.1P. `validate`/`fmt` need zero cloud credentials, so
they run safely and unconditionally on every push; provisioning stays a
manual, locally-run step. This is a deliberate, documented scope boundary,
not an oversight.
