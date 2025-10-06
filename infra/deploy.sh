#!/bin/bash

# Stop on any error
set -e

# Color output
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
NC="\033[0m" # No Color

echo -e "${YELLOW}=== Codemotion 2025 Azure Container Apps Deployment ===${NC}"

# Verify prerequisites
echo -e "\n${YELLOW}Checking prerequisites...${NC}"

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo -e "${RED}Azure CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if logged in to Azure
if ! az account show &> /dev/null; then
    echo -e "${YELLOW}Not logged in to Azure. Please log in:${NC}"
    az login
fi

echo -e "${GREEN}Prerequisites met!${NC}"

# Initialize Terraform
echo -e "\n${YELLOW}Initializing Terraform...${NC}"
terraform init

# Check if terraform.tfvars exists
if [ ! -f "terraform.tfvars" ]; then
    echo -e "${YELLOW}No terraform.tfvars found. Creating a sample one...${NC}"
    cat > terraform.tfvars << EOF
resource_group_name = "rg-codemotion-2025"
location = "westeurope"
acr_name = "acrcodemotion2025"
github_token = "your-github-token"
# Add other variables as needed
EOF
    echo -e "${YELLOW}Please edit terraform.tfvars with your values before continuing.${NC}"
    read -p "Press enter to continue after editing the file..."
fi

# Apply Terraform configuration
echo -e "\n${YELLOW}Planning Terraform deployment...${NC}"
terraform plan -out=tfplan

echo -e "\n${YELLOW}Ready to apply Terraform configuration.${NC}"
read -p "Do you want to continue? [y/N] " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "\n${YELLOW}Applying Terraform configuration...${NC}"
    terraform apply -auto-approve tfplan
    
    # Get outputs
    ACR_LOGIN_SERVER=$(terraform output -raw acr_login_server)
    ACR_USERNAME=$(terraform output -raw acr_admin_username)
    ACR_PASSWORD=$(terraform output -raw acr_admin_password)
    MCP_SERVER_URL=$(terraform output -raw mcp_server_url)
    
    echo -e "\n${GREEN}Terraform deployment complete!${NC}"
    
    # Build and push Docker image
    echo -e "\n${YELLOW}Building and pushing Docker image...${NC}"
    cd ../codemotion-mcp-server
    
    echo -e "${YELLOW}Building Docker image...${NC}"
    docker build -t ${ACR_LOGIN_SERVER}/codemotion-mcp-server:latest .
    
    echo -e "${YELLOW}Logging in to ACR...${NC}"
    echo "$ACR_PASSWORD" | docker login ${ACR_LOGIN_SERVER} -u ${ACR_USERNAME} --password-stdin
    
    echo -e "${YELLOW}Pushing image to ACR...${NC}"
    docker push ${ACR_LOGIN_SERVER}/codemotion-mcp-server:latest
    
    echo -e "\n${GREEN}Deployment complete!${NC}"
    echo -e "\n${GREEN}Your MCP Server is available at:${NC} ${MCP_SERVER_URL}/mcp"
else
    echo -e "\n${YELLOW}Deployment cancelled.${NC}"
fi