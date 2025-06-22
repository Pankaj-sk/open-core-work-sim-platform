#!/bin/bash

# Work Simulation Platform - AWS Setup Script
# This script sets up the complete AWS infrastructure for the platform

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="work-sim-platform"
AWS_REGION="us-east-1"
ENVIRONMENT=${1:-"dev"}
DOMAIN_NAME="worksimplatform.com"

echo -e "${BLUE}🚀 Setting up AWS infrastructure for Work Simulation Platform${NC}"
echo -e "${BLUE}Environment: ${ENVIRONMENT}${NC}"
echo -e "${BLUE}Region: ${AWS_REGION}${NC}"

# Check prerequisites
check_prerequisites() {
    echo -e "${YELLOW}📋 Checking prerequisites...${NC}"
    
    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        echo -e "${RED}❌ AWS CLI is not installed. Please install it first.${NC}"
        exit 1
    fi
    
    # Check Terraform
    if ! command -v terraform &> /dev/null; then
        echo -e "${RED}❌ Terraform is not installed. Please install it first.${NC}"
        exit 1
    fi
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker is not installed. Please install it first.${NC}"
        exit 1
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        echo -e "${RED}❌ AWS credentials not configured. Please run 'aws configure' first.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ All prerequisites met${NC}"
}

# Create S3 bucket for Terraform state
create_terraform_bucket() {
    echo -e "${YELLOW}🪣 Creating S3 bucket for Terraform state...${NC}"
    
    BUCKET_NAME="${PROJECT_NAME}-terraform-state-${ENVIRONMENT}"
    
    if aws s3 ls "s3://${BUCKET_NAME}" 2>&1 > /dev/null; then
        echo -e "${GREEN}✅ S3 bucket ${BUCKET_NAME} already exists${NC}"
    else
        aws s3 mb "s3://${BUCKET_NAME}" --region ${AWS_REGION}
        aws s3api put-bucket-versioning --bucket "${BUCKET_NAME}" --versioning-configuration Status=Enabled
        aws s3api put-bucket-encryption --bucket "${BUCKET_NAME}" --server-side-encryption-configuration '{
            "Rules": [
                {
                    "ApplyServerSideEncryptionByDefault": {
                        "SSEAlgorithm": "AES256"
                    }
                }
            ]
        }'
        echo -e "${GREEN}✅ S3 bucket ${BUCKET_NAME} created${NC}"
    fi
}

# Create ECR repositories
create_ecr_repositories() {
    echo -e "${YELLOW}📦 Creating ECR repositories...${NC}"
    
    REPOSITORIES=("${PROJECT_NAME}-backend" "${PROJECT_NAME}-frontend")
    
    for repo in "${REPOSITORIES[@]}"; do
        if aws ecr describe-repositories --repository-names "${repo}" --region ${AWS_REGION} 2>&1 > /dev/null; then
            echo -e "${GREEN}✅ ECR repository ${repo} already exists${NC}"
        else
            aws ecr create-repository --repository-name "${repo}" --region ${AWS_REGION}
            echo -e "${GREEN}✅ ECR repository ${repo} created${NC}"
        fi
    done
}

# Build and push Docker images
build_and_push_images() {
    echo -e "${YELLOW}🐳 Building and pushing Docker images...${NC}"
    
    # Get ECR login token
    aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin $(aws sts get-caller-identity --query Account --output text).dkr.ecr.${AWS_REGION}.amazonaws.com
    
    ECR_REGISTRY=$(aws sts get-caller-identity --query Account --output text).dkr.ecr.${AWS_REGION}.amazonaws.com
    
    # Build and push backend
    echo -e "${YELLOW}Building backend image...${NC}"
    docker build -f docker/Dockerfile.backend -t ${ECR_REGISTRY}/${PROJECT_NAME}-backend:latest .
    docker push ${ECR_REGISTRY}/${PROJECT_NAME}-backend:latest
    
    # Build and push frontend
    echo -e "${YELLOW}Building frontend image...${NC}"
    docker build -f docker/Dockerfile.frontend -t ${ECR_REGISTRY}/${PROJECT_NAME}-frontend:latest .
    docker push ${ECR_REGISTRY}/${PROJECT_NAME}-frontend:latest
    
    echo -e "${GREEN}✅ Docker images built and pushed${NC}"
}

