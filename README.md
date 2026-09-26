# KoalaTech University — Progressive Delivery Pipeline

SIT722 HD Task. The Week 07–10 CI/CD pipeline extended with **blue/green deployment**,
**weighted canary traffic shifting**, and **automated rollback driven by live production
metrics**.

**Setup and demonstration instructions: [`SETUP.md`](SETUP.md).**
The accompanying report is `HD-Task-Documentation.md` in the parent `HDtask/` directory.

---

## What this does

The inherited pipeline deploys with `kubectl set image` and verifies with
`kubectl rollout status`. That asks Kubernetes one question — *did the new pods start?* —
and nothing about whether the release is any good. A fault that only appears under real
traffic passes that gate every time.

`user-service` is now released by a pipeline that:

1. deploys the new image to an **idle slot** receiving no user traffic;
2. **smoke-tests that slot directly**, while no user can reach it;
3. admits real traffic in **weighted steps** — 10% → 50% → 100%;
4. after each step, queries the **live HTTP 5xx rate at the edge** from Prometheus;
5. **reverses the shift and restores the previous image automatically** if the error
   rate breaches threshold, then fails the run.

No human is involved in step 5. The other five services keep the in-place rolling update
from Week 08, deliberately, as the control case.

## Architecture

```
                        ingress-nginx  (LoadBalancer)
                                 |
              host: koalatech.local   path: /api/users(/|$)(.*)
                                 |
        +------------------------+------------------------+
        |                                                 |
  Ingress user-service                      Ingress user-service-canary
  rewrite-target: /$2                       canary: "true"
                                            canary-weight: N
        |                                                 |
  Service user-service                      Service user-service-preview
  selector: app=user-service                selector: app=user-service
            slot=<LIVE>                               slot=<CANDIDATE>
        |                                                 |
  Deployment user-service-blue              Deployment user-service-green
```

The two middle Services name a **role**, not a slot: `user-service` means *whatever is
live*, `user-service-preview` means *whatever is being released*. The Ingresses point at
those names and are never modified — promotion is a swap of two selector values, so
blue→green and green→blue are the same operation.

## Workflows

| Workflow | Trigger | Does |
|---|---|---|
| `01-ci.yml` | push to `main` | test → Docker Scout → push SHA-tagged images to ACR |
| `02-deploy-staging.yml` | after `01` | deploy all services to `staging` |
| `03-staging-test.yml` | after `02` | smoke-test staging |
| `04-deploy-production.yml` | after `03` | rolling update of the **five** other services |
| `05-terraform.yml` | `terraform/**` changes | `fmt` + `validate` (no cloud credentials needed) |
| `06-deploy-monitoring.yml` | manual | install `kube-prometheus-stack` via Helm |
| **`07-progressive-deploy.yml`** | after `04`, or manual | **owns the `user-service` release end to end** |

## Layout

| Path | Contents |
|---|---|
| `terraform/` | AKS, ACR, Storage, and `helm_release.ingress_nginx` |
| `kubernetes/production/`, `kubernetes/staging/` | the five rolling-update services and databases |
| `kubernetes/bluegreen/` | the blue/green slots, role-pinned Services, and Ingress pair |
| `kubernetes/tools/` | the k6 load-generator and smoke-test Jobs |
| `scripts/check-error-rate.sh` | **the rollback gate** — PromQL, fails closed |
| `scripts/smoke-test-slot.sh` | pre-traffic verification of a slot |
| `k6/rollout-load.js` | continuous load for the duration of a rollout |
| `user-service/app/fault_injection.py` | fault injection for the rollback demonstration; inert by default |

## Constraint worth knowing before you start

This student Microsoft Entra tenant **blocks service-principal creation**. Consequently:

- `azure/login` is unusable; all CI `kubectl` auth uses a base64 admin kubeconfig in the
  `KUBE_CONFIG` secret, which works because `local_account_disabled = false`;
- `terraform plan`/`apply` cannot run in CI and are run manually (`05` does
  `fmt`/`validate` only);
- the rollback gate queries the **in-cluster** Prometheus through the API server's
  service proxy rather than Azure Monitor managed Prometheus, whose query API needs an
  Entra token.

## Known risk

`ingress-nginx` was archived upstream in March 2026 and no longer receives security
patches. The chart version is pinned explicitly in `terraform/ingress_nginx.tf` rather
than floating. The migration path is the Gateway API, whose
`HTTPRoute.spec.rules[].backendRefs[].weight` provides weighted routing as a first-class
field. See §8 of `HD-Task-Documentation.md`.
