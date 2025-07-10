# 🚀 SimWorld - AI-Powered Career Development Platform

> **Your Personal AI Coach for Professional Growth Through Realistic Team Collaboration**

SimWorld is an innovative career development platform that combines AI coaching with realistic team simulation to help professionals grow their skills in a safe, personalized environment. Built with modern web technologies and powered by advanced AI, SimWorld provides an immersive learning experience tailored to your career goals.

## ✨ **What SimWorld Does**

### 🧠 **Intelligent AI Career Coach**
- **Personalized Assessment**: Complete a comprehensive skill assessment to help the AI understand your current abilities and career aspirations
- **Smart Roadmap Generation**: Your AI coach creates a customized development plan with specific projects, timelines, and learning objectives
- **Continuous Mentoring**: Get real-time advice, answer questions about your roadmap, meetings, and career progression
- **Adaptive Learning**: The AI coach can modify your roadmap at any time based on your progress, feedback, and changing goals
- **Meeting Analysis**: Your coach analyzes all your team interactions and provides insights on communication patterns and areas for improvement

### 💼 **Realistic Project Workspace**
- **Immersive Team Simulation**: Work with AI team members that have distinct personalities, roles, and communication styles
- **Real-World Scenarios**: Engage in authentic workplace situations like team meetings, code reviews, project planning, and one-on-ones
- **Skill-Focused Projects**: Each project targets specific competencies like communication, leadership, technical skills, or collaboration
- **Safe Learning Environment**: Practice difficult conversations and challenging scenarios without real-world consequences

### 💬 **Advanced Conversation System**
- **Natural AI Interactions**: Chat with AI team members who remember your conversation history and maintain consistent personalities
- **Dynamic Team Dynamics**: Experience different working styles - from supportive colleagues to challenging managers
- **Meeting Types**: Participate in various meeting formats including daily standups, project reviews, brainstorming sessions, and performance discussions
- **Real-Time Feedback**: Get immediate responses and coaching suggestions during conversations

### 📊 **Comprehensive Progress Tracking**
- **Performance Analytics**: Track your development across multiple dimensions including communication effectiveness, leadership skills, and technical competency
- **Detailed Debriefs**: After each project, receive in-depth analysis of your strengths, improvement areas, and personalized next steps
- **Journey Documentation**: Build a portfolio of your professional development with concrete examples of growth and achievement
- **Goal Alignment**: Monitor progress toward your specific career objectives with measurable milestones

## 🛠️ **Technical Stack**

### **Frontend Technologies**
- **React 18** with **TypeScript** for type-safe, modern web development
- **Tailwind CSS** for utility-first styling and responsive design
- **Framer Motion** for smooth animations and micro-interactions
- **React Router** for seamless single-page application navigation
- **React Query** for efficient data fetching and caching
- **Radix UI** components for accessible, composable UI elements
- **Lucide React** for consistent, beautiful icons
- **Axios** for API communication
- **React Hook Form** with **Zod** validation for forms

### **Backend Technologies**
- **Python 3.8+** with **FastAPI** for high-performance API development
- **SQLAlchemy** ORM with **SQLite** (development) or **PostgreSQL** (production)
- **Alembic** for database migrations and version control
- **Pydantic** for data validation and serialization
- **JWT** authentication with **python-jose** for secure user sessions
- **OpenAI API** integration for advanced AI capabilities
- **Google Generative AI** for enhanced coaching and responses
- **Redis** for caching and session management (optional)

### **AI & Machine Learning**
- **OpenAI GPT Models** for AI coach and team member personalities
- **Google Gemini** for advanced conversation generation and analysis
- **LangChain** for AI workflow orchestration
- **Sentence Transformers** for semantic search and content matching
- **Custom AI Personas** with distinct personalities and communication styles

## 🚀 **Getting Started**

