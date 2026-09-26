# Task 8.2P – Continuous Deployment Runbook (you run this)

This extends Task 8.1P's pipeline (`week08-8.2P` is a fresh clone of the same
fork, `github.com/dqduong2003/week08`). Two files were changed for you
already:

| File | Change |
|---|---|
| `.github/workflows/04-deploy-production.yml` | Trigger changed from `workflow_dispatch` (manual, needs a typed-in SHA) to `workflow_run` after `"03 - Test Staging"` succeeds — production now deploys **automatically**, using the exact commit SHA that passed staging. |
| `frontend/src/components/Header.jsx` | Visible change: header background is now green (`#2e7d32`) and the title reads "KoalaTech University — Production Release" — this is the change the pipeline will carry through to production. |

This task provisions its **own** dedicated Azure infrastructure (separate
from the Week 09 monitoring cluster, which stays untouched) and must be
**destroyed at the end** — the task brief explicitly requires cleanup
evidence.

---

## Step 1 – Provision infrastructure

```powershell
cd "week08-8.2P/terraform"
terraform init
terraform plan -out tfplan
terraform apply tfplan
```

Creates: resource group `sit722-week08-cd`, ACR (Basic, admin enabled),
Storage account + 2 blob containers, AKS cluster **`aks-sit722-week08-cd`**
(**3 nodes** — staging and production both run PostgreSQL), and an
`AcrPull` role assignment.

Verify:

```powershell
az aks get-credentials --resource-group sit722-week08-cd --name aks-sit722-week08-cd --overwrite-existing
kubectl get nodes        # expect 3 nodes, STATUS Ready
```

> **[ Screenshot — infrastructure provisioned ]** `terraform apply` completing with `Apply complete! Resources: 7 added` and `kubectl get nodes` showing 3 Ready nodes.

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

Build the `KUBE_CONFIG` secret:

```powershell
az aks get-credentials `
  --resource-group sit722-week08-cd `
  --name aks-sit722-week08-cd `
  --admin --file ./kubeconfig-admin

[Convert]::ToBase64String([IO.File]::ReadAllBytes("$PWD\kubeconfig-admin"))
# copy the whole base64 string -> GitHub secret KUBE_CONFIG
```

`kubeconfig-admin` is git-ignored — delete it once you have the base64 string.

---

## Step 3 – Update GitHub configuration

This is the **same fork** as Task 8.1P, so update the existing secrets and
variables to point at the new `-cd` cluster/registry (don't create a second
set of names — these are the same 4 variables / 3 secrets already there,
just with new values):

Repo → **Settings → Secrets and variables → Actions**.

### Repository *Variables* (overwrite existing values)

| Name | New value |
|---|---|
| `ACR_NAME` | `terraform output -raw acr_name` |
| `ACR_LOGIN_SERVER` | `terraform output -raw acr_login_server` |
| `AKS_RESOURCE_GROUP` | `terraform output -raw resource_group_name` |
| `AKS_CLUSTER_NAME` | `terraform output -raw aks_cluster_name` |

### Repository *Secrets* (overwrite existing values)

| Name | New value |
|---|---|
| `ACR_USERNAME` | `terraform output -raw acr_admin_username` |
| `ACR_PASSWORD` | `terraform output -raw acr_admin_password` |
| `KUBE_CONFIG` | the base64 string from Step 2 |

### `staging` and `production` Environment secrets

Both already exist from Task 8.1P with the same 7 secret names. Only
`AZURE_STORAGE_CONNECTION_STRING` needs updating (new storage account) in
**both** environments — the rest (`POSTGRES_USER`, `POSTGRES_PASSWORD`,
`JWT_SECRET_KEY`, `DEFAULT_ADMIN_*`) can stay as-is.

> **Important:** open **Settings → Environments → production** and confirm
> there is **no required-reviewer protection rule** on it — Continuous
> Deployment means production must deploy without a manual approval click.
> (Task 8.1P may have left this environment unprotected already; just
> double-check.)

> **[ Screenshot — 04-deploy-production.yml trigger change ]** GitHub → your fork → `.github/workflows/04-deploy-production.yml`, showing the `on: workflow_run:` block (no more `workflow_dispatch`/`inputs`).
> **[ Screenshot — updated repository variables/secrets ]** Settings → Secrets and variables → Actions, showing the 4 variables and 3 secrets (values hidden, names + "Updated" timestamps visible).

---

## Step 4 – Commit, push, and open a Pull Request

Work on a feature branch so the change genuinely arrives via a **pull
request**, as the task requires:

```powershell
cd "week08-8.2P"
git checkout -b feature/cd-header-update
git add .github/workflows/04-deploy-production.yml frontend/src/components/Header.jsx terraform SETUP-8.2P.md
git commit -m "Task 8.2P: automate production deployment; update header for CD demo"
git push origin feature/cd-header-update
```

Then in GitHub: **Pull requests → New pull request** → base `main` ←
compare `feature/cd-header-update` → **Create pull request**.

> **[ Screenshot — pull request opened ]** the PR page showing the diff for `Header.jsx` (background colour + text) and `04-deploy-production.yml` (trigger change).

**Merge the PR** into `main`. This is what actually triggers the pipeline —
`01 - CI` runs on the `push` to `main` that the merge creates.

> **[ Screenshot — pull request merged ]** the PR showing "Merged" status.

---

## Step 5 – Watch the fully automated pipeline

In the **Actions** tab, watch all four workflows run **without touching
anything manually**:

```
01 - CI                    (push to main)
   ↓ auto
