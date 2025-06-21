# Work Simulation Platform

A full-stack AI-powered work simulation platform with FastAPI backend and React frontend.

## 🚀 Features

- **AI Agents**: Dynamic role-based personas for realistic workplace simulations
- **Simulation Engine**: Configurable scenarios and event generation
- **Artifact Generation**: Automated document and report creation
- **Real-time Chat**: Interactive communication with AI agents
- **GitHub Integration**: Seamless collaboration and version control

## 🏗️ Architecture

```
work-sim-platform/
├── frontend/          # React + TypeScript + Tailwind
├── backend/           # FastAPI + Python
├── agents/            # AI agent implementations
├── simulations/       # Simulation scenarios and configs
├── data/             # Seed data and artifacts
├── scripts/          # Utility scripts
├── docker/           # Docker configurations
└── .github/          # CI/CD workflows
```

## 🛠️ Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- Docker (optional)
- AWS credentials (for deployment)

### Local Development

1. **Backend Setup**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

2. **Frontend Setup**
```bash
cd frontend
npm install
npm run dev
```

3. **Access the Application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## 🚀 Deployment

The project uses GitHub Actions for CI/CD:
- Push to `main` branch triggers deployment
- Backend deploys to AWS Lambda
- Frontend deploys to S3/Amplify

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines.

## 📝 License

MIT License - see [LICENSE](./LICENSE) for details. 