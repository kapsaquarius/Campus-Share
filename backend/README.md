# CampusShare Backend

The backend API for CampusShare, a student ride-sharing platform built with Flask and MongoDB.

## 🚀 Quick Setup

### Option 1: Automated Setup (Recommended)

Run the setup script to automatically configure everything:

```bash
cd backend
chmod +x setup.sh
./setup.sh
```

The script will:
- ✅ Check MongoDB installation and start it if needed
- ✅ Create Python virtual environment
- ✅ Install all dependencies
- ✅ Initialize database with proper indexes
- ✅ Load location data from CSV
- ✅ Verify the complete setup

### Option 2: Manual Setup

If you prefer to set up manually, follow the detailed instructions below.

## 📋 Prerequisites

### 1. MongoDB
- **Version**: 4.4 or higher
- **Installation**:
  - **macOS**: `brew install mongodb-community`
  - **Ubuntu**: `sudo apt-get install mongodb`
  - **Windows**: Download from [MongoDB Community Server](https://www.mongodb.com/try/download/community)

### 2. Python
- **Version**: 3.8 or higher
- Check version: `python3 --version`

## 🛠️ Manual Installation Steps

### Step 1: Clone and Navigate
```bash
git clone <repository-url>
cd campus-share/backend
```

### Step 2: Start MongoDB
```bash
# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Manual start (any OS)
mongod --config /path/to/mongod.conf --fork
```

### Step 3: Create Virtual Environment
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### Step 4: Install Dependencies
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### Step 5: Initialize Database
```bash
# Create database indexes
python3 -m scripts.database

# Load location data (39k+ US locations)
python3 -m scripts.load_locations
```

### Step 6: Start the Server
```bash
python3 run.py
```

## 🏗️ Project Structure

```
backend/
├── app.py                 # Flask application factory
├── run.py                 # Application entry point
├── config.py              # Configuration settings
├── requirements.txt       # Python dependencies
├── database.md           # Database schema documentation
│
├── routes/               # API endpoints
│   ├── auth.py          # Authentication routes
│   ├── locations.py     # Location search routes
│   ├── notifications.py # Notification routes
│   └── rides.py         # Ride sharing routes
│
├── services/            # Business logic layer
│   ├── location_service/
│   ├── notification_service/
│   ├── ride_service/
│   └── user_service/
│
├── scripts/             # Database and setup scripts
│   ├── database.py      # Database initialization
│   └── load_locations.py # Location data loader
│
├── utils/               # Utility functions
│   └── auth_helpers.py  # Authentication utilities
│
└── data/                # Data files
    └── locations.csv    # US location data (ZIP codes, cities, states)
```

## 🗄️ Database Schema

The application uses MongoDB with the following collections:

### Collections Overview
- **users** - User accounts and profiles
- **locations** - US ZIP codes, cities, and states (39k+ records)
- **ride_posts** - Ride offers from drivers
- **ride_interests** - Join requests from passengers
- **notifications** - System notifications

See [database.md](./database.md) for detailed schema documentation.

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Rides
- `GET /api/rides` - Search available rides
- `POST /api/rides` - Create new ride
- `GET /api/rides/my-rides` - Get user's rides
- `POST /api/rides/{id}/interest` - Express interest in ride
- `DELETE /api/rides/{id}/interest` - Remove interest
- `GET /api/rides/my-interested` - Get rides user is interested in

### Locations
- `GET /api/locations/search` - Search locations by query

### Notifications
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/{id}/read` - Mark notification as read

## ⚙️ Configuration

### Environment Variables
Create a `.env` file in the backend directory:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/campusshare

# JWT Configuration
JWT_SECRET_KEY=your-secret-key-here

# Flask Configuration
FLASK_ENV=development
FLASK_DEBUG=True

# CORS Configuration
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

### Database Configuration
- **Database Name**: `campusshare`
- **Connection**: `mongodb://localhost:27017/campusshare`
- **Collections**: 5 (users, locations, ride_posts, ride_interests, notifications)

## 🧪 Testing

### Test Database Connection
```bash
python3 -c "from scripts.database import get_db; print('✅ Connected:', get_db().name)"
```

### Test API Endpoints
```bash
# Test server health
curl http://localhost:5000/

# Test location search
curl "http://localhost:5000/api/locations/search?q=new+york"
```

### Database Status
```bash
python3 -c "
from scripts.database import get_db
db = get_db()
for collection in db.list_collection_names():
    count = db[collection].count_documents({})
    print(f'{collection}: {count:,} documents')
"
```

## 🚨 Troubleshooting

### Common Issues

#### MongoDB Connection Failed
```bash
# Check if MongoDB is running
pgrep mongod

# Start MongoDB
brew services start mongodb-community  # macOS
sudo systemctl start mongod            # Linux
```

#### Import Errors
```bash
# Ensure virtual environment is activated
source venv/bin/activate

# Reinstall dependencies
pip install -r requirements.txt
```

#### Location Data Missing
```bash
# Verify CSV file exists
ls -la data/locations.csv

# Reload location data
python3 -m scripts.load_locations
```

#### Port Already in Use
```bash
# Check what's using port 5000
lsof -i :5000

# Kill the process
kill -9 <PID>

# Or use a different port in run.py
```

## 🔧 Development

### Adding New Routes
1. Create route file in `routes/` directory
2. Import and register blueprint in `app.py`
3. Add corresponding service in `services/` if needed

### Database Operations
- Use `scripts/database.py` for database utilities
- Follow existing patterns in `services/` for data operations
- Update `database.md` when schema changes

### Code Style
- Follow PEP 8 conventions
- Use meaningful variable names
- Add docstrings for functions and classes
- Handle errors gracefully with try-catch blocks

## 📊 Performance

### Database Indexes
Optimized indexes are created for:
- User lookups by email/username
- Location searches by ZIP code and city
- Ride searches by routes and dates
- Notification queries by user and timestamp

### Caching
- Location data is indexed for fast autocomplete
- Database connections are pooled
- Static location data rarely changes

## 🛡️ Security

### Authentication
- JWT tokens for API authentication
- Password hashing with bcrypt
- Protected routes require valid tokens

### Data Validation
- Input sanitization on all endpoints
- MongoDB injection prevention
- CORS properly configured

### Privacy
- User contact info only shared when posting rides
- No personal data exposed in public endpoints
- Secure password reset mechanisms

## 📈 Monitoring

### Logs
- Flask request logs
- Database operation logs
- Error tracking and reporting

### Health Checks
- Database connectivity
- API endpoint availability
- Memory and CPU usage

## 🔄 Backup & Recovery

### Database Backup
```bash
# Backup entire database
mongodump --db campusshare --out backup/

# Restore database
mongorestore --db campusshare backup/campusshare/
```

### Location Data Recovery
```bash
# Reload location data if corrupted
python3 -m scripts.load_locations
```

## 📞 Support

### Documentation
- [Database Schema](./database.md) - Complete database documentation
- API endpoints - See routes/ directory for implementation details
- [Frontend Integration](../frontend/README.md) - Frontend setup guide

### Common Commands
```bash
# Activate virtual environment
source venv/bin/activate

# Start development server
python3 run.py

# Run database scripts
python3 -m scripts.database
python3 -m scripts.load_locations

# Check database status
python3 -c "from scripts.database import get_db; print(get_db().list_collection_names())"
```

---

## 🎯 Ready to Go!

After setup, your backend will be running at:
- **API Base URL**: `http://localhost:5000`
- **Health Check**: `http://localhost:5000/`
- **Database**: MongoDB on `localhost:27017`

The backend is now ready to serve the CampusShare frontend! 🚀

For frontend setup, see [../frontend/README.md](../frontend/README.md)