# 📦 Dependency Installation Guide

## Why doesn't the repository include `node_modules`?

The `node_modules` directory contains all the JavaScript/TypeScript dependencies for the frontend, but it's **intentionally excluded** from Git because:

- 📁 **Size**: Can be 100MB-500MB or larger
- 🚀 **Performance**: Slows down git operations and repository cloning
- 🔄 **Platform differences**: Dependencies may be compiled differently for different operating systems
- 🛡️ **Security**: The `package-lock.json` ensures everyone gets the exact same dependency versions

## 🚀 Quick Installation

### For the Frontend (React/TypeScript):
```bash
cd frontend
npm install
```

This command:
- ✅ Reads `package.json` to see what dependencies are needed
- ✅ Downloads and installs all dependencies into `node_modules/`
- ✅ Uses `package-lock.json` to ensure exact versions
- ✅ Automatically handles dependency trees and compatibility

### For the Backend (Python):
```bash
# Create virtual environment (recommended)
python -m venv venv

# Activate it
# Windows:
venv\Scripts\activate
# Unix/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

## 🎯 Files That ARE Included in Git

### Frontend Dependencies:
- ✅ `package.json` - Lists all dependencies and their version ranges
- ✅ `package-lock.json` - Locks exact versions for reproducible builds
- ❌ `node_modules/` - Generated locally by npm install

### Backend Dependencies:
- ✅ `requirements.txt` - Lists all Python packages and versions
- ✅ `core/requirements.txt` - Core API dependencies
- ❌ `venv/` - Virtual environment (created locally)

## 🔧 Automated Setup Scripts

We provide setup scripts that handle everything for you:

### Windows Users:
```cmd
scripts\setup.bat
```

### PowerShell Users:
```powershell
.\scripts\setup.ps1
```

### Unix/Linux/Mac Users:
```bash
./scripts/setup.sh
```

These scripts will:
1. ✅ Check prerequisites (Python, Node.js)
2. ✅ Create Python virtual environment
3. ✅ Install Python dependencies
4. ✅ Install Node.js dependencies (`npm install`)
5. ✅ Run tests to verify everything works
6. ✅ Provide next steps to start the application

## 🚨 Common Issues and Solutions

### Issue: "npm install" fails
**Solution:** Make sure you're in the `frontend/` directory:
```bash
cd frontend
npm install
```

### Issue: Python dependencies fail to install
**Solution:** Create and activate virtual environment first:
```bash
python -m venv venv
# Then activate and try again
```

### Issue: "Cannot find module" errors
**Solution:** Dependencies weren't installed. Run:
```bash
cd frontend
npm install
```

### Issue: Different versions on different machines
**Solution:** Always use `npm install` (not `npm update`) to respect the `package-lock.json`

## 🎉 That's it!

Once you run `npm install` in the `frontend/` directory, you'll have all the dependencies and can start the application with:

```bash
# Start backend (from root directory)
python main.py

# Start frontend (from frontend directory)
cd frontend
npm start
```

The `node_modules` directory will be created locally and should **never** be committed to Git!
