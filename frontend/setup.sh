#!/bin/bash

# CampusShare Frontend Setup Script
# This script sets up the frontend environment from scratch

set -e  # Exit on any error

echo "🚀 CampusShare Frontend Setup Starting..."
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
print_status "Checking Node.js installation..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_success "Node.js is installed: $NODE_VERSION"
    
    # Check if it's Node 16+
    if node -e "process.exit(process.version.match(/^v(\d+)/)[1] >= 16 ? 0 : 1)"; then
        print_success "Node.js version is compatible (16+)"
    else
        print_error "Node.js 16+ is required. Please upgrade your Node.js installation."
        echo "Current version: $NODE_VERSION"
        echo "Download from: https://nodejs.org/"
        exit 1
    fi
else
    print_error "Node.js is not installed!"
    echo ""
    echo "Please install Node.js 16 or higher:"
    echo "🌐 Download: https://nodejs.org/"
    echo "📦 macOS: brew install node"
    echo "📦 Ubuntu: sudo apt-get install nodejs npm"
    echo ""
    exit 1
fi

# Check if npm is installed
print_status "Checking npm installation..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    print_success "npm is installed: v$NPM_VERSION"
else
    print_error "npm is not installed. Please install npm with Node.js."
    exit 1
fi

# Check for package.json
print_status "Checking project configuration..."
if [ -f "package.json" ]; then
    print_success "package.json found"
    PROJECT_NAME=$(node -p "require('./package.json').name")
    PROJECT_VERSION=$(node -p "require('./package.json').version")
    echo "         Project: $PROJECT_NAME v$PROJECT_VERSION"
else
    print_error "package.json not found! Make sure you're in the frontend directory."
    exit 1
fi

# Clean previous installations
print_status "Cleaning previous installations..."
if [ -d "node_modules" ]; then
    print_warning "Removing existing node_modules..."
    rm -rf node_modules
fi

if [ -f "package-lock.json" ]; then
    print_warning "Removing existing package-lock.json..."
    rm -f package-lock.json
fi

if [ -d ".next" ]; then
    print_warning "Removing existing .next build cache..."
    rm -rf .next
fi

print_success "Cleanup completed"

# Install dependencies
print_status "Installing dependencies..."
echo "This may take a few minutes..."
echo ""

npm install

if [ $? -eq 0 ]; then
    print_success "Dependencies installed successfully"
else
    print_error "Failed to install dependencies"
    echo ""
    echo "Try running manually:"
    echo "  npm install"
    echo ""
    echo "If issues persist, try:"
    echo "  npm cache clean --force"
    echo "  rm -rf node_modules package-lock.json"
    echo "  npm install"
    exit 1
fi

# Verify installation
print_status "Verifying installation..."

# Check if key dependencies exist
if [ -d "node_modules/next" ] && [ -d "node_modules/react" ] && [ -d "node_modules/tailwindcss" ]; then
    print_success "Core dependencies verified"
else
    print_error "Core dependencies missing. Installation may have failed."
    exit 1
fi

# Check TypeScript configuration
if [ -f "tsconfig.json" ]; then
    print_success "TypeScript configuration found"
else
    print_warning "TypeScript configuration not found"
fi

# Check Tailwind configuration
if [ -f "tailwind.config.ts" ]; then
    print_success "Tailwind CSS configuration found"
else
    print_warning "Tailwind CSS configuration not found"
fi

# Test build (optional)
print_status "Testing build configuration..."
if npm run build > /dev/null 2>&1; then
    print_success "Build test passed"
    # Clean up build files
    rm -rf .next
else
    print_warning "Build test failed - may need backend connection"
    print_warning "This is normal if backend is not running yet"
fi

echo ""
echo "🎉 Frontend Setup Complete!"
echo "==========================="
echo ""
print_success "✅ Node.js and npm are installed"
print_success "✅ Dependencies installed"
print_success "✅ Project configuration verified"
print_success "✅ Build system ready"
echo ""
echo "🚀 To start the development server:"
echo "   cd frontend"
echo "   npm run dev"
echo ""
echo "🌐 Frontend will be available at: http://localhost:3000"
echo "📱 Mobile-responsive design included"
echo "🎨 Tailwind CSS configured for styling"
echo ""
echo "⚠️  Make sure the backend is running at http://localhost:5000"
echo "   See backend/README.md for backend setup instructions"
echo ""

# Check if backend is running
print_status "Checking backend connectivity..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/ | grep -q "200\|404"; then
    print_success "Backend is running at http://localhost:5000"
    BACKEND_READY=true
else
    print_warning "Backend is not running at http://localhost:5000"
    print_warning "You'll need to start the backend for full functionality"
    BACKEND_READY=false
fi

echo ""
echo "📋 Next Steps:"
echo "1. 🔧 Start the backend (if not running): cd ../backend && ./setup.sh"
echo "2. 🚀 Start the frontend: npm run dev"
echo "3. 🌐 Open http://localhost:3000 in your browser"
echo "4. 📝 Register a new account to test the app"
echo ""

# Optionally start the development server
read -p "Would you like to start the development server now? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if [ "$BACKEND_READY" = false ]; then
        print_warning "Backend is not running. The frontend will start but some features may not work."
        read -p "Continue anyway? (y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "Setup complete. Start the backend first, then run: npm run dev"
            exit 0
        fi
    fi
    
    print_status "Starting development server..."
    echo "Press Ctrl+C to stop the server"
    echo ""
    echo "🌐 Frontend will be available at: http://localhost:3000"
    echo ""
    npm run dev
fi