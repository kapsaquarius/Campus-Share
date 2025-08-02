from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime, timedelta, date
import os
from dotenv import load_dotenv
from bson import ObjectId
import json
from decimal import Decimal

# Import our modules
from scripts.database import init_db, get_db
from routes.auth import auth_bp, verify_token
from routes.rides import rides_bp
from routes.roommates import roommates_bp

from routes.notifications import notifications_bp
from routes.reviews import reviews_bp
from routes.locations import locations_bp
from config import config

# Load environment variables
load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = config.SECRET_KEY
app.config['MONGODB_URI'] = config.MONGODB_URI
app.config['DEBUG'] = config.DEBUG

# Enable CORS with all necessary methods
CORS(app, 
     origins=config.CORS_ORIGINS, 
     supports_credentials=True,
     methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
     allow_headers=['Content-Type', 'Authorization'])

# Initialize database
init_db()

# Register blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(rides_bp, url_prefix='/api/rides')
app.register_blueprint(roommates_bp, url_prefix='/api/roommates')

app.register_blueprint(notifications_bp, url_prefix='/api/notifications')
app.register_blueprint(reviews_bp, url_prefix='/api/reviews')
app.register_blueprint(locations_bp, url_prefix='/api/locations')

# Custom JSON encoder for ObjectId and Decimal
class CustomJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, ObjectId):
            return str(obj)
        if isinstance(obj, Decimal):
            return float(obj)
        if isinstance(obj, datetime):
            return obj.isoformat() + 'Z'  # Add Z suffix for UTC timestamps
        if isinstance(obj, date):
            return obj.isoformat()
        return super().default(obj)

app.json_encoder = CustomJSONEncoder

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'message': 'CampusShare API is running',
        'timestamp': datetime.utcnow().isoformat() + 'Z'
    })

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    app.run(debug=config.DEBUG, host='0.0.0.0', port=5000) 