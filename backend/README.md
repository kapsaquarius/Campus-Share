# CampusShare Backend

The backend API for CampusShare, a student ride-sharing and roommate-matching platform built with Flask and MongoDB Atlas with integrated email notifications.

## 🚀 Quick Setup

### Option 1: Automated Setup (Recommended)

Run the setup script to automatically configure everything:

```bash
cd backend
chmod +x setup.sh
./setup.sh
```

The script will:
- ✅ Create Python virtual environment
- ✅ Install all dependencies
- ✅ Set up environment variables
- ✅ Initialize cloud database with proper indexes (rides, roommates, notifications)
- ✅ Load location data from CSV
- ✅ Configure email service
- ✅ Verify the complete setup

### Option 2: Manual Setup

If you prefer to set up manually, follow the detailed instructions below.

## 📋 Prerequisites

### 1. MongoDB Atlas (Cloud)
- **Account**: Free MongoDB Atlas account
- **Setup**: Create cluster at [MongoDB Atlas](https://cloud.mongodb.com/)
- **Connection**: Get connection string from Atlas dashboard
- **Note**: No local MongoDB installation required

### 2. Gmail Account (For Email Service)
- **Account**: Personal Gmail account
- **App Password**: Generate app-specific password in Google Account settings
- **2FA Required**: Gmail 2-factor authentication must be enabled

### 3. Python
- **Version**: 3.8 or higher
- Check version: `python3 --version`

## 🛠️ Manual Installation Steps

### Step 1: Clone and Navigate
```bash
git clone <repository-url>
cd campus-share/backend
```

### Step 2: Create Virtual Environment
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### Step 3: Install Dependencies
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### Step 4: Configure Environment Variables
Create a `.env` file in the backend directory:
```bash
cp .env.example .env  # If example exists, or create manually
```
See [Environment Variables](#environment-variables) section for required variables.

### Step 5: Initialize Cloud Database
```bash
# Setup cloud database with indexes and location data
python3 -m scripts.setup_cloud_database
```

### Step 6: Start the Server
```bash
python3 app.py
```

## 🏗️ Project Structure

```
backend/
├── app.py                 # Flask application factory
├── requirements.txt       # Python dependencies
├── database.md           # Database schema documentation
├── .env                   # Environment variables (create from template)
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
│   ├── roommate_service/
│   ├── user_service/
│   └── email_service/    # Email notification service
│
├── scripts/             # Database and setup scripts
│   ├── database.py      # Database connection utilities
│   ├── load_locations.py # Location data loader (legacy)
│   └── setup_cloud_database.py # Cloud database setup
│
├── utils/               # Utility functions
│   └── auth_helpers.py  # Authentication utilities
│
└── data/                # Data files
    └── locations.csv    # US location data (ZIP codes, cities, states)
```

## 🗄️ Database Schema

The application uses MongoDB Atlas (cloud) with the following collections:

### Collections Overview
- **users** - User accounts and profiles
- **locations** - US ZIP codes, cities, and states (39k+ records)
- **ride_posts** - Ride offers from drivers
- **ride_interests** - Join requests from passengers
- **roommate_posts** - Room/roommate listings
- **roommate_interests** - Interest records for roommate listings
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

### Roommates
- `GET /api/roommates/search` - Search roommate listings
- `POST /api/roommates` - Create new roommate listing
- `GET /api/roommates/my-listings` - Get user's roommate listings
- `GET /api/roommates/my-interested` - Get roommate listings user is interested in
- `POST /api/roommates/{id}/interest` - Express interest in a listing
- `DELETE /api/roommates/{id}/interest` - Remove interest from a listing
- `PUT /api/roommates/{id}` - Update listing (owner only)
- `DELETE /api/roommates/{id}` - Delete listing (owner only)

### Locations
- `GET /api/locations/search` - Search locations by query

### Notifications
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/{id}/read` - Mark notification as read

## ⚙️ Configuration

### Environment Variables
Create a `.env` file in the backend directory:

```env
# CampusShare Backend Environment Configuration

# Database (MongoDB Atlas)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority&appName=campus-share

# Security
SECRET_KEY=your-super-secret-key-here

# CORS (Frontend URL)
CORS_ORIGINS=http://localhost:3000

# Gmail SMTP Configuration
EMAIL_ENABLED=true
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_APP_PASSWORD=your-16-digit-app-password
SMTP_USE_TLS=true

# Email sender information
FROM_EMAIL=your-email@gmail.com
FROM_NAME=CampusShare Notifications
FRONTEND_URL=http://localhost:3000
```

### Database Configuration
- **Platform**: MongoDB Atlas (Cloud)
- **Database Name**: `campus-share`
- **Collections**: 7 (users, locations, ride_posts, ride_interests, roommate_posts, roommate_interests, notifications)
- **Indexes**: Optimized for search performance

### Email Configuration
- **Service**: Gmail SMTP (Free)
- **Features**: Ride updates, interest notifications, cancellations
- **Templates**: HTML email templates with Jinja2

## 🧪 Testing

### Test Database Connection
```bash
python3 -c "from scripts.database import get_db; print('✅ Connected to:', get_db().name)"
```

### Test API Endpoints
```bash
# Test server health
curl http://localhost:5000/

# Test location search
curl "http://localhost:5000/api/locations/search?q=new+york"
```

### Test Email Service
```bash
# Check email configuration
python3 -c "
import os
from dotenv import load_dotenv
load_dotenv()
print('Email enabled:', os.getenv('EMAIL_ENABLED'))
print('SMTP server:', os.getenv('SMTP_SERVER'))
print('From email:', os.getenv('FROM_EMAIL'))
"
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

#### MongoDB Atlas Connection Failed
```bash
# Check MongoDB URI in .env file
grep MONGODB_URI .env

# Test connection
python3 -c "from scripts.database import get_db; print(get_db().name)"

# Common issues:
# - Wrong connection string
# - Network restrictions in Atlas
# - Incorrect username/password
```

#### Email Service Issues
```bash
# Check Gmail configuration
python3 -c "
import os
from dotenv import load_dotenv
load_dotenv()
print('SMTP Username:', os.getenv('SMTP_USERNAME'))
print('FROM_EMAIL:', os.getenv('FROM_EMAIL'))
"

# Common issues:
# - Gmail 2FA not enabled
# - Wrong app password (16 digits)
# - Non-personal Gmail account
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

# Reload cloud database
python3 -m scripts.setup_cloud_database
```

#### Port Already in Use
```bash
# Check what's using port 5000
lsof -i :5000

# Kill the process
kill -9 <PID>

# Or change port in app.py
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
python3 app.py

# Setup cloud database
python3 -m scripts.setup_cloud_database

# Check database status
python3 -c "from scripts.database import get_db; print(get_db().list_collection_names())"

# Test email configuration
python3 -c "from services.email_service.email_service import EmailService; print('Email service ready')"
```

## ✨ New Features

### 📧 Email Notifications
- **Ride Interest**: Notify drivers when passengers express interest
- **Ride Updates**: Inform passengers about ride changes
- **Ride Cancellation**: Alert all parties when rides are cancelled
- **Interest Removal**: Notify drivers when passengers withdraw interest

### 🌐 Cloud Database
- **MongoDB Atlas**: Free cloud database hosting
- **Global Access**: Accessible from anywhere with internet
- **Automatic Backups**: Built-in data protection
- **Scalable**: Grows with your application

### 🔧 Configuration Improvements
- **Environment Variables**: Direct .env integration (no config.py layer)
- **Cloud-First**: Designed for cloud deployment
- **Email Templates**: Professional HTML email templates
- **Error Handling**: Comprehensive error logging and recovery

---

## 🎯 Ready to Go!

After setup, your backend will be running at:
- **API Base URL**: `http://localhost:5000`
- **Health Check**: `http://localhost:5000/`
- **Database**: MongoDB Atlas (Cloud)
- **Email Service**: Gmail SMTP

The backend is now ready to serve the CampusShare frontend! 🚀

For frontend setup, see [../frontend/README.md](../frontend/README.md)