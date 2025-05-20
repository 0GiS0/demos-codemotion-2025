output "resource_group_name" {
  value = azurerm_resource_group.rg.name
}

output "container_app_environment_name" {
  value = azurerm_container_app_environment.env.name
}

output "container_app_name" {
  value = azurerm_container_app.mcp_server.name
}

output "mcp_server_url" {
  value = "https://${azurerm_container_app.mcp_server.ingress[0].fqdn}"
}

output "qdrant_service_name" {
  value = azurerm_container_app.qdrant.name
}

output "deployment_completed" {
  value = "The MCP Server has been successfully deployed to Azure Container Apps!"
}