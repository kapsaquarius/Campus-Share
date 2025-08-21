# CampusShare Backend

The backend API for CampusShare, a student ride-sharing and roommate-matching platform built with Flask and MongoDB.

## 📚 Documentation

Complete documentation is organized in the `docs/` directory:

- **📄 [API Reference](docs/api/api-reference.md)** - Complete REST API reference with examples
  - All endpoints, request/response formats, authentication
  - Integration examples in JavaScript, Python, cURL
  - Error handling and status codes

- **📄 [Database Schema](docs/db/database.md)** - Complete database schema and architecture
  - All 7 MongoDB collections with detailed field specifications
  - Relationships, indexes, and sample documents

## 🚀 Setup Steps (Manual)

### Prerequisites
- Python 3.8+
- MongoDB Atlas account (free tier available)
- Gmail account with app password (for email notifications)

### 1. Clone and Navigate
```bash
git clone https://github.com/kapsaquarius/Campus-Share.git
cd Campus-Share/backend
```

### 2. Create Virtual Environment
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 3. Install Dependencies
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 4. Set Up MongoDB Atlas
Before configuring the app, you need to set up a MongoDB Atlas cluster:

1. **Create Account**: Go to [MongoDB Atlas](https://cloud.mongodb.com/) and create a free account
2. **Create Cluster**: Create a new cluster (free tier M0 is sufficient)
3. **Configure Access**:
   - Add your IP address to the IP whitelist (or use 0.0.0.0/0 for development)
   - Create a database user with read/write permissions
4. **Get Connection String**: Click "Connect" → "Connect your application" → Copy the connection string

### 5. Configure Environment Variables
Copy the example environment file and customize it:
```bash
cp .env.example .env
```
Then edit the `.env` file with your MongoDB Atlas connection string and other configuration.

### 6. Initialize Database
```bash
python3 -m scripts.setup_cloud_database
```

### 7. Start the Server
```bash
python3 app.py
```

The API will be available at `http://localhost:5000`

## 🏗️ Project Structure

```
backend/
├── app.py                 # Flask application entry point
├── requirements.txt       # Python dependencies
├── docs/                  # Complete documentation
│   ├── api/              # API endpoint documentation
│   │   └── api-reference.md # Complete endpoint reference
│   └── db/               # Database documentation
│       └── database.md   # Complete schema documentation
├── .env                   # Environment variables (create from template)
│
├── routes/               # API endpoints
│   ├── auth.py          # Authentication routes
│   ├── locations.py     # Location search routes
│   ├── notifications.py # Notification routes
│   ├── rides.py         # Ride sharing routes
│   └── roommates.py     # Roommate matching routes
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
│   └── setup_cloud_database.py # Database setup and indexing
│
├── utils/               # Utility functions
│   ├── auth_helpers.py  # JWT authentication utilities
│   ├── common.py        # Common utilities and decorators
│   ├── matching_utils.py # Matching algorithms
│   └── service_base.py  # Base service classes
│
└── data/                # Data files
    └── locations.csv    # US location data (ZIP codes, cities, states)
```

## ⚙️ Configuration

Copy `.env.example` to `.env` and update with your values:

```env
# Database (MongoDB Atlas)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/campus-share?retryWrites=true&w=majority

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

### MongoDB Atlas Setup
1. Create a free account at [MongoDB Atlas](https://cloud.mongodb.com/)
2. Create a new cluster
3. Add your IP address to the whitelist
4. Create a database user
5. Get the connection string and add it to your `.env` file

### Gmail App Password Setup
1. Enable 2-Factor Authentication on your Gmail account
2. Go to Google Account settings → Security → App passwords
3. Generate a new app password for "Mail"
4. Use the 16-digit password in your `.env` file

---

Your CampusShare backend is now ready to serve API requests at `http://localhost:5000`