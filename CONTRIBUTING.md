# Contributing to Work Simulation Platform

Thank you for your interest in contributing to the Work Simulation Platform! This document provides guidelines for contributing to the project.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Python 3.11+
- Git
- Docker (optional)

### Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/YOUR_USERNAME/work-sim-platform.git
   cd work-sim-platform
   ```

2. **Backend Setup**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   uvicorn main:app --reload
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm start
   ```

## 📝 Development Guidelines

### Branch Naming Convention
- `feat/feature-name` - New features
- `fix/bug-description` - Bug fixes
- `docs/documentation-update` - Documentation changes
- `refactor/component-name` - Code refactoring
- `test/test-description` - Adding or updating tests

### Code Style

#### Python (Backend)
- Follow PEP 8 style guide
- Use type hints for function parameters and return values
- Write docstrings for all public functions and classes
- Maximum line length: 88 characters (use Black formatter)

#### TypeScript/React (Frontend)
- Use TypeScript for all new code
- Follow ESLint configuration
- Use functional components with hooks
- Prefer named exports over default exports
- Use Tailwind CSS for styling

### Testing

#### Backend Tests
```bash
cd backend
pytest tests/ -v --cov=core --cov=routes
```

#### Frontend Tests
```bash
cd frontend
npm test
npm run test:coverage
```

### Commit Messages
Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
type(scope): description

[optional body]

[optional footer]
```

Examples:
- `feat(simulation): add new team meeting scenario`
- `fix(chat): resolve message display issue`
- `docs(readme): update installation instructions`

## 🔄 Pull Request Process

1. **Create a Feature Branch**
   ```bash
   git checkout -b feat/your-feature-name
   ```

2. **Make Your Changes**
   - Write clean, well-documented code
   - Add tests for new functionality
   - Update documentation as needed

3. **Test Your Changes**
   - Run backend tests: `pytest tests/ -v`
   - Run frontend tests: `npm test`
   - Test manually in the browser

4. **Commit Your Changes**
   ```bash
   git add .
   git commit -m "feat(scope): description"
   ```

5. **Push and Create PR**
   ```bash
   git push origin feat/your-feature-name
   ```

6. **Pull Request Guidelines**
   - Provide a clear description of changes
   - Include screenshots for UI changes
   - Reference related issues
   - Ensure all tests pass
   - Request reviews from maintainers

## 🏗️ Project Structure

```
work-sim-platform/
├── backend/                 # FastAPI backend
│   ├── core/               # Core business logic
│   ├── routes/             # API endpoints
│   ├── tests/              # Backend tests
│   └── requirements.txt    # Python dependencies
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   └── utils/          # Utility functions
│   └── package.json        # Node.js dependencies
├── agents/                 # AI agent implementations
├── simulations/            # Simulation scenarios
├── data/                   # Seed data and artifacts
├── scripts/                # Utility scripts
├── docker/                 # Docker configurations
└── .github/                # GitHub Actions workflows
```

## 🐛 Bug Reports

When reporting bugs, please include:

1. **Environment Information**
   - OS and version
   - Node.js version
   - Python version
   - Browser (for frontend issues)

2. **Steps to Reproduce**
   - Clear, step-by-step instructions
   - Expected vs actual behavior

3. **Additional Context**
   - Screenshots or screen recordings
   - Console errors
   - Network tab information

## 💡 Feature Requests

When suggesting new features:

1. **Describe the Problem**
   - What problem does this feature solve?
   - Who would benefit from this feature?

2. **Propose a Solution**
   - How should this feature work?
   - Any technical considerations?

3. **Provide Context**
   - Similar features in other applications
   - Mockups or wireframes

## 📞 Getting Help

- **Issues**: Use GitHub Issues for bug reports and feature requests
- **Discussions**: Use GitHub Discussions for questions and general discussion
- **Documentation**: Check the README and inline code documentation

## 🎯 Areas for Contribution

- **AI Agents**: Improve agent personalities and responses
- **Simulation Scenarios**: Create new workplace scenarios
- **UI/UX**: Enhance the user interface and experience
- **Testing**: Add more comprehensive test coverage
- **Documentation**: Improve code and user documentation
- **Performance**: Optimize application performance
- **Security**: Identify and fix security vulnerabilities

## 📄 License

By contributing to this project, you agree that your contributions will be licensed under the MIT License.

Thank you for contributing to the Work Simulation Platform! 🚀 