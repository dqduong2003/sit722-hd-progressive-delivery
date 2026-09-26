# Week 08 – Setup Runbook (student-tenant / no service principal)

This runbook replaces the parts of `README.md` that assume you can create an Azure
**service principal**. A student Microsoft Entra tenant (Swinburne / Deakin) blocks
app registration, so the four workflows have been rewritten to authenticate without one:

| README assumes | This repo uses instead |
| --- | --- |
| `AZURE_CREDENTIALS` service-principal JSON + `azure/login` | removed |
| `az acr login` (needs `azure/login`) | `docker/login-action@v4` with the ACR **admin** username/password |
| `az aks get-credentials` (needs `azure/login`) | a certificate-based **admin kubeconfig** stored as the `KUBE_CONFIG` secret |

Everything else (Terraform infra, Kubernetes manifests, promotion flow) is unchanged.
All Azure resources are created on your existing **Azure for Students** subscription,
where you are **Owner** – no pay-as-you-go account needed.

> **Cost:** ~USD $13/day while the cluster runs. Do the whole practical in one session
> and run **Step 7 (teardown)** immediately after. One session ≈ USD $3–4.

---

## Prerequisites

```powershell
# Terraform (not currently installed)
winget install HashiCorp.Terraform
# then restart the terminal and check:
terraform version

az version        # Azure CLI - already installed
kubectl version --client
az login          # sign in to the Azure for Students subscription
az account show   # confirm the right subscription is active
```

---

## Step 1 – Provision the infrastructure (you run this)

```powershell
cd "week08/terraform"
Copy-Item terraform.tfvars.example terraform.tfvars
# edit terraform.tfvars: pick GLOBALLY-UNIQUE acr_name and storage_account_name
notepad terraform.tfvars

terraform init
terraform plan -out tfplan
terraform apply tfplan
```

Creates: resource group, ACR (Basic, admin enabled), Storage account + 2 blob
containers, AKS cluster (**3 nodes**), and an `AcrPull` role assignment so AKS can
pull images.

Verify the node count (README §2):

```powershell
az aks get-credentials --resource-group (terraform output -raw resource_group_name) `
  --name (terraform output -raw aks_cluster_name) --overwrite-existing
kubectl get nodes        # expect 3 nodes, STATUS Ready
```

---

## Step 2 – Collect the values (you run this)

Run each command in `week08/terraform` and keep the output:

```powershell
terraform output -raw acr_name                    # -> GitHub variable ACR_NAME
terraform output -raw acr_login_server            # -> GitHub variable ACR_LOGIN_SERVER
terraform output -raw resource_group_name         # -> GitHub variable AKS_RESOURCE_GROUP
terraform output -raw aks_cluster_name            # -> GitHub variable AKS_CLUSTER_NAME
terraform output -raw acr_admin_username          # -> GitHub secret  ACR_USERNAME
terraform output -raw acr_admin_password          # -> GitHub secret  ACR_PASSWORD
terraform output -raw storage_connection_string   # -> environment secret AZURE_STORAGE_CONNECTION_STRING
```

Build the `KUBE_CONFIG` secret (single-line base64 of an admin kubeconfig):

```powershell
az aks get-credentials `
  --resource-group (terraform output -raw resource_group_name) `
  --name (terraform output -raw aks_cluster_name) `
  --admin --file ./kubeconfig-admin

[Convert]::ToBase64String([IO.File]::ReadAllBytes("$PWD\kubeconfig-admin"))
# copy the whole base64 string -> GitHub secret KUBE_CONFIG
```

`kubeconfig-admin` is git-ignored. Delete it after you have the base64 string.

---

## Step 3 – Configure GitHub (you do this in the browser)

Repo → **Settings → Secrets and variables → Actions**.

### Repository *Variables* (Variables tab)

| Name | Value |
| --- | --- |
| `ACR_NAME` | `terraform output -raw acr_name` |
| `ACR_LOGIN_SERVER` | `terraform output -raw acr_login_server` |
| `AKS_RESOURCE_GROUP` | `terraform output -raw resource_group_name` |
| `AKS_CLUSTER_NAME` | `terraform output -raw aks_cluster_name` |

### Repository *Secrets* (Secrets tab)

| Name | Value |
| --- | --- |
| `ACR_USERNAME` | `terraform output -raw acr_admin_username` |
| `ACR_PASSWORD` | `terraform output -raw acr_admin_password` |
| `KUBE_CONFIG` | the base64 string from Step 2 |

> Do **not** create `AZURE_CREDENTIALS` – it is no longer used.

### GitHub *Environments* (Settings → Environments → New environment)

Create **`staging`** and **`production`**. Add these **7 Environment secrets to each**
(identical names; values are the same for both except you may reuse the one storage account):

