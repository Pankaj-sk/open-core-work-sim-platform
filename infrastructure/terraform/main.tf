terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  backend "s3" {
    bucket = "worksimplatform-terraform-state"
    key    = "terraform.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Project     = "work-sim-platform"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

# VPC and Networking
module "vpc" {
  source = "./modules/vpc"
  
  environment = var.environment
  vpc_cidr    = var.vpc_cidr
  azs         = var.availability_zones
}

# ECR Repositories
module "ecr" {
  source = "./modules/ecr"
  
  environment = var.environment
  repositories = [
    "work-sim-platform-backend",
    "work-sim-platform-frontend"
  ]
}

# ECS Cluster and Services
module "ecs" {
  source = "./modules/ecs"
  
  environment           = var.environment
  vpc_id               = module.vpc.vpc_id
  private_subnets      = module.vpc.private_subnets
  public_subnets       = module.vpc.public_subnets
  ecr_repository_urls  = module.ecr.repository_urls
  
  backend_image        = "${module.ecr.repository_urls["work-sim-platform-backend"]}:latest"
  frontend_image       = "${module.ecr.repository_urls["work-sim-platform-frontend"]}:latest"
  
  depends_on = [module.vpc, module.ecr]
}

# RDS Database
module "rds" {
  source = "./modules/rds"
  
  environment      = var.environment
  vpc_id          = module.vpc.vpc_id
  private_subnets = module.vpc.private_subnets
  db_name         = "worksimplatform"
  db_username     = var.db_username
  db_password     = var.db_password
  
  depends_on = [module.vpc]
}

# Redis ElastiCache
module "redis" {
  source = "./modules/redis"
  
  environment      = var.environment
  vpc_id          = module.vpc.vpc_id
  private_subnets = module.vpc.private_subnets
  
  depends_on = [module.vpc]
}

# Application Load Balancer
module "alb" {
  source = "./modules/alb"
  
  environment      = var.environment
  vpc_id          = module.vpc.vpc_id
  public_subnets  = module.vpc.public_subnets
  backend_target_group_arn = module.ecs.backend_target_group_arn
  frontend_target_group_arn = module.ecs.frontend_target_group_arn
  
  depends_on = [module.vpc, module.ecs]
}

# CloudFront Distribution
module "cloudfront" {
  source = "./modules/cloudfront"
  
  environment = var.environment
  alb_domain_name = module.alb.alb_dns_name
  domain_name     = var.domain_name
  
  depends_on = [module.alb]
}

# Route53 DNS
module "route53" {
  source = "./modules/route53"
  
  environment     = var.environment
  domain_name     = var.domain_name
  cloudfront_distribution_id = module.cloudfront.distribution_id
  alb_dns_name    = module.alb.alb_dns_name
  
  depends_on = [module.cloudfront, module.alb]
}

# IAM Roles and Policies
module "iam" {
  source = "./modules/iam"
  
  environment = var.environment
  ecs_task_execution_role_arn = module.ecs.task_execution_role_arn
  ecs_task_role_arn           = module.ecs.task_role_arn
}

# CloudWatch Logs
module "cloudwatch" {
  source = "./modules/cloudwatch"
  
  environment = var.environment
}

# Outputs
output "alb_dns_name" {
  description = "DNS name of the load balancer"
  value       = module.alb.alb_dns_name
}

output "cloudfront_domain" {
  description = "CloudFront distribution domain"
  value       = module.cloudfront.domain_name
}

output "ecr_repository_urls" {
  description = "ECR repository URLs"
  value       = module.ecr.repository_urls
}

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = module.rds.endpoint
  sensitive   = true
}

output "redis_endpoint" {
  description = "Redis cluster endpoint"
  value       = module.redis.endpoint
} 