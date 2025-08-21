from flask import Blueprint, request
from services.location_service import location_service
from scripts.database import get_collection, format_object_id
from utils.common import ResponseFormatter, handle_exceptions

locations_bp = Blueprint("locations", __name__)


@locations_bp.route("/", methods=["GET"])
@handle_exceptions
def get_locations():
    """Get all locations"""
    locations_collection = get_collection("locations")
    locations = list(locations_collection.find().limit(100).sort("city", 1))

    formatted_locations = [format_object_id(location) for location in locations]

    return ResponseFormatter.success(
        {"locations": formatted_locations, "total": len(formatted_locations)}
    )


@locations_bp.route("/search", methods=["GET"])
@handle_exceptions
def search_locations():
    """Search locations - this is what users need for ride search"""
    query = request.args.get("q", "").strip()
    limit = int(request.args.get("limit", 10))

    # Ensure reasonable limit
    limit = min(max(1, limit), 100)  # Cap between 1 and 100

    locations = location_service.search_locations(query, limit)

    return ResponseFormatter.success(
        {"locations": locations, "total": len(locations), "query": query}
    )


@locations_bp.route("/<location_id>", methods=["GET"])
@handle_exceptions
def get_location(location_id):
    """Get a specific location by ID - needed for ride references"""
    if not location_id.strip():
        return ResponseFormatter.error("Location ID is required", 400)

    location = location_service.get_location_by_id(location_id)

    if not location:
        return ResponseFormatter.error("Location not found", 404)

    return ResponseFormatter.success(location)
