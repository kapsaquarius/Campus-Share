from flask import Blueprint, request, jsonify
from datetime import datetime
from bson import ObjectId
from scripts.database import get_collection, format_object_id
from routes.auth import get_current_user
from services.ride_service import search_rides_with_scoring, get_ride_with_details
from services.notification_service import (
    create_ride_interest_notification,
    create_ride_interest_removed_notification,
    create_ride_update_notification,
    create_ride_cancellation_notifications,
)
from utils.common import (
    ResponseFormatter,
    PaginationHelper,
    ValidationHelper,
    InterestManager,
    require_auth,
    handle_exceptions,
    BaseCRUDManager,
)

rides_bp = Blueprint("rides", __name__)


@rides_bp.route("/search", methods=["GET", "POST"])
def search_rides():
    """Smart ride search with intelligent filtering and ranking"""
    try:
        current_user = get_current_user()

        if request.method == "GET":
            travel_date_str = request.args.get("travelDate")
            travel_date = (
                datetime.strptime(travel_date_str, "%Y-%m-%d").date()
                if travel_date_str
                else None
            )
            starting_from = request.args.get("startingFrom", "")
            going_to = request.args.get("goingTo", "")
            preferred_time_start = request.args.get("preferredTimeStart", "")
            preferred_time_end = request.args.get("preferredTimeEnd", "")
        else:
            data = request.get_json()
            travel_date_str = data.get("travelDate")
            travel_date = (
                datetime.strptime(travel_date_str, "%Y-%m-%d").date()
                if travel_date_str
                else None
            )
            starting_from = data["startingFrom"]
            going_to = data["goingTo"]
            preferred_time_start = data.get("preferredTimeStart", "")
            preferred_time_end = data.get("preferredTimeEnd", "")

        search_criteria = {
            "travelDate": travel_date,
            "startingFrom": starting_from,
            "goingTo": going_to,
            "preferredStartTime": preferred_time_start,
            "preferredEndTime": preferred_time_end,
        }

        user_id = current_user["_id"] if current_user else None
        scored_rides = search_rides_with_scoring(search_criteria, user_id)

        if not scored_rides:
            return ResponseFormatter.success(
                ResponseFormatter.paginated_response([], 0, 1, 10, "rides"),
                "No rides found for your criteria",
            )

        page, per_page = PaginationHelper.get_pagination_params(request.args)
        paginated_rides = PaginationHelper.apply_pagination(
            scored_rides, page, per_page
        )

        formatted_rides = []
        for ride in paginated_rides:
            ride_with_details = get_ride_with_details(ride["_id"])
            if ride_with_details:
                formatted_ride = format_object_id(ride_with_details)
                formatted_rides.append(formatted_ride)

        return ResponseFormatter.success(
            ResponseFormatter.paginated_response(
                formatted_rides, len(scored_rides), page, per_page, "rides"
            )
        )

    except Exception as e:
        return ResponseFormatter.error(f"Search failed: {str(e)}", 400)


@rides_bp.route("/", methods=["GET", "POST"])
@require_auth
@handle_exceptions
def rides(user):
    """Get all rides or create a new ride posting"""
    if request.method == "GET":
        """Get all rides"""
        ride_posts = get_collection("ride_posts")
        rides = list(ride_posts.find({"status": "active"}).sort("createdAt", -1))

        formatted_rides = [format_object_id(ride) for ride in rides]

        return ResponseFormatter.success(
            {"rides": formatted_rides, "total": len(formatted_rides)}
        )

    elif request.method == "POST":
        """Create a new ride posting"""
        data = request.get_json()

        # Validate required fields
        required_fields = [
            "startingFrom",
            "goingTo",
            "travelDate",
            "departureStartTime",
            "departureEndTime",
            "availableSeats",
        ]
        validation_error = ValidationHelper.validate_required_fields(
            data, required_fields
        )
        if validation_error:
            return ResponseFormatter.error(validation_error, 400)

        ride_data = {
            "userId": ObjectId(user["_id"]),
            "startingFrom": data["startingFrom"],
            "goingTo": data["goingTo"],
            "travelDate": datetime.strptime(data["travelDate"], "%Y-%m-%d").strftime(
                "%Y-%m-%d"
            ),
            "departureStartTime": data["departureStartTime"],
            "departureEndTime": data["departureEndTime"],
            "availableSeats": data["availableSeats"],
            "seatsRemaining": data["availableSeats"],
            "suggestedContribution": data.get("suggestedContribution", 0),
            "additionalDetails": data.get("additionalDetails", ""),
            "status": "active",
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow(),
        }

        ride_posts = get_collection("ride_posts")
        result = ride_posts.insert_one(ride_data)

        created_ride = ride_posts.find_one({"_id": result.inserted_id})

        return ResponseFormatter.success(
            {
                "message": "Ride posted successfully",
                "ride": format_object_id(created_ride),
            },
            status_code=201,
        )


@rides_bp.route("/<ride_id>/interest", methods=["POST"])
@require_auth
@handle_exceptions
def express_interest(user, ride_id):
    """Express interest in a ride with notification"""
    ride_id_obj = ValidationHelper.validate_object_id(ride_id)
    if not ride_id_obj:
        return ResponseFormatter.error("Invalid ride ID", 400)

    # Initialize interest manager for rides
    interest_manager = InterestManager("ride_posts", "ride_interests", "rideId")

    return interest_manager.express_interest(
        ride_id_obj, user["_id"], create_ride_interest_notification
    )