# Deploy infrastructure with Terraform
deploy_infrastructure() {
    echo -e "${YELLOW}🏗️ Deploying infrastructure with Terraform...${NC}"
    
    cd infrastructure/terraform
    
    # Initialize Terraform
    terraform init
    
    # Plan the deployment
    terraform plan -var="environment=${ENVIRONMENT}" -var="aws_region=${AWS_REGION}" -var="domain_name=${DOMAIN_NAME}"
    
    # Apply the deployment
    echo -e "${YELLOW}Applying Terraform configuration...${NC}"
    terraform apply -var="environment=${ENVIRONMENT}" -var="aws_region=${AWS_REGION}" -var="domain_name=${DOMAIN_NAME}" -auto-approve
    
    cd ../..
    
    echo -e "${GREEN}✅ Infrastructure deployed successfully${NC}"
}

# Setup GitHub Secrets
setup_github_secrets() {
    echo -e "${YELLOW}🔐 Setting up GitHub repository secrets...${NC}"
    
    # Get outputs from Terraform
    cd infrastructure/terraform
    ECR_REGISTRY=$(terraform output -raw ecr_registry)
    ALB_DNS_NAME=$(terraform output -raw alb_dns_name)
    CLOUDFRONT_DISTRIBUTION_ID=$(terraform output -raw cloudfront_distribution_id)
    cd ../..
    
    echo -e "${BLUE}Please add the following secrets to your GitHub repository:${NC}"
    echo -e "${BLUE}Go to: Settings > Secrets and variables > Actions${NC}"
    echo ""
    echo -e "${GREEN}AWS_ACCESS_KEY_ID${NC}: Your AWS access key"
    echo -e "${GREEN}AWS_SECRET_ACCESS_KEY${NC}: Your AWS secret key"
    echo -e "${GREEN}CLOUDFRONT_DISTRIBUTION_ID${NC}: ${CLOUDFRONT_DISTRIBUTION_ID}"
    echo -e "${GREEN}ECR_REGISTRY${NC}: ${ECR_REGISTRY}"
    echo ""
    echo -e "${YELLOW}You can also run:${NC}"
    echo "gh secret set AWS_ACCESS_KEY_ID --body 'your-access-key'"
    echo "gh secret set AWS_SECRET_ACCESS_KEY --body 'your-secret-key'"
    echo "gh secret set CLOUDFRONT_DISTRIBUTION_ID --body '${CLOUDFRONT_DISTRIBUTION_ID}'"
    echo "gh secret set ECR_REGISTRY --body '${ECR_REGISTRY}'"
}

# Setup monitoring and alerting
setup_monitoring() {
    echo -e "${YELLOW}📊 Setting up monitoring and alerting...${NC}"
    
    # Create CloudWatch dashboard
    aws cloudwatch put-dashboard --dashboard-name "${PROJECT_NAME}-${ENVIRONMENT}" --dashboard-body '{
        "widgets": [
            {
                "type": "metric",
                "x": 0,
                "y": 0,
                "width": 12,
                "height": 6,
                "properties": {
                    "metrics": [
                        ["AWS/ECS", "CPUUtilization", "ServiceName", "'${PROJECT_NAME}'-backend-'${ENVIRONMENT}'", "ClusterName", "'${PROJECT_NAME}'-'${ENVIRONMENT}'"],
                        [".", "CPUUtilization", "ServiceName", "'${PROJECT_NAME}'-frontend-'${ENVIRONMENT}'", "ClusterName", "'${PROJECT_NAME}'-'${ENVIRONMENT}'"]
                    ],
                    "view": "timeSeries",
                    "stacked": false,
                    "region": "'${AWS_REGION}'",
                    "title": "ECS CPU Utilization"
                }
            }
        ]
    }' --region ${AWS_REGION}
    
    echo -e "${GREEN}✅ Monitoring dashboard created${NC}"
}

# Main execution
main() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}Work Simulation Platform Setup${NC}"
    echo -e "${BLUE}================================${NC}"
    
    check_prerequisites
    create_terraform_bucket
    create_ecr_repositories
    build_and_push_images
    deploy_infrastructure
    setup_github_secrets
    setup_monitoring
    
    echo -e "${GREEN}🎉 Setup completed successfully!${NC}"
    echo ""
    echo -e "${BLUE}Next steps:${NC}"
    echo "1. Add GitHub secrets as shown above"
    echo "2. Push your code to the 'develop' branch to trigger the CI/CD pipeline"
    echo "3. Monitor the deployment in GitHub Actions"
    echo "4. Access your application at the provided URLs"
    echo ""
    echo -e "${BLUE}Useful commands:${NC}"
    echo "terraform output -json  # View all outputs"
    echo "aws ecs list-services --cluster ${PROJECT_NAME}-${ENVIRONMENT}  # List ECS services"
    echo "aws logs describe-log-groups --log-group-name-prefix /ecs/${PROJECT_NAME}  # View logs"
}

# Run main function
main "$@" 