# Installation Guide - Workplace Simulation Platform

This guide will help you set up the complete AI-powered workplace simulation platform with persistent memory and realistic workplace interactions.

## 🎯 Overview

The platform consists of:
- **Backend**: FastAPI server with SQLAlchemy database, RAG memory system, and AI agent management
- **Frontend**: React application with TypeScript for the user interface
- **AI Components**: Sentence transformers for embeddings, FAISS for vector search, and AI agent interactions

## 📋 Prerequisites

### System Requirements
- **Python**: 3.8 or higher
- **Node.js**: 16.0 or higher
- **npm**: 8.0 or higher
- **RAM**: Minimum 4GB (8GB recommended for AI features)
- **Storage**: 2GB free space

### Operating Systems
- ✅ Windows 10/11
- ✅ macOS 10.15+
- ✅ Ubuntu 18.04+ / Debian 10+
- ✅ CentOS 7+ / RHEL 7+

## 🚀 Quick Installation

### Option 1: Automated Setup (Recommended)

1. **Clone the repository**
```bash
git clone https://github.com/your-org/workplace-simulation-platform.git
cd workplace-simulation-platform
```

2. **Run the setup script**
```bash
# On Windows
python run_platform.py

# On macOS/Linux
chmod +x run_platform.py
./run_platform.py
```

The script will automatically:
- Check dependencies
- Install Python packages
- Set up the database
- Install frontend dependencies
- Start both servers
- Open the application in your browser

### Option 2: Manual Setup

Follow the detailed steps below for manual installation.

## 🔧 Manual Installation Steps

### Step 1: Backend Setup

1. **Create a virtual environment**
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

2. **Install Python dependencies**
```bash
pip install -r requirements.txt
```

3. **Set up environment variables**
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your configuration
# For development, the defaults should work
```

4. **Initialize the database**
```bash
python -c "from core.db import engine; from core.models import Base; Base.metadata.create_all(bind=engine)"
```

5. **Start the backend server**
```bash
python main.py
```

The backend will be available at: http://localhost:8000

### Step 2: Frontend Setup

1. **Navigate to the frontend directory**
```bash
cd frontend
```

2. **Install Node.js dependencies**
```bash
npm install
```

3. **Start the development server**
```bash
npm start
```

The frontend will be available at: http://localhost:3000

## 🗄️ Database Configuration

### SQLite (Development - Default)
The platform uses SQLite by default for development. No additional setup required.

### PostgreSQL (Production)
For production deployments, configure PostgreSQL:

1. **Install PostgreSQL**
```bash
# Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib

# macOS
brew install postgresql

# Windows
# Download from https://www.postgresql.org/download/windows/
```

2. **Create database and user**
```sql
CREATE DATABASE workplace_sim;
CREATE USER workplace_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE workplace_sim TO workplace_user;
```

3. **Update environment variables**
```env
DATABASE_URL=postgresql://workplace_user:your_password@localhost/workplace_sim
```

## 🤖 AI Configuration

### OpenAI Integration (Optional)
For enhanced AI capabilities:

1. **Get an OpenAI API key**
   - Visit https://platform.openai.com/
   - Create an account and get an API key

2. **Configure the API key**
```env
OPENAI_API_KEY=your_openai_api_key_here
```

### Anthropic Integration (Optional)
For Claude AI support:

1. **Get an Anthropic API key**
   - Visit https://console.anthropic.com/
   - Create an account and get an API key

2. **Configure the API key**
```env
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

## 🔐 Authentication Setup

The platform includes a built-in authentication system. For production:

1. **Generate a secure secret key**
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

2. **Update the secret key in .env**
```env
SECRET_KEY=your_generated_secret_key_here
```

## 🧪 Testing the Installation

### Backend Tests
```bash
# Run all tests
pytest

# Run specific test categories
pytest tests/test_auth.py
pytest tests/test_projects.py
pytest tests/test_conversations.py
```

### Frontend Tests
```bash
cd frontend
npm test
```

### Manual Testing
1. Open http://localhost:3000
2. Register a new account
3. Create a project
4. Start a conversation
5. Verify AI responses

