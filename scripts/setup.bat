@echo off
REM Work Simulation Platform Setup Script for Windows
echo 🚀 Setting up Work Simulation Platform...

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed or not in PATH
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed or not in PATH
    pause
    exit /b 1
)

echo ✅ Prerequisites check passed

REM Backend setup
echo 📦 Setting up backend...

REM Create virtual environment
if not exist "venv" (
    echo Creating Python virtual environment...
    python -m venv venv
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Install dependencies
echo Installing Python dependencies...
pip install -r requirements.txt

REM Frontend setup
echo 📦 Setting up frontend...
cd frontend

REM Install dependencies
echo Installing Node.js dependencies...
npm install

REM Build frontend
echo Building frontend...
npm run build

cd ..

echo ✅ Setup completed successfully!
echo.
echo 🎯 Next steps:
echo 1. Start backend: venv\Scripts\activate.bat ^&^& python main.py
echo 2. Start frontend: cd frontend ^&^& npm start
echo 3. Open http://localhost:3000 in your browser
echo.
echo 📚 For more information, see README.md and CONTRIBUTING.md
pause
