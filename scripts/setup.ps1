#!/usr/bin/env powershell

# Work Simulation Platform Setup Script for Windows
Write-Host "🚀 Setting up Work Simulation Platform..." -ForegroundColor Green

# Check if Python 3.11+ is installed
try {
    $pythonVersion = python --version 2>$null
    if ($pythonVersion -match "Python (\d+\.\d+)") {
        $version = [Version]$matches[1]
        if ($version -lt [Version]"3.8") {
            Write-Host "❌ Python 3.8+ is required. Current version: $pythonVersion" -ForegroundColor Red
            exit 1
        }
    }
} catch {
    Write-Host "❌ Python is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

# Check if Node.js 18+ is installed
try {
    $nodeVersion = node --version 2>$null
    if ($nodeVersion -match "v(\d+)") {
        $version = [int]$matches[1]
        if ($version -lt 16) {
            Write-Host "❌ Node.js 16+ is required. Current version: $nodeVersion" -ForegroundColor Red
            exit 1
        }
    }
} catch {
    Write-Host "❌ Node.js is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Prerequisites check passed" -ForegroundColor Green

# Backend setup
Write-Host "📦 Setting up backend..." -ForegroundColor Blue

# Create virtual environment
if (-not (Test-Path "venv")) {
    Write-Host "Creating Python virtual environment..."
    python -m venv venv
}

# Activate virtual environment
Write-Host "Activating virtual environment..."
& ".\venv\Scripts\Activate.ps1"

# Install dependencies
Write-Host "Installing Python dependencies..."
pip install -r requirements.txt

# Run tests
Write-Host "Running backend tests..."
python -m pytest tests/ -v

# Frontend setup
Write-Host "📦 Setting up frontend..." -ForegroundColor Blue
Set-Location frontend

# Install dependencies
Write-Host "Installing Node.js dependencies..."
npm install

# Build frontend
Write-Host "Building frontend..."
npm run build

Set-Location ..

Write-Host "✅ Setup completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "🎯 Next steps:" -ForegroundColor Yellow
Write-Host "1. Start backend: .\venv\Scripts\Activate.ps1 && python main.py"
Write-Host "2. Start frontend: cd frontend && npm start"
Write-Host "3. Open http://localhost:3000 in your browser"
Write-Host ""
Write-Host "📚 For more information, see README.md and CONTRIBUTING.md"
