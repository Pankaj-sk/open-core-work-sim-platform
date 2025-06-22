#!/bin/bash

# Cursor to AWS Deployment Pipeline
# This script automates the complete workflow from local development to AWS deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="work-sim-platform"
AWS_REGION="us-east-1"
ENVIRONMENT=${1:-"dev"}
BRANCH=${2:-"develop"}

echo -e "${PURPLE}🚀 Cursor to AWS Deployment Pipeline${NC}"
echo -e "${PURPLE}=====================================${NC}"
echo -e "${BLUE}Environment: ${ENVIRONMENT}${NC}"
echo -e "${BLUE}Branch: ${BRANCH}${NC}"
echo -e "${BLUE}Region: ${AWS_REGION}${NC}"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check all prerequisites
check_prerequisites() {
    echo -e "${YELLOW}📋 Checking prerequisites...${NC}"
    
    local missing_tools=()
    
    # Check required tools
    if ! command_exists git; then
        missing_tools+=("git")
    fi
    
    if ! command_exists docker; then
        missing_tools+=("docker")
    fi
    
    if ! command_exists aws; then
        missing_tools+=("aws")
    fi
    
    if ! command_exists terraform; then
        missing_tools+=("terraform")
    fi
    
    if ! command_exists gh; then
        missing_tools+=("GitHub CLI (gh)")
    fi
    
    if ! command_exists node; then
        missing_tools+=("Node.js")
    fi
    
    if ! command_exists python3; then
        missing_tools+=("Python 3")
    fi
    
    if [ ${#missing_tools[@]} -ne 0 ]; then
        echo -e "${RED}❌ Missing required tools:${NC}"
        printf '%s\n' "${missing_tools[@]}"
        echo -e "${YELLOW}Please install the missing tools and try again.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ All prerequisites met${NC}"
}

# Check git status and ensure clean working directory
check_git_status() {
    echo -e "${YELLOW}🔍 Checking git status...${NC}"
    
    if [ -n "$(git status --porcelain)" ]; then
        echo -e "${YELLOW}⚠️  Working directory has uncommitted changes${NC}"
        read -p "Do you want to commit changes before proceeding? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            git add .
            read -p "Enter commit message: " commit_message
            git commit -m "${commit_message:-"Auto-commit before deployment"}"
        else
            echo -e "${RED}❌ Please commit or stash your changes before proceeding${NC}"
            exit 1
        fi
    fi
    
    echo -e "${GREEN}✅ Git status clean${NC}"
}

# Run local tests
run_local_tests() {
    echo -e "${YELLOW}🧪 Running local tests...${NC}"
    
    # Python tests
    echo -e "${BLUE}Running Python tests...${NC}"
    cd core
    python3 -m pip install -r requirements.txt
    python3 -m pip install pytest pytest-cov flake8
    python3 -m pytest tests/ --cov=. --cov-report=term-missing
    flake8 . --count --exit-zero --max-complexity=10 --max-line-length=127
    cd ..
    
    # Frontend tests
    echo -e "${BLUE}Running frontend tests...${NC}"
    cd frontend
    npm ci
    npm test -- --coverage --watchAll=false
    npm run build
    cd ..
    
    echo -e "${GREEN}✅ All tests passed${NC}"
}

# Build Docker images locally
build_docker_images() {
    echo -e "${YELLOW}🐳 Building Docker images...${NC}"
    
    # Build backend
    echo -e "${BLUE}Building backend image...${NC}"
    docker build -f docker/Dockerfile.backend -t ${PROJECT_NAME}-backend:latest .
    
    # Build frontend
    echo -e "${BLUE}Building frontend image...${NC}"
    docker build -f docker/Dockerfile.frontend -t ${PROJECT_NAME}-frontend:latest .
    
    echo -e "${GREEN}✅ Docker images built successfully${NC}"
}

# Push to Git and trigger CI/CD
push_to_git() {
    echo -e "${YELLOW}📤 Pushing to Git repository...${NC}"
    
    # Check if we're on the correct branch
    current_branch=$(git branch --show-current)
    if [ "$current_branch" != "$BRANCH" ]; then
        echo -e "${YELLOW}Switching to ${BRANCH} branch...${NC}"
        git checkout $BRANCH
    fi
    
    # Push to remote
    git push origin $BRANCH
    
    echo -e "${GREEN}✅ Code pushed to ${BRANCH} branch${NC}"
}

# Monitor CI/CD pipeline
monitor_pipeline() {
    echo -e "${YELLOW}👀 Monitoring CI/CD pipeline...${NC}"
    
    # Get the latest workflow run
    workflow_id=$(gh run list --limit 1 --json databaseId --jq '.[0].databaseId')
    
    if [ -n "$workflow_id" ]; then
        echo -e "${BLUE}Monitoring workflow: ${workflow_id}${NC}"
        gh run watch $workflow_id
        
        # Check if the workflow was successful
        status=$(gh run view $workflow_id --json conclusion --jq '.conclusion')
        if [ "$status" = "success" ]; then
            echo -e "${GREEN}✅ CI/CD pipeline completed successfully${NC}"
        else
            echo -e "${RED}❌ CI/CD pipeline failed${NC}"
            exit 1
        fi
    else
        echo -e "${YELLOW}⚠️  No recent workflow found${NC}"
    fi
}

# Deploy to AWS (if not using CI/CD)
deploy_to_aws() {
    echo -e "${YELLOW}☁️  Deploying to AWS...${NC}"
    
    # Check if AWS credentials are configured
    if ! aws sts get-caller-identity &> /dev/null; then
        echo -e "${RED}❌ AWS credentials not configured${NC}"
        echo -e "${YELLOW}Please run 'aws configure' first${NC}"
        exit 1
    fi
    
    # Run the AWS setup script
    if [ -f "scripts/setup-aws.sh" ]; then
        chmod +x scripts/setup-aws.sh
        ./scripts/setup-aws.sh $ENVIRONMENT
    else
        echo -e "${RED}❌ AWS setup script not found${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ AWS deployment completed${NC}"
}

# Verify deployment
verify_deployment() {
    echo -e "${YELLOW}🔍 Verifying deployment...${NC}"
    
    # Get deployment URLs from Terraform output
    if [ -d "infrastructure/terraform" ]; then
        cd infrastructure/terraform
        
        # Get ALB DNS name
        alb_dns=$(terraform output -raw alb_dns_name 2>/dev/null || echo "")
        
        if [ -n "$alb_dns" ]; then
            echo -e "${BLUE}Testing backend health check...${NC}"
            if curl -f "http://${alb_dns}/health" >/dev/null 2>&1; then
                echo -e "${GREEN}✅ Backend is healthy${NC}"
            else
                echo -e "${RED}❌ Backend health check failed${NC}"
            fi
            
            echo -e "${BLUE}Testing frontend...${NC}"
            if curl -f "http://${alb_dns}" >/dev/null 2>&1; then
                echo -e "${GREEN}✅ Frontend is accessible${NC}"
            else
                echo -e "${RED}❌ Frontend is not accessible${NC}"
            fi
        fi
        
        cd ../..
    fi
    
    echo -e "${GREEN}✅ Deployment verification completed${NC}"
}

# Show deployment information
show_deployment_info() {
    echo -e "${PURPLE}🎉 Deployment Summary${NC}"
    echo -e "${PURPLE}===================${NC}"
    echo -e "${BLUE}Environment: ${ENVIRONMENT}${NC}"
    echo -e "${BLUE}Branch: ${BRANCH}${NC}"
    echo -e "${BLUE}Region: ${AWS_REGION}${NC}"
    
    if [ -d "infrastructure/terraform" ]; then
        cd infrastructure/terraform
        
        # Get deployment URLs
        alb_dns=$(terraform output -raw alb_dns_name 2>/dev/null || echo "Not available")
        cloudfront_domain=$(terraform output -raw cloudfront_domain 2>/dev/null || echo "Not available")
        
        echo -e "${GREEN}Deployment URLs:${NC}"
        echo -e "  ALB: http://${alb_dns}"
        echo -e "  CloudFront: https://${cloudfront_domain}"
        
        cd ../..
    fi
    
    echo ""
    echo -e "${BLUE}Useful commands:${NC}"
    echo -e "  View logs: aws logs tail /ecs/${PROJECT_NAME}-backend-${ENVIRONMENT} --follow"
    echo -e "  Check services: aws ecs list-services --cluster ${PROJECT_NAME}-${ENVIRONMENT}"
    echo -e "  Scale up: aws ecs update-service --cluster ${PROJECT_NAME}-${ENVIRONMENT} --service ${PROJECT_NAME}-backend-${ENVIRONMENT} --desired-count 3"
}

# Main execution function
main() {
    echo -e "${PURPLE}Starting Cursor to AWS deployment pipeline...${NC}"
    
    # Check prerequisites
    check_prerequisites
    
    # Check git status
    check_git_status
    
    # Run local tests
    run_local_tests
    
    # Build Docker images
    build_docker_images
    
    # Ask user for deployment method
    echo -e "${YELLOW}Choose deployment method:${NC}"
    echo "1. Push to Git and use CI/CD pipeline (recommended)"
    echo "2. Deploy directly to AWS"
    read -p "Enter your choice (1 or 2): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[1]$ ]]; then
        # Use CI/CD pipeline
        push_to_git
        monitor_pipeline
    elif [[ $REPLY =~ ^[2]$ ]]; then
        # Direct deployment
        deploy_to_aws
    else
        echo -e "${RED}❌ Invalid choice${NC}"
        exit 1
    fi
    
    # Verify deployment
    verify_deployment
    
    # Show deployment information
    show_deployment_info
    
    echo -e "${GREEN}🎉 Deployment pipeline completed successfully!${NC}"
}

# Handle script interruption
trap 'echo -e "\n${RED}❌ Deployment interrupted${NC}"; exit 1' INT

# Run main function
main "$@" 