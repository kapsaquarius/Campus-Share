from flask import Flask, jsonify
from flask_cors import CORS
from datetime import datetime, date
import os
from dotenv import load_dotenv
from bson import ObjectId
import json
from decimal import Decimal
from routes.auth import auth_bp
from routes.rides import rides_bp
from routes.notifications import notifications_bp
from routes.roommates import roommates_bp

from routes.locations import locations_bp

load_dotenv()

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
app.config["MONGODB_URI"] = os.getenv("MONGODB_URI")

# Parse CORS origins - with fallback for development
cors_origins_env = os.getenv("CORS_ORIGINS")
if cors_origins_env:
    cors_origins = cors_origins_env.split(",")
else:
    # Fallback for development
    cors_origins = ["http://localhost:3000", "http://127.0.0.1:3000"]

CORS(
    app,
    origins=cors_origins,
    supports_credentials=True,
    methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)


app.register_blueprint(auth_bp, url_prefix="/api/auth")
app.register_blueprint(rides_bp, url_prefix="/api/rides")
app.register_blueprint(notifications_bp, url_prefix="/api/notifications")
app.register_blueprint(locations_bp, url_prefix="/api/locations")
app.register_blueprint(roommates_bp, url_prefix="/api/roommates")


# Custom JSON encoder for ObjectId and Decimal
class CustomJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, ObjectId):
            return str(obj)
        if isinstance(obj, Decimal):
            return float(obj)
        if isinstance(obj, datetime):
            return obj.isoformat() + "Z"
        if isinstance(obj, date):
            return obj.isoformat()
        return super().default(obj)


app.json_encoder = CustomJSONEncoder


@app.route("/api/health", methods=["GET"])
def health_check():
    """Health check endpoint"""
    return jsonify(
        {
            "status": "healthy",
            "message": "CampusShare API is running",
            "timestamp": datetime.utcnow().isoformat() + "Z",
        }
    )



@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Not found"}), 404


@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "Internal server error"}), 500


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
