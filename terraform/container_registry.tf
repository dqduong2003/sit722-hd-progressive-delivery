resource "azurerm_container_registry" "acr" {
  name                = var.acr_name
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location

  sku = "Basic"

  # Admin user is enabled so GitHub Actions can authenticate to the registry
  # with a username/password (see 01-ci.yml). A student Microsoft Entra tenant
  # blocks service-principal creation, so the admin credential replaces the
  # service principal for the "docker push to ACR" step.
  admin_enabled = true

  tags = merge(
    var.tags,
    {
      Environment = var.environment
    }
  )
}