| Name | Value |
| --- | --- |
| `POSTGRES_USER` | `postgres` |
| `POSTGRES_PASSWORD` | `postgres` |
| `JWT_SECRET_KEY` | `koalatech-local-development-secret` |
| `DEFAULT_ADMIN_USERNAME` | `admin` |
| `DEFAULT_ADMIN_EMAIL` | `admin@koalatech.edu.au` |
| `DEFAULT_ADMIN_PASSWORD` | `AdminPassword123!` |
| `AZURE_STORAGE_CONNECTION_STRING` | `terraform output -raw storage_connection_string` |

Final configuration checklist:

- [ ] 4 repository variables
- [ ] 3 repository secrets (`ACR_USERNAME`, `ACR_PASSWORD`, `KUBE_CONFIG`)
- [ ] `staging` environment with 7 secrets
- [ ] `production` environment with 7 secrets
- [ ] Actions enabled on the fork (Actions tab → "I understand my workflows, enable them")

---

## Step 4 – Run the staging pipeline (you do this)

Commit the new/changed files and push to `main` on your fork:

```powershell
cd "week08"
git add terraform .github/workflows .gitignore SETUP.md
git commit -m "week08: terraform infra + workflows without service principal"
git push origin main
```

The push triggers the chain automatically:

1. **01 - CI** – tests the 5 backend services, then builds & pushes 6 images tagged with the commit SHA.
2. **02 - Deploy to Staging** – runs on `01 - CI` success: loads `KUBE_CONFIG`, creates the `staging` namespace + secrets, applies `kubernetes/staging/`, sets each Deployment to the SHA-tagged image, waits for rollouts.
3. **03 - Test Staging** – runs on `02` success: waits for the `frontend` LoadBalancer IP and `curl`s it.

Watch all three go green in the **Actions** tab (README §12).

Then verify staging manually:

```powershell
kubectl get pods,svc,pvc -n staging
kubectl get svc frontend -n staging -o jsonpath='{.status.loadBalancer.ingress[0].ip}'
# open http://<that-ip> in a browser
```

---

## Step 5 – Deploy to Production (you do this – manual, README §13)

Get the SHA that passed staging:

```powershell
git rev-parse HEAD
```

GitHub → **Actions → 04 - Deploy to Production → Run workflow** → paste that SHA as
`image_tag` → **Run workflow**.

Production reuses the **same images** already in ACR – nothing is rebuilt.

---

## Step 6 – Verify Production (README §14)

```powershell
kubectl get pods,svc,pvc -n production
kubectl get svc frontend -n production -o jsonpath='{.status.loadBalancer.ingress[0].ip}'
# open http://<that-ip>

# confirm prod runs the SHA you tested in staging:
kubectl get deploy -n production -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.spec.template.spec.containers[0].image}{"\n"}{end}'
```

---

## Step 7 – DELETE EVERYTHING (do this the moment evidence is captured)

```powershell
cd "week08/terraform"
terraform destroy
```

`terraform destroy` removes the RG, AKS, ACR and Storage. The PostgreSQL PVCs create
Azure **managed disks** that Terraform does not track, so also confirm the resource
group is gone (this catches orphaned disks / LoadBalancer IPs that keep billing):

```powershell
az group show -n (terraform output -raw resource_group_name) 2>$null   # should error / not found
az group list -o table
```

If the RG still exists: `az group delete -n <rg> --yes`.

Also delete the GitHub secrets/variables and the `kubeconfig-admin` file.

---

## Mapping to README steps

| README step | Where it's handled |
| --- | --- |
| §2 Prepare infrastructure (Terraform, `node_count = 3`) | `week08/terraform/` – Step 1 |
| §4 Fork & clone | done |
| §5 Service principal + `AZURE_CREDENTIALS` | **N/A** – replaced by ACR admin creds + `KUBE_CONFIG` (Steps 2–3) |
| §6 Repository variables | Step 3 |
| §7 Repository secret | Step 3 (`ACR_USERNAME` / `ACR_PASSWORD` / `KUBE_CONFIG` instead of `AZURE_CREDENTIALS`) |
| §8–9 `staging` / `production` environments | Step 3 |
| §10 Configuration summary | Step 3 checklist |
| §11 Workflow files | `.github/workflows/01..04` – rewritten, no service principal |
| §12 Run & verify staging | Step 4 |
| §13 Deploy to production | Step 5 |
| §14 Verify production | Step 6 |

## Note for your submission

Document that Week 08's `AZURE_CREDENTIALS` service principal could not be created
(student Entra tenant blocks app registration – shown in Week 07), so the pipeline
authenticates with (a) the ACR admin username/password for image push and (b) a
certificate-based admin `kubeconfig` (`KUBE_CONFIG` secret) for AKS access. This is a
lab-only compromise: the production-correct approach is OIDC workload-identity
federation between GitHub and Entra, or a service principal limited to `AcrPush` +
`Azure Kubernetes Service Cluster User` roles.
