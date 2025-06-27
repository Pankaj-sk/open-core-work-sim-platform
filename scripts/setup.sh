#!/bin/bash

# Work Simulation Platform Setup Script
echo "🚀 Setting up Work Simulation Platform..."

# Check if Python 3.11+ is installed
python_version=$(python3 --version 2>&1 | grep -oP '\d+\.\d+' | head -1)
if [[ $(echo "$python_version >= 3.11" | bc -l) -eq 0 ]]; then
    echo "❌ Python 3.11+ is required. Current version: $python_version"
    exit 1
fi

# Check if Node.js 18+ is installed
node_version=$(node --version 2>&1 | grep -oP '\d+' | head -1)
if [[ $node_version -lt 18 ]]; then
    echo "❌ Node.js 18+ is required. Current version: $node_version"
    exit 1
fi

echo "✅ Prerequisites check passed"

# Backend setup
echo "📦 Setting up backend..."

# Create virtual environment
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

# Run tests
echo "Running backend tests..."
python -m pytest tests/ -v

# Frontend setup
echo "📦 Setting up frontend..."
cd frontend

# Install dependencies
echo "Installing Node.js dependencies..."
npm install

# Run tests
echo "Running frontend tests..."
npm test -- --watchAll=false --coverage

cd ..

echo "✅ Setup completed successfully!"
echo ""
echo "🎯 Next steps:"
echo "1. Start backend: cd backend && source venv/bin/activate && uvicorn main:app --reload"
echo "2. Start frontend: cd frontend && npm start"
echo "3. Open http://localhost:3000 in your browser"
echo ""
echo "📚 For more information, see README.md and CONTRIBUTING.md" 