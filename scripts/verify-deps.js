#!/usr/bin/env node

/**
 * Node.js Dependency Verification Script
 * Verifies that all dependencies are properly installed
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Node.js dependencies...\n');

// Check if we're in the frontend directory
const currentDir = process.cwd();
const isInFrontend = currentDir.includes('frontend') || fs.existsSync('./src/App.tsx');

if (!isInFrontend) {
    console.log('❌ This script should be run from the frontend directory');
    console.log('💡 Try: cd frontend && node ../scripts/verify-deps.js');
    process.exit(1);
}

// Check if package.json exists
if (!fs.existsSync('./package.json')) {
    console.log('❌ package.json not found');
    process.exit(1);
}

// Check if node_modules exists
if (!fs.existsSync('./node_modules')) {
    console.log('❌ node_modules directory not found');
    console.log('💡 Run: npm install');
    process.exit(1);
}

// Load package.json
const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

console.log(`📦 Project: ${packageJson.name} v${packageJson.version}`);

// Check dependencies
const dependencies = packageJson.dependencies || {};
const devDependencies = packageJson.devDependencies || {};
const allDeps = { ...dependencies, ...devDependencies };

let allInstalled = true;
let checkedCount = 0;

Object.keys(allDeps).forEach(dep => {
    const depPath = path.join('./node_modules', dep);
    if (fs.existsSync(depPath)) {
        checkedCount++;
    } else {
        console.log(`❌ Missing: ${dep}`);
        allInstalled = false;
    }
});

if (allInstalled) {
    console.log(`✅ All ${checkedCount} dependencies are installed correctly`);
    console.log('\n🎯 Available commands:');
    
    const scripts = packageJson.scripts || {};
    Object.keys(scripts).forEach(script => {
        console.log(`   npm run ${script}`);
    });
    
    console.log('\n✨ Ready to start development!');
    console.log('   • npm start  - Start development server');
    console.log('   • npm test   - Run tests');
    console.log('   • npm run build - Build for production');
} else {
    console.log('\n❌ Some dependencies are missing. Please run:');
    console.log('   npm install');
    process.exit(1);
}

// Check if package-lock.json exists
if (fs.existsSync('./package-lock.json')) {
    console.log('\n🔒 package-lock.json found - dependency versions are locked');
} else {
    console.log('\n⚠️  package-lock.json not found - consider running npm install to generate it');
}

console.log('\n🚀 Dependency verification complete!');
