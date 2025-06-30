# AI-Powered Workplace Simulation Platform

A comprehensive platform for practicing real workplace scenarios with intelligent AI agents that maintain persistent memory and engage in realistic workplace dynamics.

## 🌟 Key Features

### 🔐 **User Authentication & Project Management**
- **User Registration & Login**: Secure authentication system with session management
- **Project Creation**: Create projects with role selection and team generation
- **Role-Based Access**: Choose from various professional roles (Developer, Manager, Designer, etc.)
- **Team Management**: AI-generated team members with realistic personalities and skills

### 🧠 **Persistent Memory with RAG**
- **Conversation Memory**: All conversations are stored and indexed using RAG (Retrieval-Augmented Generation)
- **Context Awareness**: AI agents remember previous interactions and build on past discussions
- **Semantic Search**: Find relevant past conversations and project context
- **Memory Persistence**: Long-term memory across sessions and project phases

### 💬 **Realistic Workplace Conversations**
- **Agent-Initiated Conversations**: AI team members can start conversations based on project needs
- **Scheduled Interactions**: Automatic scheduling of daily standups, code reviews, and team meetings
- **Dynamic Responses**: AI agents respond contextually based on their role, personality, and project history
- **Conversation Types**: Support for various workplace conversation types (standups, reviews, one-on-ones, etc.)

### 🎯 **Workplace Dynamics**
- **Hierarchical Structure**: Realistic reporting relationships and organizational structure
- **Role-Based Interactions**: Different conversation patterns based on roles and seniority
- **Project Phases**: Support for different project lifecycle phases
- **Task Management**: Integrated task assignment and tracking

### 📊 **Comprehensive Tracking**
- **Daily Conversation Logs**: Track all conversations by date
- **Project Analytics**: Monitor project progress and team interactions
- **Memory Analytics**: Understand how AI agents use and reference past interactions
- **Performance Insights**: Analyze communication patterns and workplace effectiveness

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- PostgreSQL (optional, SQLite for development)

### Backend Setup

1. **Clone and Install Dependencies**
```bash
git clone <repository-url>
cd open-core-work-sim-platform
pip install -r requirements.txt
```

2. **Environment Configuration**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Database Setup**
```bash
# For SQLite (development)
python -c "from core.db import engine; from core.models import Base; Base.metadata.create_all(bind=engine)"

# For PostgreSQL (production)
# Update DATABASE_URL in .env and run migrations
```

4. **Start the Backend**
```bash
python main.py
```

### Frontend Setup

1. **Install Dependencies**
```bash
cd frontend
npm install
```

2. **Start Development Server**
```bash
npm start
```

3. **Access the Application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

## 📖 Usage Guide

### 1. **Getting Started**
1. Register a new account or log in
2. Create your first project
3. Select your role (e.g., Junior Developer, Project Manager)
4. Choose project type and team size

### 2. **Project Creation**
- **Name & Description**: Define your project scope
- **Role Selection**: Choose your position in the team
- **Team Generation**: AI creates realistic team members based on your role
- **Project Type**: Select from web development, mobile app, data science, etc.

### 3. **Workplace Interactions**
- **Start Conversations**: Initiate discussions with team members
- **Respond to AI**: Engage with AI agents that remember previous interactions
- **Agent-Initiated**: AI team members may start conversations with you
- **Scheduled Meetings**: Participate in automatically scheduled team meetings

### 4. **Memory & Context**
- **Persistent Memory**: All conversations are stored and indexed
- **Context Search**: Query project memory for relevant past discussions
- **Role-Based Memory**: AI agents maintain role-specific context and knowledge

## 🏗️ Architecture

### Backend Components

```
core/
├── api.py                 # FastAPI application and endpoints
├── models.py              # Database models and schemas
├── db.py                  # Database configuration
├── config.py              # Application configuration
├── auth/                  # Authentication system
│   ├── manager.py         # User authentication and session management
│   └── models.py          # Auth-related data models
├── projects/              # Project management
│   ├── manager.py         # Project lifecycle and team management
│   └── rag_manager.py     # RAG-based memory system
├── agents/                # AI agent system
│   └── manager.py         # Agent management and interactions
├── conversation/          # Conversation management
│   └── context_manager.py # Conversation context and memory
└── simulation/            # Simulation engine
    └── engine.py          # Workplace simulation logic
```

### Frontend Components

```
frontend/src/
├── contexts/
│   └── AuthContext.tsx    # Authentication state management
├── pages/
│   ├── LoginPage.tsx      # User login
│   ├── RegisterPage.tsx   # User registration
│   ├── DashboardPage.tsx  # Project overview
│   └── ProjectPage.tsx    # Project workspace
├── components/
│   ├── Header.tsx         # Navigation header
│   └── ChatWindow.tsx     # Conversation interface
└── services/
    └── api.ts             # API service layer
```

## 🔧 Configuration

### Environment Variables

```env
# Database
DATABASE_URL=sqlite:///./work_sim.db
# DATABASE_URL=postgresql://user:pass@localhost/work_sim

# Authentication
SECRET_KEY=your-secret-key
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# AI Services
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key

# RAG Configuration
EMBEDDING_MODEL=all-MiniLM-L6-v2
VECTOR_DB_PATH=./vector_db

# CORS
CORS_ORIGINS=["http://localhost:3000"]
```

### Database Models

The platform uses SQLAlchemy with the following key models:

- **User**: User accounts and authentication
- **Project**: Project definitions and settings
- **ProjectMember**: Team members (users and AI agents)
- **Conversation**: Conversation records and metadata
- **Message**: Individual messages in conversations
- **ProjectMemory**: RAG-indexed memory chunks
- **ScheduledConversation**: Agent-initiated conversation scheduling

## 🧪 Testing

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

## 🚀 Deployment

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up --build
```

### Production Considerations
1. **Database**: Use PostgreSQL for production
2. **Authentication**: Implement proper JWT token management
3. **Security**: Configure CORS, rate limiting, and input validation
4. **Monitoring**: Add logging and monitoring for AI interactions
5. **Scaling**: Consider Redis for session management and caching

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the [documentation](docs/)
- Review the [API documentation](http://localhost:8000/docs)

## 🔮 Roadmap

- [ ] Advanced AI agent personalities and behaviors
- [ ] Multi-language support
- [ ] Video/audio conversation simulation
- [ ] Integration with external project management tools
- [ ] Advanced analytics and reporting
- [ ] Mobile application
- [ ] Real-time collaboration features
- [ ] Custom scenario creation tools

---

**Note**: This platform is designed for educational and training purposes. AI agents simulate workplace interactions but should not replace real professional development and mentorship.