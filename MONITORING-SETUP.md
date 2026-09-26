# Task 10.2D – Monitoring Runbook (you run this)

This is the local half of the monitoring capability — the install itself
runs in GitHub Actions (**`06 - Deploy Monitoring`**, triggered in Step 4 of
`SETUP-10.2D.md`); what's left is browser-based, so it has to happen on
your machine: getting the Grafana password, port-forwarding, and capturing
dashboard/Prometheus screenshots.

Prerequisite: `06 - Deploy Monitoring` has already run successfully (green
in the Actions tab), and your `kubectl` context points at
`aks-sit722-week10-2d`:

```powershell
az aks get-credentials --resource-group sit722-week10-2d --name aks-sit722-week10-2d --overwrite-existing
kubectl get pods -n monitoring
```

You should see pods for `prometheus-operator`, `prometheus-...-prometheus-0`,
`prometheus-grafana-...`, `prometheus-kube-state-metrics-...`, and one
`prometheus-prometheus-node-exporter-...` **per node** — all `Running`.

> **[Screenshot M1]** Terminal: `kubectl get pods -n monitoring` showing every pod `Running`/`Ready`.

---

## Step 1 – (Optional) Enable Azure Monitor managed Prometheus too

Azure's own managed Prometheus add-on, separate from and complementary to
the self-managed kube-prometheus-stack Helm chart just installed:

```powershell
az aks update --name aks-sit722-week10-2d --resource-group sit722-week10-2d --enable-azure-monitor-metrics
```

> **[Screenshot M2]** Terminal: the command completing, or
> `az aks show -g sit722-week10-2d -n aks-sit722-week10-2d --query "azureMonitorProfile"` showing `metrics.enabled: true`.

---

## Step 2 – Get the Grafana admin password and connect

```powershell
[System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String(
  (kubectl --namespace monitoring get secret prometheus-grafana -o jsonpath="{.data.admin-password}")
))
```

Username is always `admin`. Port-forward Grafana:

```powershell
kubectl --namespace monitoring port-forward svc/prometheus-grafana 3000:80
```

Leave that running, open **http://localhost:3000**, log in.

> **[Screenshot M3]** Browser: Grafana home page after logging in.

---

## Step 3 – Capture dashboards

Open each (use the **last 1 hour** time range so panels have data):

1. **Kubernetes / Compute Resources / Cluster** — cluster-wide CPU/memory across all namespaces.
2. **Kubernetes / Compute Resources / Namespace (Pods)** — filter to `staging`, per-pod CPU/memory for the KoalaTech services.
3. **Node Exporter / Nodes** — per-node infrastructure metrics (CPU, memory, disk, network) across the 3 AKS nodes.
4. **Prometheus / Overview** — Prometheus's own ingestion rate and scrape health.

> **[Screenshot M4]** Cluster Compute Resources dashboard.
> **[Screenshot M5]** Namespace (Pods) dashboard filtered to `staging`.
> **[Screenshot M6]** Node Exporter / Nodes dashboard.
> **[Screenshot M7]** Prometheus Overview dashboard.

---

## Step 4 – Confirm Prometheus is scraping the application directly

```powershell
kubectl --namespace monitoring port-forward svc/prometheus-kube-prometheus-prometheus 9090:9090
```

Open **http://localhost:9090/targets** and confirm targets are `UP`, then on
**Graph** run:

```
kube_pod_container_status_running{namespace="staging"}
```

> **[Screenshot M8]** Prometheus `/targets` page, targets `UP` (including `kubelet`, `node-exporter`, `kube-state-metrics`).
> **[Screenshot M9]** Prometheus query result listing the `staging` KoalaTech pods.

---

## When you're done

Save all screenshots under `week10-10.2D/screenshots/`, then let me know —
I'll drop them into `Task_10.2D_Documentation.md`. Leave the cluster running
until every other evidence step (Terraform CI, Docker Scout before/after,
production still reachable) is also captured, then do Step 7 of
`SETUP-10.2D.md` (teardown).