### **System Requirements**
- **Python 3.8 or higher**
- **Node.js 16 or higher**
- **npm 7+ or yarn 1.22+**
- **Git** for version control
- **OpenAI API Key** (required for AI functionality)
- **Google AI API Key** (optional, for enhanced features)

### **Installation & Setup**

#### **1. Clone the Repository**
```bash
git clone <repository-url>
cd open-core-work-sim-platform
```

#### **2. Backend Setup**

**Install Python Dependencies:**
```bash
# Create virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

**Configure Environment Variables:**
```bash
# Copy the environment template
cp .env.example .env

# Edit .env and add your API keys:
# GOOGLE_API_KEY=your_google_ai_api_key_here
# OPENAI_API_KEY=your_openai_api_key_here (optional)
```

**Initialize Database:**
```bash
# Create and setup the database
python init_db.py

# (Optional) Create demo data
python create_demo_project.py
```

**Start Backend Server:**
```bash
# Option 1: Using the convenience script (recommended)
python start_backend.py

# Option 2: Direct uvicorn command
# Development mode with auto-reload
uvicorn core.api:app --host 0.0.0.0 --port 8000 --reload

# Alternative: Production mode
uvicorn core.api:app --host 0.0.0.0 --port 8000

# The backend will run on http://localhost:8000
# API Documentation: http://localhost:8000/docs
```

#### **3. Frontend Setup**

**Install Node.js Dependencies:**
```bash
cd frontend

# Install all required packages
npm install

# Alternative with yarn:
# yarn install
```

**Configure Frontend Environment:**
```bash
# Create environment file (if needed)
# Most configuration is handled by the backend
```

**Start Frontend Development Server:**
```bash
# Start the React development server
npm start

# Alternative with yarn:
# yarn start

# The frontend will run on http://localhost:3000
```

#### **4. Access the Application**
- **Frontend (User Interface)**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs (FastAPI auto-generated docs)

### **Quick Start Commands**

**Development Workflow:**
```bash
# Terminal 1 - Backend (choose one)
cd open-core-work-sim-platform
python start_backend.py  # Recommended
# OR: uvicorn core.api:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2 - Frontend  
cd open-core-work-sim-platform/frontend
npm start
```

**Production Build:**
```bash
# Build frontend for production
cd frontend
npm run build

# Start production server
cd ..
python start_production.py
```

## 🔧 **Configuration**

### **Environment Variables (.env)**
```env
# AI Configuration (Required)
GOOGLE_API_KEY=your_google_ai_api_key_here
# OPENAI_API_KEY=your_openai_api_key_here

# Database Configuration
DATABASE_URL=sqlite:///simulation.db
# For production PostgreSQL:
# DATABASE_URL=postgresql://username:password@localhost/simworld_db

# Security Configuration
SECRET_KEY=your-unique-secret-key-change-in-production
JWT_SECRET_KEY=your-jwt-secret-key-change-in-production

# FastAPI/Uvicorn Configuration
ENVIRONMENT=development
DEBUG=true

# Server Configuration
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000
RELOAD=true
LOG_LEVEL=info

# AI Model Settings
AI_PROVIDER=google
GOOGLE_MODEL=gemini-1.5-flash
GOOGLE_MAX_TOKENS=1000
GOOGLE_TEMPERATURE=0.7

