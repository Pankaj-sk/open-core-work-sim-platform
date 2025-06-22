# AWS Deployment Guide

This guide covers the complete AWS deployment setup for the Work Simulation Platform, including CI/CD pipeline configuration.

## 🏗️ Architecture Overview

The platform is deployed on AWS using the following services:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   GitHub Repo   │    │   GitHub Actions│    │   AWS Services  │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │   main      │ │───▶│ │ CI/CD       │ │───▶│ │ ECR         │ │
│ │   develop   │ │    │ │ Pipeline    │ │    │ │ ECS         │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ │ RDS         │ │
└─────────────────┘    └─────────────────┘    │ │ Redis       │ │
                                              │ │ ALB         │ │
                                              │ │ CloudFront  │ │
                                              │ │ Route53     │ │
                                              │ └─────────────┘ │
                                              └─────────────────┘
```

## 📋 Prerequisites

### 1. AWS Account Setup
- AWS account with appropriate permissions
- AWS CLI installed and configured
- IAM user with programmatic access

### 2. Development Tools
- Docker Desktop
- Terraform (v1.0+)
- Git
- Node.js (v18+)
- Python (v3.11+)

### 3. GitHub Repository
- Repository with main and develop branches
- GitHub Actions enabled
- Repository secrets configured

## 🚀 Quick Start

### Step 1: Clone and Setup
```bash
git clone <your-repo-url>
cd work-sim-platform
chmod +x scripts/setup-aws.sh
```

### Step 2: Configure AWS Credentials
```bash
aws configure
# Enter your AWS Access Key ID
# Enter your AWS Secret Access Key
# Enter your default region (us-east-1)
# Enter your output format (json)
```

### Step 3: Run AWS Setup
```bash
# For development environment
./scripts/setup-aws.sh dev

# For production environment
./scripts/setup-aws.sh prod
```

## 🔧 Manual Setup (Alternative)

If you prefer to set up manually, follow these steps:

### 1. Create S3 Bucket for Terraform State
```bash
aws s3 mb s3://work-sim-platform-terraform-state-dev
aws s3api put-bucket-versioning --bucket work-sim-platform-terraform-state-dev --versioning-configuration Status=Enabled
```

### 2. Create ECR Repositories
```bash
aws ecr create-repository --repository-name work-sim-platform-backend
aws ecr create-repository --repository-name work-sim-platform-frontend
```

### 3. Deploy Infrastructure
```bash
cd infrastructure/terraform
terraform init
terraform plan -var="environment=dev"
terraform apply -var="environment=dev"
```

## 🔐 GitHub Secrets Configuration

Add the following secrets to your GitHub repository:

1. Go to your repository → Settings → Secrets and variables → Actions
2. Add the following secrets:

| Secret Name | Description | Value |
|-------------|-------------|-------|
| `AWS_ACCESS_KEY_ID` | AWS Access Key | Your AWS access key |
| `AWS_SECRET_ACCESS_KEY` | AWS Secret Key | Your AWS secret key |
| `CLOUDFRONT_DISTRIBUTION_ID` | CloudFront Distribution ID | From Terraform output |
| `ECR_REGISTRY` | ECR Registry URL | From Terraform output |

### Using GitHub CLI
```bash
gh secret set AWS_ACCESS_KEY_ID --body "your-access-key"
gh secret set AWS_SECRET_ACCESS_KEY --body "your-secret-key"
gh secret set CLOUDFRONT_DISTRIBUTION_ID --body "E1234567890ABC"
gh secret set ECR_REGISTRY --body "123456789012.dkr.ecr.us-east-1.amazonaws.com"
```

## 🔄 CI/CD Pipeline Flow

### Development Branch (`develop`)
```
Push to develop → Test → Build → Deploy to Dev Environment
```

### Production Branch (`main`)
```
Push to main → Comprehensive Test → Security Scan → Deploy to Production
```

### Pipeline Stages

1. **Testing Stage**
   - Python unit tests with coverage
   - Frontend tests and build
   - Code linting and security scanning
   - Type checking (production only)

2. **Build Stage**
   - Docker image building
   - ECR image pushing
   - Image tagging with commit SHA

3. **Deploy Stage**
   - ECS service updates
   - Health checks
   - CloudFront cache invalidation
   - Deployment notifications

## 🌐 Environment Configuration

### Development Environment
- **URL**: `https://dev.worksimplatform.com`
- **API**: `https://api.dev.worksimplatform.com`
- **ECS Cluster**: `work-sim-platform-dev`
- **Database**: RDS instance with dev data

