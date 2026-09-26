resource "azurerm_kubernetes_cluster" "aks" {
  name                = var.aks_cluster_name
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  dns_prefix          = var.aks_dns_prefix
  kubernetes_version  = var.kubernetes_version

  default_node_pool {
    name       = "default"
    node_count = var.aks_node_count
    vm_size    = var.aks_node_vm_size
  }

  identity {
    type = "SystemAssigned"
  }

  # Local (certificate-based) admin accounts stay enabled so an admin
  # kubeconfig can be exported and used by GitHub Actions without Entra.
  local_account_disabled = false

  tags = merge(
    var.tags,
    {
      Environment = var.environment
    }
  )
}

#
# Allow the AKS kubelet identity to pull images from the Container Registry,
# so the Kubernetes Deployments can pull koalatech-* images without an
# imagePullSecret.
#
resource "azurerm_role_assignment" "acr_pull" {
  principal_id                     = azurerm_kubernetes_cluster.aks.kubelet_identity[0].object_id
  role_definition_name             = "AcrPull"
  scope                            = azurerm_container_registry.acr.id
  skip_service_principal_aad_check = true
}
