import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Config:
    """Configuration for CampusShare backend"""
    # Flask settings
    SECRET_KEY = os.getenv('SECRET_KEY', 'your-secret-key-here')
    DEBUG = True
    FLASK_ENV = 'development'
    
    # Database settings
    MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/campus_share')
    
    # CORS settings
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', 'http://localhost:3000').split(',')
    
    # Email settings - Gmail SMTP (Free)
    EMAIL_ENABLED = os.getenv('EMAIL_ENABLED', 'false').lower() == 'true'
    
    # Gmail SMTP configuration
    SMTP_SERVER = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
    SMTP_PORT = int(os.getenv('SMTP_PORT', '587'))
    SMTP_USERNAME = os.getenv('SMTP_USERNAME')
    SMTP_APP_PASSWORD = os.getenv('SMTP_APP_PASSWORD')
    SMTP_USE_TLS = os.getenv('SMTP_USE_TLS', 'true').lower() == 'true'
    
    # Email sender info
    FROM_EMAIL = os.getenv('FROM_EMAIL', os.getenv('SMTP_USERNAME', 'kapilrathod1234@gmail.com'))
    FROM_NAME = os.getenv('FROM_NAME', 'CampusShare Notifications')
    
    # Application URL for email links
    FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:3000')

# Single configuration instance
config = Config() 