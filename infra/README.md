# Codemotion 2025 Azure Deployment

This directory contains Terraform code to deploy the Codemotion 2025 MCP Server on Azure Container Apps.

## Prerequisites

- [Terraform](https://www.terraform.io/downloads.html) (version >= 1.0)
- [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli)
- Docker installed locally for building the container image
- An Azure subscription

## Setup Steps

### 1. Login to Azure

```bash
az login
```

### 2. Build and Push the Docker Image

```bash
# Navigate to the MCP Server directory
cd ../codemotion-mcp-server

# Build the Docker image
docker build -t codemotion-mcp-server:latest .

# Log in to Azure Container Registry (after terraform apply)
az acr login --name <acr_name>

# Tag the image
docker tag codemotion-mcp-server:latest <acr_name>.azurecr.io/codemotion-mcp-server:latest

# Push the image
docker push <acr_name>.azurecr.io/codemotion-mcp-server:latest
```

### 3. Initialize Terraform

```bash
# Navigate back to the infra directory
cd ../infra

# Initialize Terraform
terraform init
```

### 4. Create a terraform.tfvars File

Create a `terraform.tfvars` file with your custom values:

```hcl
resource_group_name = "rg-codemotion-2025"
location = "westeurope"
acr_name = "acrcodemotion2025"
github_token = "your-github-token"
# Add other variables as needed
```

### 5. Apply Terraform Configuration

```bash
terraform apply
```

Review the plan and type `yes` to proceed.

## Accessing the Deployed Application

After the deployment is complete, you can access your MCP Server at the URL provided in the outputs:

```bash
terraform output mcp_server_url
```

## Clean Up Resources

To remove all resources created by this Terraform configuration:

```bash
terraform destroy
```

Review the plan and type `yes` to proceed with deletion.

## Architecture

This deployment creates:

1. Azure Resource Group
2. Azure Container Registry (ACR)
3. Log Analytics Workspace
4. Container App Environment
5. Qdrant Container App (for vector search)
6. MCP Server Container App

The MCP Server connects to Qdrant using the internal DNS name within the Container App Environment.