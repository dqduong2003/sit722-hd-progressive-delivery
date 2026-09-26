output "resource_group_name" {
  description = "Name of the resource group"
  value       = azurerm_resource_group.rg.name
}

output "acr_name" {
  description = "Name of the Azure Container Registry (GitHub variable ACR_NAME)"
  value       = azurerm_container_registry.acr.name
}

output "acr_login_server" {
  description = "Login server of the Azure Container Registry (GitHub variable ACR_LOGIN_SERVER)"
  value       = azurerm_container_registry.acr.login_server
}

output "acr_admin_username" {
  description = "ACR admin username (GitHub secret ACR_USERNAME)"
  value       = azurerm_container_registry.acr.admin_username
  sensitive   = true
}

output "acr_admin_password" {
  description = "ACR admin password (GitHub secret ACR_PASSWORD)"
  value       = azurerm_container_registry.acr.admin_password
  sensitive   = true
}

output "aks_cluster_name" {
  description = "Name of the AKS cluster (GitHub variable AKS_CLUSTER_NAME)"
  value       = azurerm_kubernetes_cluster.aks.name
}

output "aks_resource_group" {
  description = "Resource group of the AKS cluster (GitHub variable AKS_RESOURCE_GROUP)"
  value       = azurerm_resource_group.rg.name
}

output "storage_account_name" {
  description = "Name of the Azure Storage Account"
  value       = azurerm_storage_account.storage_account.name
}

output "storage_connection_string" {
  description = "Connection string for Blob Storage (staging/production env secret AZURE_STORAGE_CONNECTION_STRING)"
  value       = azurerm_storage_account.storage_account.primary_connection_string
  sensitive   = true
}

output "get_kubeconfig_command" {
  description = "Command to export the admin kubeconfig used to build the KUBE_CONFIG GitHub secret"
  value       = "az aks get-credentials --resource-group ${azurerm_resource_group.rg.name} --name ${azurerm_kubernetes_cluster.aks.name} --admin --file ./kubeconfig-admin"
}
