# Cursor to AWS Pipeline: Complete Workflow Guide

This guide explains the complete pipeline from development in Cursor to production deployment on AWS.

## 🎯 Overview

The **Cursor to AWS Pipeline** is a comprehensive CI/CD workflow that automates the entire process from local development to production deployment:

```
Cursor Development → Git Repository → GitHub Actions → AWS Infrastructure → Production
```

## 🏗️ Pipeline Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Cursor IDE    │    │   Git Repo      │    │ GitHub Actions  │    │   AWS Cloud     │
│                 │    │                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │   Develop   │ │───▶│ │   Commit    │ │───▶│ │   CI/CD     │ │───▶│ │   ECS       │ │
│ │   Test      │ │    │ │   Push      │ │    │ │   Pipeline  │ │    │ │   RDS       │ │
│ │   Build     │ │    │ │   Branch    │ │    │ │   Deploy    │ │    │ │   CloudFront│ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start Workflow

### 1. Development in Cursor

```bash
# Clone the repository
git clone <your-repo-url>
cd work-sim-platform

# Create feature branch
git checkout -b feature/new-feature

# Make changes in Cursor
# Test locally
./scripts/cursor-to-aws.sh dev feature/new-feature
```

### 2. Automated Pipeline Execution

The `cursor-to-aws.sh` script automates the entire process:

```bash
# Run the complete pipeline
./scripts/cursor-to-aws.sh dev develop
```

**What the script does:**
- ✅ Checks prerequisites (Docker, AWS CLI, Terraform, etc.)
- ✅ Validates git status and commits changes
- ✅ Runs local tests (Python + Frontend)
- ✅ Builds Docker images
- ✅ Pushes to Git repository
- ✅ Monitors CI/CD pipeline
- ✅ Verifies deployment
- ✅ Shows deployment information

## 📋 Detailed Pipeline Stages

### Stage 1: Local Development & Testing

#### Prerequisites Check
```bash
# Required tools
- Git
- Docker
- AWS CLI
- Terraform
- GitHub CLI (gh)
- Node.js (v18+)
- Python (v3.11+)
```

#### Local Testing
```bash
# Python tests
cd core
python3 -m pytest tests/ --cov=. --cov-report=term-missing
flake8 . --count --exit-zero --max-complexity=10 --max-line-length=127

# Frontend tests
cd frontend
npm ci
npm test -- --coverage --watchAll=false
npm run build
```

#### Docker Build
```bash
# Build backend image
docker build -f docker/Dockerfile.backend -t work-sim-platform-backend:latest .

# Build frontend image
docker build -f docker/Dockerfile.frontend -t work-sim-platform-frontend:latest .
```

### Stage 2: Git Integration

#### Branch Strategy
```
main (production)
├── develop (staging)
│   ├── feature/new-feature
│   ├── feature/bug-fix
│   └── feature/enhancement
```

#### Commit & Push
```bash
# Check git status
git status

# Commit changes (if needed)
git add .
git commit -m "Add new feature"

# Push to remote
git push origin develop
```

### Stage 3: GitHub Actions CI/CD

#### Development Pipeline (`develop` branch)
```yaml
# .github/workflows/ci-cd-pipeline.yml
dev-test:
  - Python unit tests with coverage
  - Frontend tests and build
  - Code linting
  - Docker image building

dev-deploy:
  - ECR image pushing
  - ECS service update (dev environment)
  - Health checks
```

#### Production Pipeline (`main` branch)
```yaml
prod-test:
  - Comprehensive Python tests
  - Security scanning (bandit)
  - Type checking (mypy)
  - Frontend tests and build

prod-deploy:
  - ECR image pushing (latest tag)
  - ECS service update (prod environment)
  - CloudFront cache invalidation
  - Deployment notifications
```

### Stage 4: AWS Infrastructure

#### Infrastructure Components
```
AWS Infrastructure:
├── ECS (Container Orchestration)
│   ├── Backend Service (FastAPI)
│   └── Frontend Service (React)
├── ECR (Container Registry)
│   ├── work-sim-platform-backend
│   └── work-sim-platform-frontend
├── RDS (Database)
│   └── PostgreSQL instance
├── ElastiCache (Redis)
│   └── Redis cluster
├── ALB (Load Balancer)
│   ├── Backend target group
│   └── Frontend target group
├── CloudFront (CDN)
│   └── Global content delivery
├── Route53 (DNS)
│   └── Domain management
└── CloudWatch (Monitoring)
    ├── Logs
    ├── Metrics
    └── Alerts
```

#### Deployment Flow
1. **Image Building**: Docker images built and pushed to ECR
2. **Service Update**: ECS services updated with new images
3. **Health Checks**: ALB health checks ensure service availability
4. **Traffic Routing**: ALB routes traffic to healthy containers
5. **CDN Update**: CloudFront cache invalidated for frontend
6. **DNS Update**: Route53 points domain to new deployment

## 🔧 Configuration Files

### 1. GitHub Actions Workflow
```yaml
# .github/workflows/ci-cd-pipeline.yml
name: CI/CD Pipeline
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  dev-test: # Development testing
  dev-deploy: # Development deployment
  prod-test: # Production testing
  prod-deploy: # Production deployment
```

### 2. Terraform Infrastructure
```hcl
# infrastructure/terraform/main.tf
terraform {
  backend "s3" {
    bucket = "worksimplatform-terraform-state"
    key    = "terraform.tfstate"
    region = "us-east-1"
  }
}

# Modules for each AWS service
module "vpc" { ... }
module "ecr" { ... }
module "ecs" { ... }
module "rds" { ... }
module "redis" { ... }
module "alb" { ... }
module "cloudfront" { ... }
module "route53" { ... }
```