## 🐳 Docker Installation

### Using Docker Compose

1. **Build and run with Docker**
```bash
docker-compose up --build
```

2. **Access the application**
- Frontend: http://localhost:3000
- Backend: http://localhost:8000

### Docker Configuration
The platform includes Docker configuration for:
- Backend service with Python
- Frontend service with Node.js
- PostgreSQL database (optional)
- Redis for caching (optional)

## 🔧 Configuration Options

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | Database connection string | `sqlite:///./work_sim.db` |
| `SECRET_KEY` | JWT secret key | Auto-generated |
| `CORS_ORIGINS` | Allowed CORS origins | `["http://localhost:3000"]` |
| `OPENAI_API_KEY` | OpenAI API key | None |
| `ANTHROPIC_API_KEY` | Anthropic API key | None |
| `EMBEDDING_MODEL` | RAG embedding model | `all-MiniLM-L6-v2` |
| `VECTOR_DB_PATH` | Vector database path | `./vector_db` |

### Advanced Configuration

#### RAG Memory System
```env
# Embedding model for semantic search
EMBEDDING_MODEL=all-MiniLM-L6-v2

# Vector database storage
VECTOR_DB_PATH=./vector_db

# Memory chunk size
MEMORY_CHUNK_SIZE=1000
```

#### AI Agent Configuration
```env
# Default AI model
DEFAULT_AI_MODEL=gpt-3.5-turbo

# Conversation context window
MAX_CONTEXT_LENGTH=4000

# Response generation timeout
AI_TIMEOUT=30
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Check what's using the port
lsof -i :8000  # Backend
lsof -i :3000  # Frontend

# Kill the process or change ports in .env
```

#### 2. Database Connection Issues
```bash
# Check database file permissions
ls -la work_sim.db

# Recreate database
rm work_sim.db
python -c "from core.db import engine; from core.models import Base; Base.metadata.create_all(bind=engine)"
```

#### 3. Frontend Build Issues
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### 4. AI Features Not Working
```bash
# Check API keys are set
echo $OPENAI_API_KEY
echo $ANTHROPIC_API_KEY

# Test API connectivity
python -c "import openai; print('OpenAI configured')"
```

#### 5. Memory Issues
```bash
# Check available RAM
free -h

# Increase swap space if needed
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### Getting Help

1. **Check the logs**
```bash
# Backend logs
tail -f logs/backend.log

# Frontend logs (in browser console)
```

2. **Verify installation**
```bash
# Run the verification script
python scripts/verify_installation.py
```

3. **Create an issue**
- Include your operating system
- Python and Node.js versions
- Error messages and logs
- Steps to reproduce the issue

## 🔄 Updates and Maintenance

### Updating the Platform
```bash
# Pull latest changes
git pull origin main

# Update dependencies
pip install -r requirements.txt
cd frontend && npm install

# Restart services
```

### Backup and Restore
```bash
# Backup database
cp work_sim.db work_sim_backup.db

# Backup vector database
cp -r vector_db vector_db_backup

# Restore from backup
cp work_sim_backup.db work_sim.db
cp -r vector_db_backup vector_db
```

## 📚 Next Steps

After successful installation:

1. **Read the documentation**
   - [User Guide](docs/USER_GUIDE.md)
   - [API Documentation](http://localhost:8000/docs)
   - [Developer Guide](docs/DEVELOPER_GUIDE.md)

2. **Explore features**
   - Create your first project
   - Try different roles
   - Experiment with AI conversations
   - Test the memory system

3. **Customize the platform**
   - Add custom AI agents
   - Modify conversation types
   - Extend the RAG system
   - Integrate with external tools

## 🆘 Support

For additional help:
- 📖 [Documentation](docs/)
- 🐛 [Issue Tracker](https://github.com/your-org/workplace-simulation-platform/issues)
- 💬 [Discussions](https://github.com/your-org/workplace-simulation-platform/discussions)
- 📧 [Email Support](mailto:support@worksimulation.com)

---

**Note**: This platform is designed for educational and training purposes. Ensure you comply with your organization's policies regarding AI usage and data privacy.