# CORS Configuration
CORS_ORIGINS=["http://localhost:3000"]
```

### **Frontend Dependencies (package.json)**
Key packages automatically installed with `npm install`:

**Core React Dependencies:**
- `react@^18.2.0` - React framework
- `react-dom@^18.2.0` - React DOM rendering
- `typescript@^4.9.5` - TypeScript support
- `react-scripts@^5.0.1` - Create React App build tools

**Routing & State Management:**
- `react-router-dom@^6.20.1` - Client-side routing
- `@tanstack/react-query@^5.81.5` - Data fetching and caching

**UI & Styling:**
- `tailwindcss@^3.3.6` - Utility-first CSS framework
- `framer-motion@^12.23.0` - Animation library
- `lucide-react@^0.294.0` - Icon library
- `@radix-ui/*` - Accessible UI components

**Forms & Validation:**
- `react-hook-form@^7.59.0` - Form handling
- `zod@^3.25.74` - Schema validation

**AI Integration:**
- `@google/generative-ai@^0.24.1` - Google AI client
- `axios@^1.6.2` - HTTP client for API calls

### **Backend Dependencies (requirements.txt)**
Key packages automatically installed with `pip install -r requirements.txt`:

**Web Framework:**
- `fastapi==0.104.1` - Modern, fast web framework
- `uvicorn[standard]==0.24.0` - ASGI server

**Database:**
- `sqlalchemy==2.0.23` - SQL toolkit and ORM
- `alembic==1.13.0` - Database migrations
- `psycopg2-binary==2.9.9` - PostgreSQL adapter

**Authentication & Security:**
- `python-jose[cryptography]==3.3.0` - JWT tokens
- `passlib[bcrypt]==1.7.4` - Password hashing
- `pydantic==2.5.0` - Data validation

**AI & Machine Learning:**
- `openai==1.3.7` - OpenAI API client
- `langchain==0.0.350` - AI workflow framework
- `sentence-transformers==2.2.2` - Semantic embeddings
- `numpy==1.24.3` - Numerical computing
- `pandas==2.0.3` - Data manipulation

## 📱 **User Journey**

### **1. Registration & Onboarding**
1. Create account with email and password
2. Complete comprehensive skill assessment:
   - Current role and experience level
   - Career goals and aspirations
   - Skills you want to develop
   - Workplace challenges you face
3. Meet your personal AI Career Coach

### **2. AI Coach Consultation**
1. Coach analyzes your profile using advanced AI
2. Generates personalized development roadmap:
   - Custom projects tailored to your goals
   - Specific learning objectives
   - Timeline and milestones
   - AI team members matched to your needs
3. Review and discuss roadmap with your coach
4. Start your development journey

### **3. Project-Based Learning**
1. Enter immersive project workspace
2. Meet your AI team members:
   - **Manager**: Provides direction, feedback, and performance reviews
   - **Colleagues**: Collaborate on tasks, ask questions, share ideas
   - **Senior Members**: Mentor, provide guidance, challenge your thinking
3. Participate in realistic workplace scenarios:
   - Daily standup meetings
   - Project planning sessions
   - Code reviews and technical discussions
   - One-on-one performance conversations
   - Team conflict resolution

### **4. Real-Time Coaching**
1. Chat with your AI coach anytime during projects
2. Ask questions about:
   - How to handle difficult team situations
   - Feedback on your communication style
   - Advice on career decisions
   - Modifications to your roadmap
3. Get insights from meeting analysis and conversation patterns

### **5. Progress Analysis & Growth**
1. Complete projects and receive detailed debriefs
2. AI coach analyzes all your interactions and provides:
   - Comprehensive skills assessment
   - Specific strengths you demonstrated
   - Areas for continued improvement
   - Personalized recommendations for next steps
3. Track progress over time with detailed analytics
4. Modify roadmap based on learning and interests

## 🎯 **Who Benefits from SimWorld**

### **Software Developers**
- **Junior Developers**: Practice communicating technical concepts and collaborating with senior team members
- **Mid-Level Engineers**: Develop leadership skills and learn to mentor others
- **Career Changers**: Understand software development team dynamics and communication patterns

### **Product & Project Managers**
- **New Managers**: Practice leading teams, handling conflicts, and providing effective feedback
- **Product Owners**: Improve stakeholder communication and requirements gathering
- **Scrum Masters**: Enhance facilitation skills and team dynamics management

### **Business Professionals**
- **Remote Workers**: Develop virtual collaboration and communication skills
- **Introverts**: Build confidence in team settings and public speaking
- **Career Climbers**: Practice skills needed for promotion to leadership roles

### **Students & Career Changers**
- **CS Students**: Gain realistic workplace experience before entering the job market
- **Bootcamp Graduates**: Bridge the gap between technical skills and professional communication
- **Career Switchers**: Learn industry-specific communication patterns and team dynamics

## 🔒 **Security & Privacy**

### **Data Protection**
- **Secure Authentication**: JWT-based sessions with bcrypt password hashing
- **API Security**: Rate limiting, input validation, and SQL injection prevention
- **Privacy First**: Your conversations and progress data remain private
- **GDPR Compliant**: User data handling follows privacy regulations

### **AI Integration Security**
- **API Key Management**: Secure storage and handling of AI service credentials
- **Content Filtering**: AI responses are monitored for appropriate workplace content
- **Data Minimization**: Only necessary data is sent to AI services
- **No Training Data**: Your conversations are not used to train AI models

## 🚧 **Development Roadmap**

### **Phase 1: Core Platform** ✅ *Complete*
- [x] User registration and authentication
- [x] Comprehensive skill assessment and onboarding
- [x] AI Coach with intelligent roadmap generation
- [x] Project workspace with AI team members
- [x] Real-time chat system with conversation memory
- [x] Progress tracking and detailed project debriefs
- [x] Google AI integration for enhanced coaching

### **Phase 2: Enhanced Experience** 🚧 *In Progress*
- [x] Conversation analysis and communication insights
- [x] Adaptive roadmap modification
- [x] Multiple AI personality types
- [ ] Advanced meeting scenarios (performance reviews, conflict resolution)
- [ ] Code sharing and technical discussion features
- [ ] Mobile-responsive design optimization

### **Phase 3: Advanced Features** 📋 *Planned*
- [ ] Multi-project career tracks
- [ ] Industry-specific scenarios (healthcare, finance, education)
- [ ] Integration with professional development platforms
- [ ] Team collaboration features for shared learning
- [ ] Advanced analytics and reporting
- [ ] API for enterprise integration

### **Phase 4: Scale & Community** 🔮 *Future*
- [ ] Learning community and peer connections
- [ ] Certification and skill verification
- [ ] Enterprise features for organizations
- [ ] Advanced AI models and conversation depth
- [ ] Integration with learning management systems

## 🤝 **Contributing**

We welcome contributions that enhance the core mission of professional development through AI-powered simulation!

### **Development Setup**
1. Follow the installation instructions above
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes with appropriate tests
4. Ensure code quality: `npm run lint` (frontend) and `flake8` (backend)
5. Submit a pull request with clear description

### **Contribution Guidelines**
- **Focus on User Experience**: Prioritize features that directly benefit learner growth
- **Maintain AI Quality**: Ensure AI interactions remain helpful and realistic
- **Code Quality**: Follow TypeScript/Python best practices and include tests
- **Documentation**: Update documentation for any new features or changes

### **Areas for Contribution**
- New AI personality types and conversation scenarios
- Enhanced UI/UX for better learning experience
- Additional skill assessment and tracking features
- Performance optimizations and bug fixes
- Documentation improvements and examples

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🆘 **Support & Troubleshooting**

### **Common Issues**

**Backend won't start:**
```bash
# Check Python version
python --version  # Should be 3.8+

# Reinstall dependencies
pip install -r requirements.txt

# Check database
python init_db.py
```

**Frontend build errors:**
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check Node version
node --version  # Should be 16+
```

**AI features not working:**
- Verify your API keys are set in `.env`
- Check API key permissions and quota
- Review backend logs for AI service errors

### **Getting Help**
- Check the [Issues](issues) section for known problems
- Review API documentation at `http://localhost:8000/docs`
- Examine browser console and backend logs for error messages

---

**Built with ❤️ for professional growth**

*SimWorld - Your AI-powered career development companion*