# Deployment Guide

## Overview

This guide covers deploying the Work Simulation Platform to various environments.

## Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)
- Python 3.11+ (for local development)
- AWS CLI (for cloud deployment)

## Local Development

### Quick Start

1. **Clone the repository**
```bash
git clone https://github.com/Pankaj-sk/work-sim-platform.git
cd work-sim-platform
```

2. **Start with Docker**
```bash
docker-compose -f docker/docker-compose.yml up --build
```

3. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Manual Setup

1. **Backend Setup**
```bash
cd core
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn api:app --reload
```

2. **Frontend Setup**
```bash
cd frontend
npm install
npm start
```

## Production Deployment

### AWS Deployment

The project includes GitHub Actions for automatic deployment to AWS.

#### Prerequisites

1. **AWS Account Setup**
   - Create an AWS account
   - Create an IAM user with appropriate permissions
   - Configure AWS CLI

2. **Environment Variables**
   Set these in your GitHub repository secrets:
   ```
   AWS_ACCESS_KEY_ID=your_access_key
   AWS_SECRET_ACCESS_KEY=your_secret_key
   AWS_REGION=us-east-1
   ```

#### Deployment Steps

1. **Push to main branch**
   The GitHub Actions workflow will automatically:
   - Run tests
   - Build Docker images
   - Deploy to AWS Lambda (backend)
   - Deploy to S3/CloudFront (frontend)

2. **Manual Deployment**
```bash
# Build and push Docker images
docker build -f docker/Dockerfile.core -t worksim-core .
docker build -f docker/Dockerfile.frontend -t worksim-frontend .

# Deploy to AWS
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin your-account.dkr.ecr.us-east-1.amazonaws.com
docker tag worksim-core:latest your-account.dkr.ecr.us-east-1.amazonaws.com/worksim-core:latest
docker push your-account.dkr.ecr.us-east-1.amazonaws.com/worksim-core:latest
```

### Docker Deployment

#### Single Server

```bash
# Build and run
docker-compose -f docker/docker-compose.yml up --build -d

# Check logs
docker-compose -f docker/docker-compose.yml logs -f
```

#### Multi-Server

1. **Load Balancer Setup**
   - Use nginx or HAProxy
   - Configure SSL certificates
   - Set up health checks

2. **Database Setup**
   - PostgreSQL for production data
   - Redis for caching and sessions
   - Configure backups

3. **Monitoring**
   - Prometheus for metrics
   - Grafana for dashboards
   - ELK stack for logging

## Environment Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# API Settings
API_V1_STR=/api/v1
PROJECT_NAME=Work Simulation Platform

# Security
SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Database
DATABASE_URL=postgresql://user:password@localhost/dbname

# Redis
REDIS_URL=redis://localhost:6379

# AWS
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
S3_BUCKET=your-bucket-name

# OpenAI
OPENAI_API_KEY=your_openai_key

# CORS
CORS_ORIGINS=["http://localhost:3000", "https://yourdomain.com"]
```

### Production Checklist

- [ ] Set strong secret keys
- [ ] Configure HTTPS/SSL
- [ ] Set up monitoring and logging
- [ ] Configure backups
- [ ] Set up CI/CD pipeline
- [ ] Configure rate limiting
- [ ] Set up authentication
- [ ] Configure CORS properly
- [ ] Set up error tracking
- [ ] Configure caching

## Scaling

### Horizontal Scaling

1. **Load Balancer**
   - Use AWS ALB or nginx
   - Configure health checks
   - Set up auto-scaling groups

2. **Database Scaling**
   - Read replicas for read-heavy workloads
   - Connection pooling
   - Database sharding for large datasets

3. **Caching**
   - Redis cluster for high availability
   - CDN for static assets
   - Application-level caching

### Performance Optimization

1. **Backend**
   - Async/await for I/O operations
   - Database query optimization
   - Connection pooling
   - Caching strategies

2. **Frontend**
   - Code splitting
   - Lazy loading
   - Image optimization
   - CDN for static assets

## Security

### Security Checklist

- [ ] HTTPS everywhere
- [ ] Input validation
- [ ] SQL injection prevention
- [ ] XSS protection
- [ ] CSRF protection
- [ ] Rate limiting
- [ ] Authentication/Authorization
- [ ] Secure headers
- [ ] Regular security updates
- [ ] Vulnerability scanning

### SSL/TLS Setup

```bash
# 