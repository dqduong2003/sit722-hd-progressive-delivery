# SETUP — Progressive Delivery with Blue/Green and Automated Rollback

Runbook for the steps a human performs. Everything else is done by the pipeline.

This is the **only** setup document for this repository and is self-contained: it covers
provisioning, GitHub configuration, monitoring, the three demonstration scenarios, and
teardown.

---

## 0. Prerequisites

| Requirement | Notes |
|---|---|
| Azure subscription with quota for AKS + 2 public IPs | The ingress controller adds a **second** LoadBalancer IP alongside the existing `frontend` Service |
| Terraform ≥ 1.7 | The `helm` provider v3 needs plugin protocol v6 |
| `kubectl`, `az`, `helm`, `jq` | |
| A GitHub fork of this repository with Actions enabled | Actions tab → "I understand my workflows, enable them" |

```powershell
winget install Hashicorp.Terraform
winget install Helm.Helm
# restart the terminal, then confirm:
terraform version; helm version; kubectl version --client; az version
```

### Node headroom — check this before anything else

The cluster runs six application services, five PostgreSQL instances and the full
`kube-prometheus-stack`. This project adds an ingress controller, a second
`user-service` Deployment, a k6 Job and a smoke-test Job.

```bash
kubectl describe node | grep -A5 "Allocated resources"
```

If the nodes are tight, raise `aks_node_count` in `terraform/terraform.tfvars` before
applying. A `helm --wait` that hangs because nothing can be scheduled is the most
time-consuming failure in this whole setup.

---

## 1. Provision the infrastructure — two-stage apply

The `helm` and `kubernetes` providers are configured from
`azurerm_kubernetes_cluster.aks.kube_admin_config[0]`. On a **from-scratch** apply those
attributes are unknown at plan time, so the cluster must exist before Terraform can
configure the providers that install things into it.

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
# edit terraform.tfvars: acr_name and storage_account_name must be GLOBALLY unique
terraform init

# Stage 1 — the cluster and the rest of the Azure infrastructure.
terraform apply -target=azurerm_kubernetes_cluster.aks

# Stage 2 — everything, including the ingress controller Helm release.
terraform apply
```

> **[Screenshot 1]** Stage 2 `terraform apply` completing, with
> `helm_release.ingress_nginx` created.

Against an **existing** cluster a single `terraform apply` is enough — the two-stage
sequence is only needed the first time.

`terraform fmt -check`, `terraform init -backend=false` and `terraform validate` all
work with no cluster and no credentials, which is why `05-terraform.yml` runs unchanged
in CI.

---

## 2. Collect the values and configure GitHub

### 2.1 Export the admin kubeconfig

A student Entra tenant blocks the service principal that `azure/login` needs, so every
workflow authenticates to the cluster with a certificate-based admin kubeconfig. This
works because `terraform/kubernetes_service.tf` sets `local_account_disabled = false` —
the same property that makes `kube_admin_config` available to the Terraform `helm`
provider in §1.

```bash
cd terraform
terraform output -raw get_kubeconfig_command     # prints the exact command
az aks get-credentials --resource-group <rg> --name <aks> --admin --file ./kubeconfig-admin
base64 -w0 ./kubeconfig-admin                    # -> GitHub secret KUBE_CONFIG
```

On Windows PowerShell:

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("./kubeconfig-admin"))
```

`kubeconfig-admin` is a cluster-admin credential. `.gitignore` already excludes
`kubeconfig-*`; confirm it never enters git history.

### 2.2 Repository Variables

Repo → **Settings → Secrets and variables → Actions → Variables**.

| Name | Value |
|---|---|
| `ACR_NAME` | `terraform output -raw acr_name` |
| `ACR_LOGIN_SERVER` | `terraform output -raw acr_login_server` |
| `AKS_RESOURCE_GROUP` | `terraform output -raw resource_group_name` |
| `AKS_CLUSTER_NAME` | `terraform output -raw aks_cluster_name` |

### 2.3 Repository Secrets

| Name | Value |
|---|---|
| `ACR_USERNAME` | `terraform output -raw acr_admin_username` |
| `ACR_PASSWORD` | `terraform output -raw acr_admin_password` |
| `KUBE_CONFIG` | the base64 string from §2.1 |

> Do **not** create `AZURE_CREDENTIALS`. No workflow uses it, and the tenant cannot
> produce the service principal it would hold.

### 2.4 Environments

**Settings → Environments → New environment**. Create `staging` and `production`, and
add these **7 secrets to each** (identical names and values):