### Production Environment
- **URL**: `https://worksimplatform.com`
- **API**: `https://api.worksimplatform.com`
- **ECS Cluster**: `work-sim-platform-prod`
- **Database**: RDS instance with production data

## 📊 Monitoring and Logging

### CloudWatch Dashboards
- ECS CPU and Memory utilization
- Application response times
- Error rates and logs
- Custom metrics

### Log Groups
- `/ecs/work-sim-platform-backend-{env}`
- `/ecs/work-sim-platform-frontend-{env}`
- `/aws/rds/instance/{instance-name}`

### Alerts
- High CPU/Memory usage
- Service health check failures
- Database connection issues
- Application errors

## 🔧 Troubleshooting

### Common Issues

1. **ECS Service Not Starting**
   ```bash
   aws ecs describe-services --cluster work-sim-platform-dev --services work-sim-platform-backend-dev
   ```

2. **Container Health Check Failures**
   ```bash
   aws logs tail /ecs/work-sim-platform-backend-dev --follow
   ```

3. **Database Connection Issues**
   ```bash
   aws rds describe-db-instances --db-instance-identifier work-sim-platform-dev
   ```

4. **Terraform State Issues**
   ```bash
   terraform state list
   terraform state show aws_ecs_cluster.main
   ```

### Useful Commands

```bash
# View ECS services
aws ecs list-services --cluster work-sim-platform-dev

# Check service status
aws ecs describe-services --cluster work-sim-platform-dev --services work-sim-platform-backend-dev

# View logs
aws logs tail /ecs/work-sim-platform-backend-dev --follow

# Scale services
aws ecs update-service --cluster work-sim-platform-dev --service work-sim-platform-backend-dev --desired-count 3

# View CloudWatch metrics
aws cloudwatch get-metric-statistics --namespace AWS/ECS --metric-name CPUUtilization --dimensions Name=ServiceName,Value=work-sim-platform-backend-dev Name=ClusterName,Value=work-sim-platform-dev --start-time 2024-01-01T00:00:00Z --end-time 2024-01-01T23:59:59Z --period 3600 --statistics Average
```

## 💰 Cost Optimization

### Development Environment
- Use t3.micro instances for RDS
- Use cache.t3.micro for Redis
- Auto-scaling with minimum 1 task
- Spot instances for ECS (optional)

### Production Environment
- Use t3.small or larger for RDS
- Use cache.t3.small for Redis
- Auto-scaling with minimum 2 tasks
- Reserved instances for cost savings

### Cost Monitoring
```bash
# View cost and usage
aws ce get-cost-and-usage --time-period Start=2024-01-01,End=2024-01-31 --granularity MONTHLY --metrics BlendedCost --group-by Type=DIMENSION,Key=SERVICE
```

## 🔒 Security Best Practices

1. **IAM Roles and Policies**
   - Use least privilege principle
   - Regular access reviews
   - Rotate access keys

2. **Network Security**
   - VPC with private subnets
   - Security groups with minimal access
   - WAF for web application protection

3. **Data Security**
   - RDS encryption at rest
   - S3 bucket encryption
   - Secrets stored in SSM Parameter Store

4. **Application Security**
   - Regular security updates
   - Dependency vulnerability scanning
   - Code security analysis

## 📈 Scaling Considerations

### Horizontal Scaling
- ECS auto-scaling based on CPU/Memory
- Load balancer health checks
- Database read replicas

### Vertical Scaling
- Increase ECS task CPU/Memory
- Upgrade RDS instance class
- Optimize application performance

### Performance Monitoring
- CloudWatch custom metrics
- Application performance monitoring
- Database query optimization

## 🆘 Support and Maintenance

### Regular Maintenance Tasks
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
   - Cost optimization review

### Emergency Procedures
1. **Service Outage**
   - Check ECS service status
   - Review application logs
   - Scale up if needed

2. **Database Issues**
   - Check RDS status
   - Review connection logs
   - Consider failover if configured

3. **Security Incident**
   - Rotate access keys
   - Review access logs
   - Update security groups

## 📚 Additional Resources

- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/) 