02 - Deploy to Staging     (workflow_run)
   ↓ auto
03 - Test Staging          (workflow_run)
   ↓ auto   <-- this edge is new; used to require a manual workflow_dispatch
04 - Deploy to Production  (workflow_run)
```

> **[ Screenshot — 01 CI green ]** all matrix legs passed, images pushed.
> **[ Screenshot — 02 Deploy to Staging green ]** triggered automatically by 01.
> **[ Screenshot — 03 Test Staging green ]** triggered automatically by 02.
> **[ Screenshot — 04 Deploy to Production green, with no manual trigger ]** triggered automatically by 03 — the "Triggered via workflow_run" label is visible, not "workflow_dispatch".

---

## Step 6 – Verify the change reached production automatically

```powershell
kubectl get svc frontend -n production -o jsonpath='{.status.loadBalancer.ingress[0].ip}'
# open http://<that-ip> in a browser
```

> **[ Screenshot — production frontend showing the new header ]** browser at the production frontend URL, green header bar reading "KoalaTech University — Production Release".

Optionally confirm the deployed image tag matches the merge commit SHA:

```powershell
git log -1 --format=%H main
kubectl get deploy frontend -n production -o jsonpath='{.spec.template.spec.containers[0].image}'
# the tag on the end of the image should match the commit SHA above
```

> **[ Screenshot — matching commit SHA and deployed image tag ]**

---

## Step 7 – DELETE EVERYTHING (do this once evidence is captured)

```powershell
cd "week08-8.2P/terraform"
terraform destroy
```

Then confirm nothing was left behind (orphaned managed disks / LoadBalancer
IPs from the PostgreSQL PVCs are not tracked by Terraform):

```powershell
az group show -n sit722-week08-cd 2>$null   # should error / not found
az group list -o table                       # sit722-week08-cd absent
```

If the resource group still exists: `az group delete -n sit722-week08-cd --yes`.

> **[ Screenshot — terraform destroy complete ]** `Destroy complete! N resources destroyed.`
> **[ Screenshot — resource group gone ]** `az group show` returning not found, or Azure Portal → Resource groups no longer listing `sit722-week08-cd`.

Also delete the local `kubeconfig-admin` file if it's still there, and revert
the repository Variables/Secrets back to the Week 08/Week 09 cluster's
values if you plan to use that fork for anything else afterwards (optional).

---

## When you're done

Save every screenshot under `week08-8.2P/screenshots/`, and let me know —
I'll drop them into `System-Documentation.md` and finalise the write-up.