| Name | Value |
|---|---|
| `POSTGRES_USER` | `postgres` |
| `POSTGRES_PASSWORD` | `postgres` |
| `JWT_SECRET_KEY` | `koalatech-local-development-secret` |
| `DEFAULT_ADMIN_USERNAME` | `admin` |
| `DEFAULT_ADMIN_EMAIL` | `admin@koalatech.edu.au` |
| `DEFAULT_ADMIN_PASSWORD` | `AdminPassword123!` |
| `AZURE_STORAGE_CONNECTION_STRING` | `terraform output -raw storage_connection_string` |

`DEFAULT_ADMIN_USERNAME` and `DEFAULT_ADMIN_PASSWORD` matter beyond seeding: the
pre-traffic smoke test reads them from the in-cluster `application-secret` to
authenticate against the candidate slot.

### 2.5 Checklist

- [ ] 4 repository variables
- [ ] 3 repository secrets
- [ ] `staging` environment with 7 secrets
- [ ] `production` environment with 7 secrets
- [ ] Actions enabled on the fork

---

## 3. Install the monitoring stack

```bash
gh workflow run "06 - Deploy Monitoring (Prometheus & Grafana)"
```

The Helm release **must be named `prometheus`** — `terraform/ingress_nginx.tf` labels
the ingress controller's ServiceMonitor `release: prometheus` to match
`kube-prometheus-stack`'s default selector. A different release name means the
ServiceMonitor is created, looks entirely correct, and is never scraped.

---

## 4. Verify the metrics path before releasing anything

The rollback gate fails closed, so a broken metrics path causes spurious rollbacks. Ten
minutes here saves a confusing failed release later.

```bash
# The ServiceMonitor exists and carries the selector label.
kubectl get servicemonitor -n ingress-nginx --show-labels

# Prometheus is actually scraping it.
kubectl get --raw \
  "/api/v1/namespaces/monitoring/services/prometheus-kube-prometheus-prometheus:9090/proxy/api/v1/targets" \
  | jq '[.data.activeTargets[] | select((.labels.job // "") | test("ingress-nginx"))] | {count: length, health: (.[0].health // "none")}'
```

> **[Screenshot 2]** ServiceMonitor with `release=prometheus`, and the `ingress-nginx`
> target reporting `up`.

### Confirm the idle value of the `canary` label

The gate matches `canary!="-",canary!=""` because the empty-state representation varies
by controller version. Confirm what yours emits once, after some traffic has flowed:

```bash
Q='nginx_ingress_controller_requests{namespace="production",ingress="user-service"}'
kubectl get --raw \
  "/api/v1/namespaces/monitoring/services/prometheus-kube-prometheus-prometheus:9090/proxy/api/v1/query?query=$(jq -rn --arg q "$Q" '$q|@uri')" \
  | jq -r '.data.result[].metric.canary' | sort -u
```

If it emits something other than `-` or `""`, adjust `CANARY_SELECTOR` in
`scripts/check-error-rate.sh`.

---

## 5. First release — bootstrap

The first run of `07` creates both slots, the routing Services and the Ingresses, then
proceeds with a normal release. Blue is live, green is the candidate.

```bash
gh workflow run "07 - Progressive Deploy (Blue/Green)" -f fault_injection=off
```

After it completes:

```bash
kubectl get deploy,svc,ingress -n production -l app=user-service
kubectl get svc user-service -n production -o jsonpath='{.spec.selector.slot}'; echo

INGRESS_IP=$(kubectl get svc ingress-nginx-controller -n ingress-nginx \
  -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
curl -H "Host: koalatech.local" "http://$INGRESS_IP/api/users/"
```

The `Host` header is required — both Ingress objects declare `koalatech.local`, and a
request without it matches no rule and returns 404. This is deliberate: a fixed fake
host removes any DNS dependency from the demonstration.

---

## 6. The three demonstration scenarios

All are triggered from the Actions tab or with `gh workflow run`. Each takes roughly
8–12 minutes, dominated by the 100 s hold at each canary weight.

### 6.1 Happy path

```bash
gh workflow run "07 - Progressive Deploy (Blue/Green)" -f fault_injection=off
```

Expect: candidate deployed → smoke test passes → 10% → 50% → 100%, gate passing after
each → promotion. k6 reports **0 failed requests**.

> **[Screenshot 3]** The full job graph, green, with the traffic-shift step expanded to
> show the three gate evaluations.
> **[Screenshot 4]** The k6 summary block: total requests, 0.00% failed.

### 6.2 Rollback before any user traffic

```bash
gh workflow run "07 - Progressive Deploy (Blue/Green)" -f fault_injection=immediate
```

Expect: the smoke test fails against the idle slot. `canary-weight` never leaves 0, so
no user request ever reaches the broken build. The rollback job restores the candidate
slot and fails the run.

> **[Screenshot 5]** The smoke-test job output showing the failure, and `canary-weight`
> still 0.

