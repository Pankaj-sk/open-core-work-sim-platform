# Work Simulation Platform

A full-stack AI-powered work simulation platform with FastAPI backend and React frontend for practicing real-world job roles and generating productivity artifacts.

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

## 💼 Commercial Use

This project is open source under the **Apache 2.0 License**, which allows for commercial use, modification, and distribution. However, if you plan to:

- **Use this in a commercial product or service**
- **Deploy as a SaaS platform**
- **Integrate into enterprise training programs**
- **Resell or redistribute commercially**

Please reach out to discuss licensing terms and potential collaboration opportunities.

**Contact**: [your-email@domain.com] or raise an issue for commercial inquiries.

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines.

### Open Source Model
- ✅ **Free to use** for personal and educational purposes
- ✅ **Free to modify** and contribute back
- ✅ **Commercial use allowed** under Apache 2.0
- ⚠️ **Commercial licensing** available for enterprise features

## 📝 License

**Apache License 2.0** - see [LICENSE](./LICENSE) for details.

This license provides:
- **Patent protection** for contributors
- **Commercial use rights**
- **Modification and distribution permissions**
- **Attribution requirements**

## 🌟 Why Apache 2.0?

We chose Apache 2.0 because it:
- **Protects contributors** from patent litigation
- **Allows commercial use** while maintaining open source benefits
- **Provides clear terms** for enterprise adoption
- **Enables dual licensing** for premium features

---

**Built with ❤️ for the open source community** 