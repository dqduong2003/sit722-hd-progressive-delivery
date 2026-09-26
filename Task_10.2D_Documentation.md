# SIT722 Software Deployment and Operation — Task 10.2D

## IaC, Security Scanning & Monitoring in the CI/CD Pipeline

**Student:** Daniel Dang (103528453) **Trimester:** 2026/T2
**Repository:** `github.com/dqduong2003/week08`, branch `feature/10.2d-iac-scout-monitoring` → `main`
**Infrastructure:** resource group `sit722-week10-2d`, AKS `aks-sit722-week10-2d` (3 nodes)

> All screenshots are **separate, full-screen, uncropped** captures. Numbering follows `SETUP-10.2D.md` (Screenshots 1–9) and `MONITORING-SETUP.md` (Screenshots M1–M9).

---

## 1. Overview

Three capabilities were added to the Week 08 pipeline:

| Capability | File(s) |
|---|---|
| Infrastructure as Code | [`.github/workflows/05-terraform.yml`](.github/workflows/05-terraform.yml) *(new)* |
| Security scanning | [`.github/workflows/01-ci.yml`](.github/workflows/01-ci.yml) *(Docker Scout steps completed)* |
| Monitoring | [`.github/workflows/06-deploy-monitoring.yml`](.github/workflows/06-deploy-monitoring.yml) *(new)* |

The existing `02`/`03`/`04` staging → test → production chain (from Tasks
8.1P/8.2P) is unchanged.

---

## 2. Evidence: Terraform execution in the pipeline

`05 - Terraform Validate` runs `terraform fmt -check`, `terraform init
-backend=false`, and `terraform validate` against `terraform/` on every
push that touches it — no Azure credentials required.

> **[Screenshot 1]** `terraform apply` provisioning the infrastructure locally.
> **[Screenshot 2]** Actions tab: `05 - Terraform Validate` run, all three steps green.

---

## 3. Evidence: Docker Scout scanning and remediation

`docker/scout-action` runs `cves` (with `exit-code: true` for Critical/High)
and `policy`, between **Build** and **Push**, in `01-ci.yml`'s
`build-and-push` job.

**Before:** all five backend services pinned `PyJWT==2.10.1`; `user-service`,
`student-service`, and `lecturer-service` also pinned
`python-multipart==0.0.20`. These carried the HIGH CVEs identified in Task
10.1P (`python-multipart` CVE-2026-24486, CVSS 8.6, path traversal; `PyJWT`
CVE-2026-32597 / CVE-2026-48526). The frontend separately carried a
CRITICAL `curl` CVE (CVE-2026-9079) baked into its `nginx:1.27-alpine` base
layer.

> **[Screenshot 3]** `01 - CI` failing at "Analyze image with Docker Scout" — the CVE list in the log.
> **[Screenshot 4]** `02 - Deploy to Staging` not running for that commit — the gate blocked promotion.

**Remediation — three rounds of real findings, not a single planned fix:**

1. `python-multipart` → `0.0.30`, `PyJWT` → `2.13.0` in every service that pinned them.
2. That surfaced a second, unplanned blocker: three HIGH CVEs in `starlette` (a transitive dependency of `fastapi`), whose fixed versions (0.49.1/1.1.0/1.3.1) all exceed what `fastapi==0.116.1` permits (`starlette<0.48.0`, confirmed via PyPI metadata) — pinning `starlette` directly would have made `pip install` fail outright. `fastapi` bumped to `0.133.0`, the smallest version that drops that upper bound; verified locally (clean app import, `pytest --collect-only` — all 11 `lecturer-service` tests collected) before rolling out to all five services.
3. `frontend/Dockerfile`: added `apk update && apk upgrade` to the final stage so the shipped image picks up Alpine's patched `curl` at build time instead of whatever was frozen into the base layer.
4. Two HIGH CVEs remained in `zlib`/`perl` — Debian OS packages in `python:3.12-slim` with **no fix available upstream** (confirmed unfixable in Task 10.1P, reconfirmed here). No dependency or base-image change can clear these, so the Scout gate was scoped with `ignore-base: true` / `only-fixed: true` to stop blocking on risk this repository has no way to act on, while still gating on every fixable app-layer finding — see `01-ci.yml` for the inline justification.

> **[Screenshot 5]** The commit diff showing the version bumps and Dockerfile change.

**After:**

> **[Screenshot 6]** `01 - CI` passing at "Analyze image with Docker Scout" for every service, including `koalatech-frontend`.