### 6.3 Rollback under live traffic — the headline scenario

```bash
gh workflow run "07 - Progressive Deploy (Blue/Green)" -f fault_injection=delayed:150
```

Expect: the candidate is healthy through the smoke test, takes 10% of real traffic, and
only then starts returning 500s. The gate's candidate-only ratio climbs to ~1.0 against
a 0.05 threshold, `canary-weight` returns to 0, the previous image is restored, and the
run is marked failed.

**Watch it live** in a second terminal — this is the most compelling part of the demo:

```bash
INGRESS_IP=$(kubectl get svc ingress-nginx-controller -n ingress-nginx \
  -o jsonpath='{.status.loadBalancer.ingress[0].ip}')

while true; do
  printf '%s  ' "$(date +%T)"
  curl -s -o /dev/null -w '%{http_code}\n' -H "Host: koalatech.local" \
    "http://$INGRESS_IP/api/users/"
  sleep 0.5
done
```

You will see a run of 200s, then roughly one 500 in ten once the fault fires at 10%
weight, then unbroken 200s again the moment the gate trips and the weight returns to 0.

And the pod's own account of it:

```bash
kubectl logs -n production -l app=user-service --prefix --tail=100 | grep "FAULT INJECTION"
```

> **[Screenshot 6]** `FAULT INJECTION ARMED` then `FAULT INJECTION FIRING` in the pod log.
> **[Screenshot 7]** The gate step output: candidate ratio ~1.0 vs threshold 0.05.
> **[Screenshot 8]** The curl loop showing 200s → intermittent 500s → 200s.
> **[Screenshot 9]** The workflow summary: "Automated rollback executed", run red.

### 6.4 Symmetry check

Run 6.1 again straight afterwards. It should release green → blue with no Ingress
edited, proving the topology is reusable rather than a one-shot arrangement.

> **[Screenshot 10]** The second release's plan summary showing the slots reversed.

---

## 7. Grafana panel for the write-up

Get the admin password (username is always `admin`):

```powershell
[System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String(
  (kubectl --namespace monitoring get secret prometheus-grafana -o jsonpath="{.data.admin-password}")
))
```

```bash
kubectl get secret prometheus-grafana -n monitoring \
  -o jsonpath='{.data.admin-password}' | base64 -d; echo
```

Port-forward and log in at **http://localhost:3000**:

```bash
kubectl port-forward svc/prometheus-grafana -n monitoring 3000:80
```

Then use **Explore** with:

```promql
sum(rate(nginx_ingress_controller_requests{namespace="production",ingress="user-service",status=~"5.."}[2m]))
/
sum(rate(nginx_ingress_controller_requests{namespace="production",ingress="user-service"}[2m]))
```

Set the time range to cover both demonstration runs: the happy path is a flat line at
zero, the rollback run is a spike that returns to zero without anyone intervening.

> **[Screenshot 11]** The edge 5xx rate across both runs.

---

## 8. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Gate fails with "no request-rate data" | Prometheus is not scraping the controller | §4. Check `controller.metrics.enabled=true` and the `release=prometheus` label |
| Gate fails with "request rate below minimum" | The k6 Job did not start, or finished early | `kubectl logs job/k6-rollout-load -n production`; check `DURATION` exceeds the total rollout time |
| Every request returns 404 | Missing or wrong `Host` header, or `ingressClassName` absent | Send `-H "Host: koalatech.local"`; `kubectl describe ingress user-service -n production` |
| Canary weight has no effect | Stable and canary Ingress host/path differ | They must match **exactly**; compare both with `kubectl get ingress -o yaml` |
| Controller logs `no alternative balancer for backend` | The preview slot has no ready endpoints | Never scale a slot to 0. `kubectl get endpoints user-service-preview -n production` |
| `terraform apply` fails on the helm provider from scratch | Provider configured from an unbuilt resource | Use the two-stage apply in §1 |
| `Blocks of type "set" are not expected here` | A v2 helm-provider example was copied in | v3 uses attributes: `set = [{ name = ..., value = ... }]` |
| `helm --wait` hangs on the ingress release | Nothing schedulable | Node headroom, §0. The admission webhook is already disabled |
| Smoke test fails with "no access token" | Environment secrets missing or wrong | §2.4. The in-cluster `application-secret` is built from them by `04-deploy-production.yml` |

---

## 9. Teardown

Do this the moment evidence is captured — an AKS cluster with two public IPs is the
expensive part.

```bash
kubectl delete -f kubernetes/bluegreen/
cd terraform && terraform destroy
```

`terraform destroy` removes the ingress controller's LoadBalancer with the release. If
the resource group is deleted directly instead, check that **both** public IPs went with
it.