### 3. Docker Configuration
```dockerfile
# docker/Dockerfile.backend
FROM python:3.11-slim
WORKDIR /app
COPY core/requirements.txt .
RUN pip install -r requirements.txt
COPY core/ .
EXPOSE 8000
CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "8000"]
```

```dockerfile
# docker/Dockerfile.frontend
FROM node:18-alpine AS build
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 🌐 Environment Configuration

### Development Environment
- **URL**: `https://dev.worksimplatform.com`
- **API**: `https://api.dev.worksimplatform.com`
- **ECS Cluster**: `work-sim-platform-dev`
- **Database**: RDS instance with dev data
- **Auto-scaling**: 1-3 tasks

### Production Environment
- **URL**: `https://worksimplatform.com`
- **API**: `https://api.worksimplatform.com`
- **ECS Cluster**: `work-sim-platform-prod`
- **Database**: RDS instance with production data
- **Auto-scaling**: 2-10 tasks

## 🔐 Security & Secrets

### GitHub Secrets
```bash
# Required secrets in GitHub repository
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
CLOUDFRONT_DISTRIBUTION_ID=distribution-id
ECR_REGISTRY=registry-url
```

### AWS Secrets Management
```bash
# SSM Parameter Store
/work-sim-platform/dev/database_url
/work-sim-platform/dev/redis_url
/work-sim-platform/dev/secret_key
```

## 📊 Monitoring & Observability

### CloudWatch Dashboards
- ECS CPU and Memory utilization
- Application response times
- Error rates and logs
- Custom application metrics

### Log Groups
```
/ecs/work-sim-platform-backend-dev
/ecs/work-sim-platform-frontend-dev
/aws/rds/instance/work-sim-platform-dev
/aws/elasticache/redis/work-sim-platform-dev
```

### Alerts
- High CPU/Memory usage (>80%)
- Service health check failures
- Database connection issues
- Application error rate spikes

## 🚨 Troubleshooting

### Common Issues & Solutions

#### 1. ECS Service Not Starting
```bash
# Check service status
aws ecs describe-services --cluster work-sim-platform-dev --services work-sim-platform-backend-dev

# View service logs
aws logs tail /ecs/work-sim-platform-backend-dev --follow
```

#### 2. Docker Build Failures
```bash
# Test Docker build locally
docker build -f docker/Dockerfile.backend -t test-backend .
docker run -p 8000:8000 test-backend

# Check Docker logs
docker logs <container-id>
```

#### 3. GitHub Actions Failures
```bash
# View workflow runs
gh run list

# View specific run details
gh run view <run-id>

# Re-run failed workflow
gh run rerun <run-id>
```

#### 4. Terraform Issues
```bash
# Check Terraform state
terraform state list
terraform state show aws_ecs_cluster.main

# Plan changes
terraform plan -var="environment=dev"

# Apply changes
terraform apply -var="environment=dev"
```

## 💰 Cost Optimization

### Development Environment
- **ECS**: t3.micro instances, 1-2 tasks
- **RDS**: db.t3.micro instance
- **Redis**: cache.t3.micro instance
- **Estimated cost**: ~$50-100/month

### Production Environment
- **ECS**: t3.small instances, 2-10 tasks
- **RDS**: db.t3.small instance
- **Redis**: cache.t3.small instance
- **Estimated cost**: ~$200-500/month

### Cost Monitoring
```bash
# View monthly costs
aws ce get-cost-and-usage \
  --time-period Start=2024-01-01,End=2024-01-31 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --group-by Type=DIMENSION,Key=SERVICE
```

## 🔄 Best Practices

### 1. Development Workflow
- Always work on feature branches
- Run tests locally before pushing
- Use meaningful commit messages
- Review code before merging to main

### 2. Deployment Strategy
- Use blue-green deployments for zero downtime
- Implement health checks and rollback mechanisms
- Monitor deployments closely
- Use feature flags for gradual rollouts

### 3. Security
- Rotate access keys regularly
- Use least privilege IAM policies
- Enable CloudTrail for audit logging
- Regular security updates and patches

### 4. Monitoring
- Set up comprehensive alerting
- Monitor application performance
- Track business metrics
- Regular log analysis

## 📈 Scaling Considerations

### Horizontal Scaling
- ECS auto-scaling based on CPU/Memory
- Load balancer health checks
- Database read replicas
- CDN for static content

### Vertical Scaling
- Increase ECS task CPU/Memory
- Upgrade RDS instance class
- Optimize application performance
- Database query optimization

## 🆘 Support & Maintenance

### Regular Tasks
1. **Weekly**
   - Review CloudWatch logs
   - Check security updates
   - Monitor costs

2. **Monthly**
   - Update dependencies
   - Review IAM permissions
   - Backup verification

3. **Quarterly**
   - Security audit
   - Performance review
   - Cost optimization

### Emergency Procedures
1. **Service Outage**
   - Check ECS service status
   - Review application logs
   - Scale up if needed

2. **Database Issues**
   - Check RDS status
   - Review connection logs
   - Consider failover

3. **Security Incident**
   - Rotate access keys
   - Review access logs
   - Update security groups

## 📚 Additional Resources

- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)

---

**This pipeline provides a robust, scalable, and maintainable deployment solution for the Work Simulation Platform, ensuring rapid development cycles and reliable production deployments.** 