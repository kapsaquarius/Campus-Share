from flask import Blueprint, request
from datetime import datetime, date, timedelta
from bson import ObjectId
from scripts.database import get_collection, format_object_id
from routes.auth import get_current_user
from services.roommate_service import (
    search_roommates_with_scoring,
    get_roommate_with_details,
)
from services.notification_service import (
    create_roommate_interest_notification,
    create_roommate_interest_removed_notification,
    create_roommate_update_notification,
    create_roommate_cancellation_notification,
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

roommates_bp = Blueprint("roommates", __name__)


def _serialize_mongo(obj):
    """Recursively convert Mongo types to JSON-serializable types."""
    if isinstance(obj, ObjectId):
        return str(obj)
    if isinstance(obj, datetime):
        return obj.isoformat() + "Z"
    if isinstance(obj, date):
        return obj.isoformat()
    if isinstance(obj, dict):
        return {k: _serialize_mongo(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_serialize_mongo(v) for v in obj]
    return obj


@roommates_bp.route("/search", methods=["GET"])
def search_roommates():
    try:
        current_user = get_current_user()
        user_id = current_user["_id"] if current_user else None

        params = request.args
        req_type = params.get("type")
        invert_type = None
        if req_type in ("offer", "seek"):
            invert_type = "seek" if req_type == "offer" else "offer"
        move_in = params.get("moveIn")
        move_in_start = None
        move_in_end = None
        if move_in:
            try:
                base = datetime.strptime(move_in, "%Y-%m-%d").date()
                start = base - timedelta(days=21)
                end = base + timedelta(days=21)
                move_in_start = start.strftime("%Y-%m-%d")
                move_in_end = end.strftime("%Y-%m-%d")
            except Exception:
                move_in_start = None
                move_in_end = None

        criteria = {
            "type": invert_type if invert_type else None,
            "location": params.get("location"),
            "moveIn": params.get("moveIn"),
            "moveInStart": move_in_start,
            "moveInEnd": move_in_end,
            "budgetMin": int(params.get("budgetMin"))
            if params.get("budgetMin")
            else None,
            "budgetMax": int(params.get("budgetMax"))
            if params.get("budgetMax")
            else None,
            "roomType": params.get("roomType"),
            "furnished": params.get("furnished"),
            "pets": params.get("pets"),
            "smoking": params.get("smoking"),
            "dietary": params.get("dietary"),
            "sleep": params.get("sleep"),
            "guestsPerWeek": params.get("guestsPerWeek"),
        }

        results = search_roommates_with_scoring(criteria, user_id)

        page, per_page = PaginationHelper.get_pagination_params(params)
        paged = PaginationHelper.apply_pagination(results, page, per_page)

        formatted = []
        for doc in paged:
            try:
                detailed = get_roommate_with_details(doc["_id"])
                formatted.append(_serialize_mongo(detailed))
            except Exception:
                formatted.append(format_object_id(doc))

        return ResponseFormatter.success(
            ResponseFormatter.paginated_response(
                formatted, len(results), page, per_page, "listings"
            )
        )
    except Exception as e:
        return ResponseFormatter.error(f"Search failed: {str(e)}", 400)


@roommates_bp.route("/", methods=["POST"])
@require_auth
@handle_exceptions
def create_roommate_post(user):
    data = request.get_json() or {}

    # Validate required fields (at least location should be provided)
    required_fields = ["location"]
    validation_error = ValidationHelper.validate_required_fields(data, required_fields)
    if validation_error:
        return ResponseFormatter.error(validation_error, 400)

    post = {
        "userId": ObjectId(user["_id"]),
        "type": data.get("type", "offer"),
        "location": data.get("location", ""),
        "exactAddress": data.get("exactAddress"),
        "moveInEarliest": data.get("moveInEarliest"),
        "budgetMin": data.get("budgetMin", 0),
        "budgetMax": data.get("budgetMax", 0),
        "roomType": data.get("roomType"),
        "furnished": bool(data.get("furnished", False)),
        "petFriendly": bool(data.get("petFriendly", False)),
        "smokerOk": bool(data.get("smokerOk", False)),
        "dietaryPreference": data.get("dietaryPreference"),
        "sleepSchedule": data.get("sleepSchedule"),
        "guestsPerWeek": data.get("guestsPerWeek"),
        "additionalDetails": data.get("additionalDetails", ""),
        "status": "active",
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow(),
    }

    posts = get_collection("roommate_posts")
    res = posts.insert_one(post)
    created = posts.find_one({"_id": res.inserted_id})

    return ResponseFormatter.success(
        {"message": "Listing created", "listing": format_object_id(created)},
        status_code=201,
    )


@roommates_bp.route("/my-listings", methods=["GET"])
@require_auth
@handle_exceptions
def my_roommate_listings(user):
    status_filter = request.args.get("status", "all")

    roommate_manager = BaseCRUDManager("roommate_posts", "listing")

    return roommate_manager.get_user_items(
        user["_id"],
        status_filter,
        include_interest_count=True,
        interest_collection="roommate_interests",
        interest_id_field="postId",
    )


@roommates_bp.route("/my-matches", methods=["GET"])
@require_auth
@handle_exceptions
def my_roommate_matches(user):
    posts = get_collection("roommate_posts")
    last = posts.find_one({"userId": ObjectId(user["_id"])}, sort=[("createdAt", -1)])
    criteria = {}
    if last:
        criteria = {
            "type": "offer" if last.get("type") == "seek" else "seek",
            "location": last.get("location"),
            "budgetMin": last.get("budgetMin"),
            "budgetMax": last.get("budgetMax"),
            "moveIn": last.get("moveInEarliest"),
            "roomType": last.get("roomType"),
            "furnished": "yes" if last.get("furnished") else "no",
            "pets": "ok" if last.get("petFriendly") else "no",
            "smoking": "ok" if last.get("smokerOk") else "no",
            "dietary": last.get("dietaryPreference"),
            "sleep": last.get("sleepSchedule"),
            "guestsPerWeek": last.get("guestsPerWeek"),
        }
    matches = search_roommates_with_scoring(criteria, user["_id"])[:50]

    return ResponseFormatter.success(
        {"matches": [format_object_id(m) for m in matches]}
    )


@roommates_bp.route("/my-interested", methods=["GET"])
@require_auth
@handle_exceptions
def get_my_interested_roommates(user):
    """Get roommate listings that the current user has expressed interest in"""
    interests = get_collection("roommate_interests")

    pipeline = [
        {"$match": {"interestedUserId": ObjectId(user["_id"]), "status": "interested"}},
        {
            "$lookup": {
                "from": "roommate_posts",
                "localField": "postId",
                "foreignField": "_id",
                "as": "post",
            }
        },
        {"$unwind": "$post"},
        {
            "$lookup": {
                "from": "users",
                "localField": "post.userId",
                "foreignField": "_id",
                "as": "poster",
            }
        },
        {"$unwind": "$poster"},
        {
            "$project": {
                "_id": {"$toString": "$_id"},
                "interestedAt": "$createdAt",
                "listing": {
                    "_id": {"$toString": "$post._id"},
                    "type": "$post.type",
                    "location": "$post.location",
                    "exactAddress": "$post.exactAddress",
                    "moveInEarliest": "$post.moveInEarliest",
                    "budgetMin": "$post.budgetMin",
                    "budgetMax": "$post.budgetMax",
                    "roomType": "$post.roomType",
                    "furnished": "$post.furnished",
                    "petFriendly": "$post.petFriendly",
                    "smokerOk": "$post.smokerOk",
                    "dietaryPreference": "$post.dietaryPreference",
                    "sleepSchedule": "$post.sleepSchedule",
                    "guestsPerWeek": "$post.guestsPerWeek",
                    "status": "$post.status",
                    "createdAt": "$post.createdAt",
                    "additionalDetails": "$post.additionalDetails",
                },
                "poster": {
                    "name": "$poster.name",
                    "username": "$poster.username",
                    "phoneNumber": "$poster.phone",
                    "whatsappNumber": "$poster.whatsapp",
                },
            }
        },
        {"$sort": {"interestedAt": -1}},
    ]

    docs = list(interests.aggregate(pipeline))

    return ResponseFormatter.success(
        {"interestedListings": docs, "totalCount": len(docs)}
    )


@roommates_bp.route("/<post_id>", methods=["GET"])
@require_auth
@handle_exceptions
def get_roommate_post(user, post_id):
    post_id_obj = ValidationHelper.validate_object_id(post_id)
    if not post_id_obj:
        return ResponseFormatter.error("Invalid post ID", 400)

    roommate_manager = BaseCRUDManager("roommate_posts", "listing")

    return roommate_manager.get_item_by_id(
        post_id_obj, user["_id"], get_roommate_with_details
    )


@roommates_bp.route("/<post_id>", methods=["PUT"])
@require_auth
@handle_exceptions
def update_roommate_post(user, post_id):
    post_id_obj = ValidationHelper.validate_object_id(post_id)
    if not post_id_obj:
        return ResponseFormatter.error("Invalid post ID", 400)

    data = request.get_json() or {}
    if not data:
        return ResponseFormatter.error("Request body is required", 400)

    # Build update data with only provided fields
    updates = {}
    updatable_fields = [
        "type",
        "location",
        "exactAddress",
        "moveInEarliest",
        "budgetMin",
        "budgetMax",
        "roomType",
        "additionalDetails",
        "dietaryPreference",
        "sleepSchedule",
        "guestsPerWeek",
    ]

    for field in updatable_fields:
        if field in data:
            updates[field] = data[field]

    # Handle boolean fields separately
    boolean_fields = ["furnished", "petFriendly", "smokerOk"]
    for field in boolean_fields:
        if field in data:
            updates[field] = bool(data[field])

    if not updates:
        return ResponseFormatter.error("No valid fields to update", 400)

    roommate_manager = BaseCRUDManager("roommate_posts", "listing")

    return roommate_manager.update_item(
        post_id_obj, user["_id"], updates, create_roommate_update_notification
    )


@roommates_bp.route("/<post_id>", methods=["DELETE"])
@require_auth
@handle_exceptions
def delete_roommate_post(user, post_id):
    post_id_obj = ValidationHelper.validate_object_id(post_id)
    if not post_id_obj:
        return ResponseFormatter.error("Invalid post ID", 400)

    roommate_manager = BaseCRUDManager("roommate_posts", "listing")

    # Define related collections to clean up
    related_collections = [{"collection": "roommate_interests", "field": "postId"}]

    return roommate_manager.delete_item(
        post_id_obj,
        user["_id"],
        related_collections,
        create_roommate_cancellation_notification,
    )


@roommates_bp.route("/<post_id>/interest", methods=["POST"])
@require_auth
@handle_exceptions
def express_interest(user, post_id):
    post_id_obj = ValidationHelper.validate_object_id(post_id)
    if not post_id_obj:
        return ResponseFormatter.error("Invalid post ID", 400)

    # Initialize interest manager for roommates
    interest_manager = InterestManager("roommate_posts", "roommate_interests", "postId")

    return interest_manager.express_interest(
        post_id_obj, user["_id"], create_roommate_interest_notification
    )


@roommates_bp.route("/<post_id>/interested-users", methods=["GET"])
@require_auth
@handle_exceptions
def get_roommate_interested_users(user, post_id):
    """Get list of users interested in a specific roommate listing"""
    post_id_obj = ValidationHelper.validate_object_id(post_id)
    if not post_id_obj:
        return ResponseFormatter.error("Invalid post ID", 400)

    # Initialize interest manager for roommates
    interest_manager = InterestManager("roommate_posts", "roommate_interests", "postId")

    return interest_manager.get_interested_users(post_id_obj, user["_id"])


@roommates_bp.route("/<post_id>/interest", methods=["DELETE"])
@require_auth
@handle_exceptions
def remove_roommate_interest(user, post_id):
    post_id_obj = ValidationHelper.validate_object_id(post_id)
    if not post_id_obj:
        return ResponseFormatter.error("Invalid post ID", 400)

    # Initialize interest manager for roommates
    interest_manager = InterestManager("roommate_posts", "roommate_interests", "postId")

    return interest_manager.remove_interest(
        post_id_obj, user["_id"], create_roommate_interest_removed_notification
    )
