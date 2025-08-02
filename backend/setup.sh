#!/bin/bash

# CampusShare Backend Setup Script
# This script sets up the backend environment from scratch

set -e  # Exit on any error

echo "🚀 CampusShare Backend Setup Starting..."
echo "========================================"
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

# Check if MongoDB is installed
print_status "Checking MongoDB installation..."
if command -v mongod &> /dev/null; then
    print_success "MongoDB is installed"
    MONGO_VERSION=$(mongod --version | head -n 1)
    echo "         Version: $MONGO_VERSION"
else
    print_error "MongoDB is not installed!"
    echo ""
    echo "Please install MongoDB first:"
    echo "macOS: brew install mongodb-community"
    echo "Ubuntu: sudo apt-get install mongodb"
    echo "Windows: Download from https://www.mongodb.com/try/download/community"
    echo ""
    exit 1
fi

# Check if MongoDB is running
print_status "Checking if MongoDB is running..."
if pgrep mongod > /dev/null; then
    print_success "MongoDB is running"
else
    print_warning "MongoDB is not running. Starting MongoDB..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        brew services start mongodb-community > /dev/null 2>&1 || {
            print_warning "Failed to start MongoDB with brew. Trying manual start..."
            mongod --config /usr/local/etc/mongod.conf --fork > /dev/null 2>&1 || {
                print_error "Failed to start MongoDB. Please start it manually:"
                echo "macOS: brew services start mongodb-community"
                echo "Or: mongod --config /usr/local/etc/mongod.conf --fork"
                exit 1
            }
        }
    else
        # Linux
        sudo systemctl start mongod > /dev/null 2>&1 || {
            print_error "Failed to start MongoDB. Please start it manually:"
            echo "Linux: sudo systemctl start mongod"
            echo "Or: sudo service mongod start"
            exit 1
        }
    fi
    
    # Wait for MongoDB to start
    sleep 3
    
    if pgrep mongod > /dev/null; then
        print_success "MongoDB started successfully"
    else
        print_error "Failed to start MongoDB. Please check your MongoDB installation."
        exit 1
    fi
fi

# Check Python version
print_status "Checking Python installation..."
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    print_success "Python is installed: $PYTHON_VERSION"
    
    # Check if it's Python 3.8+
    if python3 -c "import sys; exit(0 if sys.version_info >= (3, 8) else 1)"; then
        print_success "Python version is compatible (3.8+)"
    else
        print_error "Python 3.8+ is required. Please upgrade your Python installation."
        exit 1
    fi
else
    print_error "Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

# Create and activate virtual environment
print_status "Setting up Python virtual environment..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
    print_success "Virtual environment created"
else
    print_warning "Virtual environment already exists"
fi

# Activate virtual environment
source venv/bin/activate
print_success "Virtual environment activated"

# Install Python dependencies
print_status "Installing Python dependencies..."
pip install --upgrade pip > /dev/null 2>&1
pip install -r requirements.txt
print_success "Python dependencies installed"

# Test database connection
print_status "Testing database connection..."
python3 -c "
from scripts.database import get_db
try:
    db = get_db()
    print('✅ Database connection successful')
except Exception as e:
    print(f'❌ Database connection failed: {e}')
    exit(1)
"

# Initialize database and create indexes
print_status "Initializing database and creating indexes..."
python3 -m scripts.database
print_success "Database initialized with indexes"

# Load location data
print_status "Loading location data from CSV..."
if [ -f "data/locations.csv" ]; then
    python3 -m scripts.load_locations
    print_success "Location data loaded successfully"
else
    print_error "Location data file not found: data/locations.csv"
    echo "Please ensure the locations.csv file is in the data/ directory"
    exit 1
fi

# Verify setup
print_status "Verifying setup..."
python3 -c "
from scripts.database import get_db
db = get_db()
collections = db.list_collection_names()
location_count = db.locations.count_documents({})
print(f'📊 Collections: {len(collections)}')
print(f'📍 Locations loaded: {location_count:,}')
if location_count > 0:
    print('✅ Setup verification successful')
else:
    print('❌ Setup verification failed - no locations found')
    exit(1)
"

echo ""
echo "🎉 Backend Setup Complete!"
echo "=========================="
echo ""
print_success "✅ MongoDB is running"
print_success "✅ Virtual environment created and activated"
print_success "✅ Dependencies installed"
print_success "✅ Database initialized"
print_success "✅ Location data loaded"
echo ""
echo "🚀 To start the backend server:"
echo "   cd backend"
echo "   source venv/bin/activate  # (if not already activated)"
echo "   python3 run.py"
echo ""
echo "🌐 Backend will be available at: http://localhost:5000"
echo "📖 API documentation: Check the routes/ folder for available endpoints"
echo ""
echo "⚠️  Note: Keep MongoDB running in the background for the app to work"
echo ""

# Optionally start the server
read -p "Would you like to start the backend server now? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Starting backend server..."
    echo "Press Ctrl+C to stop the server"
    echo ""
    python3 run.py
fi