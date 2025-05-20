# Create Log Analytics workspace for Container Apps Environment
resource "azurerm_log_analytics_workspace" "law" {
  name                = "law-${var.container_app_environment_name}"
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  sku                 = "PerGB2018"
  retention_in_days   = 30

  tags = {
    Environment = "Demo"
    Project     = "Codemotion2025"
  }
}

# Create Container Apps Environment
resource "azurerm_container_app_environment" "env" {
  name                       = var.container_app_environment_name
  location                   = azurerm_resource_group.rg.location
  resource_group_name        = azurerm_resource_group.rg.name
  log_analytics_workspace_id = azurerm_log_analytics_workspace.law.id

  tags = {
    Environment = "Demo"
    Project     = "Codemotion2025"
  }
}

# Deploy Qdrant as a Container App
resource "azurerm_container_app" "qdrant" {
  name                         = var.qdrant_container_app_name
  container_app_environment_id = azurerm_container_app_environment.env.id
  resource_group_name          = azurerm_resource_group.rg.name
  revision_mode                = "Single"

  template {
    container {
      name   = "qdrant"
      image  = "qdrant/qdrant:latest"
      cpu    = 1.0
      memory = "2Gi"

      env {
        name  = "QDRANT__SERVICE__HTTP_PORT"
        value = "6333"
      }
    }

    min_replicas = 1
    max_replicas = 1
  }

  ingress {
    allow_insecure_connections = false
    external_enabled           = false
    target_port                = 6333
    transport                  = "http"

    traffic_weight {
      latest_revision = true
      percentage      = 100
    }
  }

  tags = {
    Environment = "Demo"
    Project     = "Codemotion2025"
  }
}

# Deploy MCP Server as a Container App
resource "azurerm_container_app" "mcp_server" {
  name                         = var.container_app_name
  container_app_environment_id = azurerm_container_app_environment.env.id
  resource_group_name          = azurerm_resource_group.rg.name
  revision_mode                = "Single"

  registry {
    server               = azurerm_container_registry.acr.login_server
    username             = azurerm_container_registry.acr.admin_username
    password_secret_name = "registry-password"
  }

  secret {
    name  = "registry-password"
    value = azurerm_container_registry.acr.admin_password
  }

  secret {
    name  = "github-token"
    value = var.github_token
  }

  template {
    container {
      name   = "mcp-server"
      image  = "${azurerm_container_registry.acr.login_server}/codemotion-mcp-server:${var.image_tag}"
      cpu    = 0.5
      memory = "1Gi"

      env {
        name  = "GITHUB_TOKEN"
        secret_name = "github-token"
      }

      env {
        name  = "GITHUB_MODELS_URL"
        value = var.github_models_url
      }

      env {
        name  = "GITHUB_MODELS_MODEL_FOR_EMBEDDINGS"
        value = var.github_models_model_for_embeddings
      }

      env {
        name  = "QDRANT_COLLECTION_NAME"
        value = var.qdrant_collection_name
      }

      # Configure the app to connect to Qdrant in the same environment
      env {
        name  = "QDRANT_HOST"
        value = "${var.qdrant_container_app_name}.internal"
      }

      env {
        name  = "QDRANT_PORT"
        value = "6333"
      }
    }

    min_replicas = 1
    max_replicas = 3
  }

  ingress {
    allow_insecure_connections = false
    external_enabled           = true
    target_port                = 3000
    transport                  = "http"

    traffic_weight {
      latest_revision = true
      percentage      = 100
    }
  }

  depends_on = [
    azurerm_container_app.qdrant
  ]

  tags = {
    Environment = "Demo"
    Project     = "Codemotion2025"
  }
}