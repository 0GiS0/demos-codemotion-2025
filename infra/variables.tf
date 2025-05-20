variable "resource_group_name" {
  description = "Name of the resource group"
  type        = string
  default     = "rg-codemotion-2025"
}

variable "location" {
  description = "Azure region to deploy resources"
  type        = string
  default     = "westeurope"
}

variable "acr_name" {
  description = "Name of the Azure Container Registry"
  type        = string
  default     = "acrcodemotion2025"
}

variable "container_app_environment_name" {
  description = "Name of the Container App Environment"
  type        = string
  default     = "env-codemotion-2025"
}

variable "container_app_name" {
  description = "Name of the Container App"
  type        = string
  default     = "app-mcp-server"
}

variable "qdrant_container_app_name" {
  description = "Name of the Qdrant Container App"
  type        = string
  default     = "app-qdrant"
}

variable "github_token" {
  description = "GitHub token for authentication with GitHub Models"
  type        = string
  sensitive   = true
}

variable "github_models_url" {
  description = "URL for GitHub Models"
  type        = string
  default     = "https://api.github.com/models"
}

variable "github_models_model_for_embeddings" {
  description = "Model for embeddings from GitHub Models"
  type        = string
  default     = "text-embedding-3-large"
}

variable "qdrant_collection_name" {
  description = "Name of the Qdrant collection"
  type        = string
  default     = "codemotion"
}

variable "image_tag" {
  description = "Docker image tag for the MCP server"
  type        = string
  default     = "latest"
}