@rides_bp.route("/<ride_id>/interest", methods=["DELETE"])
@require_auth
@handle_exceptions
def remove_interest(user, ride_id):
    """Remove interest in a ride"""
    ride_id_obj = ValidationHelper.validate_object_id(ride_id)
    if not ride_id_obj:
        return ResponseFormatter.error("Invalid ride ID", 400)

    # Initialize interest manager for rides
    interest_manager = InterestManager("ride_posts", "ride_interests", "rideId")

    return interest_manager.remove_interest(
        ride_id_obj, user["_id"], create_ride_interest_removed_notification
    )


@rides_bp.route("/<ride_id>/interested-users", methods=["GET"])
@require_auth
@handle_exceptions
def get_interested_users(user, ride_id):
    """Get list of users interested in a specific ride"""
    ride_id_obj = ValidationHelper.validate_object_id(ride_id)
    if not ride_id_obj:
        return ResponseFormatter.error("Invalid ride ID", 400)

    # Initialize interest manager for rides
    interest_manager = InterestManager("ride_posts", "ride_interests", "rideId")

    return interest_manager.get_interested_users(ride_id_obj, user["_id"])


@rides_bp.route("/my-interested", methods=["GET"])
def get_my_interested_rides():
    """Get rides that the current user has expressed interest in"""
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    try:
        ride_interests = get_collection("ride_interests")

        pipeline = [
            {
                "$match": {
                    "interestedUserId": ObjectId(user["_id"]),
                    "status": "interested",
                }
            },
            {
                "$lookup": {
                    "from": "ride_posts",
                    "localField": "rideId",
                    "foreignField": "_id",
                    "as": "ride",
                }
            },
            {"$unwind": "$ride"},
            {
                "$lookup": {
                    "from": "users",
                    "localField": "ride.userId",
                    "foreignField": "_id",
                    "as": "driver",
                }
            },
            {"$unwind": "$driver"},
            {
                "$project": {
                    "_id": {"$toString": "$_id"},
                    "interestedAt": "$createdAt",
                    "ride": {
                        "_id": {"$toString": "$ride._id"},
                        "startingFrom": "$ride.startingFrom",
                        "goingTo": "$ride.goingTo",
                        "travelDate": "$ride.travelDate",
                        "departureStartTime": "$ride.departureStartTime",
                        "departureEndTime": "$ride.departureEndTime",
                        "availableSeats": "$ride.availableSeats",
                        "seatsRemaining": "$ride.seatsRemaining",
                        "suggestedContribution": "$ride.suggestedContribution",
                        "status": "$ride.status",
                        "createdAt": "$ride.createdAt",
                        "additionalDetails": "$ride.additionalDetails",
                    },
                    "driver": {
                        "name": "$driver.name",
                        "username": "$driver.username",
                        "phoneNumber": "$driver.phone",
                        "whatsappNumber": "$driver.whatsapp",
                    },
                }
            },
            {"$sort": {"interestedAt": -1}},
        ]

        interested_rides = list(ride_interests.aggregate(pipeline))

        return jsonify(
            {"interestedRides": interested_rides, "totalCount": len(interested_rides)}
        ), 200

    except Exception as e:
        return jsonify({"error": f"Failed to get interested rides: {str(e)}"}), 400


@rides_bp.route("/my-rides", methods=["GET"])
@require_auth
@handle_exceptions
def get_my_rides(user):
    """Get current user's ride postings"""
    status_filter = request.args.get("status", "all")

    # Use BaseCRUDManager for common functionality
    ride_manager = BaseCRUDManager("ride_posts", "ride")

    return ride_manager.get_user_items(
        user["_id"],
        status_filter,
        include_interest_count=True,
        interest_collection="ride_interests",
        interest_id_field="rideId",
    )


@rides_bp.route("/<ride_id>", methods=["GET"])
@require_auth
@handle_exceptions
def get_ride(user, ride_id):
    """Get a specific ride by ID"""
    ride_id_obj = ValidationHelper.validate_object_id(ride_id)
    if not ride_id_obj:
        return ResponseFormatter.error("Invalid ride ID", 400)

    ride_manager = BaseCRUDManager("ride_posts", "ride")

    return ride_manager.get_item_by_id(ride_id_obj, user["_id"], get_ride_with_details)


@rides_bp.route("/<ride_id>", methods=["PUT"])
@require_auth
@handle_exceptions
def update_ride(user, ride_id):
    """Update ride posting with notification to interested users"""
    ride_id_obj = ValidationHelper.validate_object_id(ride_id)
    if not ride_id_obj:
        return ResponseFormatter.error("Invalid ride ID", 400)

    data = request.get_json()
    if not data:
        return ResponseFormatter.error("Request body is required", 400)

    # Build update data with only provided fields
    update_data = {}
    updatable_fields = [
        "startingFrom",
        "goingTo",
        "travelDate",
        "departureStartTime",
        "departureEndTime",
        "availableSeats",
        "suggestedContribution",
        "additionalDetails",
    ]

    for field in updatable_fields:
        if field in data:
            update_data[field] = data[field]

    if not update_data:
        return ResponseFormatter.error("No valid fields to update", 400)

    ride_manager = BaseCRUDManager("ride_posts", "ride")

    return ride_manager.update_item(
        ride_id_obj, user["_id"], update_data, create_ride_update_notification
    )


@rides_bp.route("/<ride_id>", methods=["DELETE"])
@require_auth
@handle_exceptions
def delete_ride(user, ride_id):
    """Delete ride posting with notification to interested users"""
    ride_id_obj = ValidationHelper.validate_object_id(ride_id)
    if not ride_id_obj:
        return ResponseFormatter.error("Invalid ride ID", 400)

    ride_manager = BaseCRUDManager("ride_posts", "ride")

    # Define related collections to clean up
    related_collections = [{"collection": "ride_interests", "field": "rideId"}]

    return ride_manager.delete_item(
        ride_id_obj,
        user["_id"],
        related_collections,
        create_ride_cancellation_notifications,
    )