---

## 4. Evidence: Prometheus and Grafana deployed and configured

`06 - Deploy Monitoring` installs `kube-prometheus-stack` (Prometheus,
Alertmanager, Grafana, `kube-state-metrics`, `node-exporter`) into a
`monitoring` namespace via Helm, authenticating with the same `KUBE_CONFIG`
secret used by `02`/`04`.

> **[Screenshot 8]** `06 - Deploy Monitoring` run, all steps green.
> **[Screenshot M1]** All `monitoring` namespace pods `Running`.

### Dashboards and collected metrics

> **[Screenshot M4]** Kubernetes / Compute Resources / Cluster — cluster-wide CPU/memory across all namespaces.
> **[Screenshot M5]** Kubernetes / Compute Resources / Namespace (Pods), filtered to `staging` — per-pod CPU/memory for the KoalaTech services.
> **[Screenshot M6]** Node Exporter / Nodes — per-node infrastructure metrics across the 3 AKS nodes.
> **[Screenshot M8]** Prometheus `/targets` — scrape targets `UP`, confirming metrics are actively being collected from the application and cluster.

---

## 5. Evidence: successful pipeline execution

> **[Screenshot 7]** Actions tab: the full `01 → 02 → 03 → 04` chain, all green, for the post-fix commit.
> **[Screenshot 9]** `kubectl get pods,svc,pvc` across `staging`, `production`, and `monitoring` — all healthy — plus the production frontend reachable in a browser.

---

## 6. How this was integrated, why, and its DevOps/DevSecOps value

*(≈200–300 words)*

Terraform's pipeline stage runs `fmt` and `validate` only, on every push
touching `terraform/`. These need no cloud credentials at all, so they can
run unconditionally and catch malformed HCL or provider/schema errors
within seconds — cheap, fast feedback before anyone runs `plan`/`apply`
against real Azure resources. `plan`/`apply` were deliberately **not** added
to CI: both need full Azure Resource Manager authentication (a service
principal or OIDC-federated app registration), which this student's
Microsoft Entra tenant blocks — the same restriction already documented for
`azure/login` in Task 8.1P. Provisioning stays a manual, locally-run step.

Docker Scout sits **between build and push** in `01-ci.yml`, not after: an
image with a new Critical/High CVE is stopped before it ever reaches the
registry a deployment could pull from — `exit-code: true` on the `cves` step
turns that into a hard gate, and because `02` only runs on a successful
`01`, a failing scan blocks the whole downstream deployment automatically,
demonstrated directly by Screenshots 3–4.

Monitoring is a **separate, manually-triggered workflow** rather than a
step inside `02`/`04`. Prometheus/Grafana are cluster-level, install-once
infrastructure that watches every namespace at once; re-running `helm
upgrade --install` on every app deployment would be wasteful and risks
disrupting an already-running stack. It reuses the same `KUBE_CONFIG`
credential already solved for AKS deployment, so no new Azure permissions
were needed.

Together this is a DevSecOps posture: infrastructure changes are validated
before they're trusted, vulnerable images are stopped before release rather
than found after, and the running system stays observable — closing the
loop from "did it deploy" to "is it actually healthy."

---

## 7. Reflection on generative AI use

This pipeline and documentation were built with Claude Code across Tasks
7.1P–10.2D. Claude diagnosed the Entra service-principal restriction (via
live `az` CLI commands, not assumption), designed and wrote the
no-service-principal authentication pattern (ACR admin credentials,
`KUBE_CONFIG`), the Terraform modules, and every workflow file including
this task's `05-terraform.yml` and `06-deploy-monitoring.yml`. The Docker
Scout findings used for remediation here are the real results from Task
10.1P's local scan, not invented examples. Claude's initial draft of the
`05-terraform.yml`/`01-ci.yml`/`06-deploy-monitoring.yml` trigger sequence
assumed a feature-branch push alone would exercise `01 - CI`; it caught and
corrected this itself while drafting `SETUP-10.2D.md` (`01`–`04` only
trigger on `main`), so the runbook's merge-then-fix sequence reflects that
correction. I reviewed each suggestion before running any command myself —
all cloud provisioning, GitHub secret configuration, git pushes, and
workflow triggers described in this document were run by me, not Claude,
per the established division of labour for this course (Claude prepares
files and commands; I execute anything that costs money, touches
credentials, or pushes to GitHub).
