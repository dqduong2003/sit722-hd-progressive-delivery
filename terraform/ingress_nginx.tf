#
# ingress-nginx: the traffic-management layer for blue/green releases.
#
# Weeks 05-10 exposed the application through a single Service of
# type LoadBalancer. That gives no control over *which fraction* of
# requests reaches a given version - a Service load-balances evenly over
# whatever pods its selector matches. An ingress controller adds a
# programmable HTTP layer in front of the Services, which is what makes a
# weighted canary (10% -> 50% -> 100%) expressible at all.
#
# It is installed here, in Terraform, rather than by a `helm install` in a
# workflow, because it is infrastructure the delivery pipeline *depends on*:
# the pipeline cannot shift traffic if the thing that shifts traffic is not
# there. Compare 06-deploy-monitoring.yml, where the monitoring stack is
# deliberately a separate manually-triggered workflow because it is
# observability, not a delivery dependency.
#
# --- KNOWN RISK -------------------------------------------------------
# The ingress-nginx project was archived in March 2026 and no longer
# receives security patches. The chart version below is therefore pinned
# explicitly rather than floating, so the deployed version is a recorded,
# reviewable decision. The migration path is the Gateway API, whose
# HTTPRoute.spec.rules[].backendRefs[].weight field provides native
# weighted routing without annotations. See HD-Task-Documentation.md,
# "Known risk and migration path".
# ----------------------------------------------------------------------
#
resource "helm_release" "ingress_nginx" {
  name       = "ingress-nginx"
  repository = "https://kubernetes.github.io/ingress-nginx"
  chart      = "ingress-nginx"
  version    = var.ingress_nginx_chart_version

  namespace        = "ingress-nginx"
  create_namespace = true

  wait    = true
  timeout = 600

  # Helm provider v3 takes `set` as a list attribute. In v2 it was a
  # repeated block (`set { name = ... }`). Most examples online are still
  # v2 and fail here with `Blocks of type "set" are not expected`.
  set = [
    # The controller's Prometheus metrics are DISABLED by default. Without
    # this the nginx_ingress_controller_requests series does not exist at
    # all, and the automated rollback has nothing to measure.
    {
      name  = "controller.metrics.enabled"
      value = "true"
    },

    # Create a ServiceMonitor so the existing kube-prometheus-stack scrapes
    # the controller.
    {
      name  = "controller.metrics.serviceMonitor.enabled"
      value = "true"
    },

    # kube-prometheus-stack defaults `serviceMonitorSelectorNilUsesHelmValues`
    # to true, which makes its Prometheus select only ServiceMonitors
    # labelled `release: <its own Helm release name>`. That release is named
    # `prometheus` (see 06-deploy-monitoring.yml). Without this label the
    # ServiceMonitor is created, looks correct, and is silently never
    # scraped.
    {
      name  = "controller.metrics.serviceMonitor.additionalLabels.release"
      value = "prometheus"
    },

    # The scrape target carries its own `namespace="ingress-nginx"` label. By
    # default Prometheus resolves that clash by renaming the metric's label
    # to `exported_namespace`, so `namespace="production"` matches nothing
    # and the rollback gate fails closed with "no request-rate data".
    # honorLabels keeps the metric's own namespace.
    {
      name  = "controller.metrics.serviceMonitor.honorLabels"
      value = "true"
    },

    # The chart default is 30s. The rollback gate evaluates rate(...[2m]),
    # which at 30s yields only four samples - a single missed scrape can
    # produce NaN and make a healthy-looking result out of no data. 15s
    # doubles the sample count in the same window.
    {
      name  = "controller.metrics.serviceMonitor.scrapeInterval"
      value = "15s"
    },

    # The admission webhook runs as a Job that `helm --wait` blocks on. On
    # this lab cluster - which already runs six services, five PostgreSQL
    # instances and the full kube-prometheus-stack - that Job may not be
    # schedulable, leaving the apply hanging until it times out. The webhook
    # only validates Ingress objects before admission; the Ingresses here
    # are version-controlled and applied by the pipeline, so the validation
    # it provides is redundant.
    {
      name  = "controller.admissionWebhooks.enabled"
      value = "false"
    },

    {
      name  = "controller.service.type"
      value = "LoadBalancer"
    },

    {
      name  = "controller.replicaCount"
      value = "1"
    }
  ]
}
