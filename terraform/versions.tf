terraform {
  required_version = ">= 1.7.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0"
    }

    # New for the HD task: the ingress controller that provides the
    # blue/green traffic-management layer is installed as a Helm release
    # managed by Terraform, so the delivery infrastructure is provisioned
    # by the same `terraform apply` as the cluster itself.
    helm = {
      source  = "hashicorp/helm"
      version = "~> 3.0"
    }

    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.30"
    }
  }
}

provider "azurerm" {
  features {}
}

#
# Both the Helm and Kubernetes providers authenticate with the cluster's
# certificate-based *admin* credentials (`kube_config`). Local accounts are
# enabled (`local_account_disabled = false` in `kubernetes_service.tf`) and
# Azure AD RBAC is not configured, so `kube_config` carries the admin client
# certificate. (`kube_admin_config` is only populated when AAD RBAC is on,
# and is empty here.)
#
# That is the same constraint that shapes the whole pipeline: this student
# Entra tenant blocks service-principal creation, so neither Terraform nor
# GitHub Actions can obtain an Entra token for the cluster. The admin
# kubeconfig is the one credential path available, and it is what the
# KUBE_CONFIG repository secret is built from as well.
#
# Note the provider configuration depends on attributes of a resource in
# this same configuration. On a from-scratch apply those attributes are
# unknown at plan time, so the cluster must be created first:
#
#   terraform apply -target=azurerm_kubernetes_cluster.aks
#   <install kube-prometheus-stack - see the note below>
#   terraform apply
#
# This is a known and still-current limitation of provider configuration in
# Terraform, not a defect in this configuration. On PowerShell, quote the
# target so the dot is not split: -target="azurerm_kubernetes_cluster.aks".
#
# Between the two stages, install kube-prometheus-stack (the same Helm release
# that workflow 06 installs). The ingress release below creates a
# ServiceMonitor, and that CRD ships with kube-prometheus-stack - without it
# stage 2 fails with `no matches for kind "ServiceMonitor"`:
#
#   helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
#   helm upgrade --install prometheus prometheus-community/kube-prometheus-stack --namespace monitoring --create-namespace --wait
#
provider "helm" {
  kubernetes = {
    host                   = azurerm_kubernetes_cluster.aks.kube_config[0].host
    client_certificate     = base64decode(azurerm_kubernetes_cluster.aks.kube_config[0].client_certificate)
    client_key             = base64decode(azurerm_kubernetes_cluster.aks.kube_config[0].client_key)
    cluster_ca_certificate = base64decode(azurerm_kubernetes_cluster.aks.kube_config[0].cluster_ca_certificate)
  }
}

provider "kubernetes" {
  host                   = azurerm_kubernetes_cluster.aks.kube_config[0].host
  client_certificate     = base64decode(azurerm_kubernetes_cluster.aks.kube_config[0].client_certificate)
  client_key             = base64decode(azurerm_kubernetes_cluster.aks.kube_config[0].client_key)
  cluster_ca_certificate = base64decode(azurerm_kubernetes_cluster.aks.kube_config[0].cluster_ca_certificate)
}
