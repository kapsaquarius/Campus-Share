from datetime import datetime
from typing import Dict, List, Any
import re

from scripts.database import get_collection
from utils.matching_utils import MatchingHelper


def get_location_variations(location_string: str) -> List[str]:
    """Get all possible variations of a location for intelligent matching"""
    return MatchingHelper.get_location_variations(location_string)


def _interval_overlap_ratio(
    a_min: float, a_max: float, b_min: float, b_max: float
) -> float:
    """Calculate overlap ratio between two intervals"""
    return MatchingHelper.calculate_interval_overlap(a_min, a_max, b_min, b_max)


def _date_distance_days(date_str: str, target_str: str) -> int:
    try:
        d1 = datetime.strptime(date_str, "%Y-%m-%d").date()
        d2 = datetime.strptime(target_str, "%Y-%m-%d").date()
        return abs((d1 - d2).days)
    except Exception:
        return 9999


def calculate_listing_score(listing: Dict[str, Any], criteria: Dict[str, Any]) -> float:
    score = 0.0

    location_score = 0.0
    if criteria.get("location"):

        def tokens(s: str) -> List[str]:
            return [t for t in re.findall(r"[A-Za-z0-9]+", s.lower()) if len(t) >= 2]

        crit_tokens = tokens(criteria["location"])
        loc_val = listing.get("location") or ""
        loc_norm = loc_val.lower()
        if all(t in loc_norm for t in crit_tokens if t):
            location_score = (
                1.0 if loc_norm.strip() == criteria["location"].strip().lower() else 0.9
            )
    else:
        location_score = 0.7
    score += location_score * 0.25

    budget_score = 0.0
    cmin = criteria.get("budgetMin")
    cmax = criteria.get("budgetMax")
    lmin = listing.get("budgetMin")
    lmax = listing.get("budgetMax")
    if cmin is not None and cmax is not None and lmin is not None and lmax is not None:
        budget_score = _interval_overlap_ratio(lmin, lmax, cmin, cmax)
    elif lmin is not None and cmax is not None:
        budget_score = 1.0 if lmin <= cmax else 0.0
    elif lmax is not None and cmin is not None:
        budget_score = 1.0 if lmax >= cmin else 0.0
    else:
        budget_score = 0.5
    score += budget_score * 0.25

    timing_score = 0.0
    desired_move_in = criteria.get("moveIn")
    listing_move_in = listing.get("moveInEarliest")
    if desired_move_in and listing_move_in:
        days = _date_distance_days(listing_move_in, desired_move_in)
        timing_score = max(0.0, 1.0 - (days / 30.0))
    else:
        timing_score = 0.6
    score += timing_score * 0.15

    life_score = 0.0
    matches = 0
    checks = 0
    if criteria.get("furnished") in ("yes", "no"):
        checks += 1
        if (criteria["furnished"] == "yes") == bool(listing.get("furnished")):
            matches += 1
    if criteria.get("pets") in ("ok", "no"):
        checks += 1
        if (criteria["pets"] == "ok") == bool(listing.get("petFriendly")):
            matches += 1
    if criteria.get("smoking") in ("ok", "no"):
        checks += 1
        if (criteria["smoking"] == "ok") == bool(listing.get("smokerOk")):
            matches += 1
    if criteria.get("dietary") in ("veg", "non_veg", "vegan"):
        checks += 1
        if listing.get("dietaryPreference") == criteria["dietary"]:
            matches += 1
    if criteria.get("sleep") in ("early_bird", "night_owl", "flexible"):
        checks += 1
        ls = listing.get("sleepSchedule")
        cs = criteria["sleep"]
        if ls == cs or ls == "flexible" or cs == "flexible":
            matches += 1
    if criteria.get("guestsPerWeek") and criteria["guestsPerWeek"] != "any":
        checks += 1
        if str(listing.get("guestsPerWeek")) == str(criteria["guestsPerWeek"]):
            matches += 1
    if checks > 0:
        life_score = matches / checks
    else:
        life_score = 0.6
    score += life_score * 0.25

    roommate_interests = get_collection("roommate_interests")
    interest_count = roommate_interests.count_documents({"postId": listing.get("_id")})
    popularity_score = min(interest_count / 5.0, 1.0)
    score += popularity_score * 0.05

    try:
        created_at = listing.get("createdAt")
        if isinstance(created_at, datetime):
            age_days = (datetime.utcnow() - created_at).days
        else:
            age_days = 999
        recency_score = max(0.0, 1.0 - (age_days / 30.0))
        score += recency_score * 0.05
    except Exception:
        score += 0.025

    return float(score)


def search_roommates_with_scoring(
    criteria: Dict[str, Any], user_id: str | None = None
) -> List[Dict[str, Any]]:
    posts = get_collection("roommate_posts")

    query: Dict[str, Any] = {"status": "active"}

    if criteria.get("type") in ("offer", "seek"):
        query["type"] = criteria["type"]

    if criteria.get("location"):
        crit = criteria["location"]
        toks = [t for t in re.findall(r"[A-Za-z0-9]+", crit) if len(t) >= 2]
        if toks:
            and_clauses = query.get("$and", [])
            for t in toks:
                and_clauses.append({"location": {"$regex": t, "$options": "i"}})
            if and_clauses:
                query["$and"] = and_clauses

    if criteria.get("roomType") in ("private", "shared"):
        query["roomType"] = criteria["roomType"]
    if criteria.get("furnished") in ("yes", "no"):
        query["furnished"] = True if criteria["furnished"] == "yes" else False
    if criteria.get("pets") in ("ok", "no"):
        query["petFriendly"] = True if criteria["pets"] == "ok" else False
    if criteria.get("smoking") in ("ok", "no"):
        query["smokerOk"] = True if criteria["smoking"] == "ok" else False
    if criteria.get("dietary") in ("veg", "non_veg", "vegan"):
        query["dietaryPreference"] = criteria["dietary"]
    if criteria.get("sleep") in ("early_bird", "night_owl", "flexible"):
        query["sleepSchedule"] = criteria["sleep"]
    if criteria.get("guestsPerWeek") and criteria["guestsPerWeek"] != "any":
        query["guestsPerWeek"] = criteria["guestsPerWeek"]

    cmin = criteria.get("budgetMin")
    cmax = criteria.get("budgetMax")
    if cmin is not None and cmax is not None:
        query["$and"] = [
            {"budgetMax": {"$gte": cmin}},
            {"budgetMin": {"$lte": cmax}},
        ]

    if criteria.get("moveInStart") and criteria.get("moveInEnd"):
        query["moveInEarliest"] = {
            "$gte": criteria["moveInStart"],
            "$lte": criteria["moveInEnd"],
        }

    from bson import ObjectId

    if user_id:
        query["userId"] = {"$ne": ObjectId(user_id)}
        interests = get_collection("roommate_interests")
        interested_ids = [
            doc["postId"]
            for doc in interests.find(
                {"interestedUserId": ObjectId(user_id), "status": "interested"},
                {"postId": 1},
            )
        ]
        if interested_ids:
            query["_id"] = {"$nin": interested_ids}

    candidates = list(posts.find(query))

    if candidates:
        candidate_ids = [c["_id"] for c in candidates]
        roommate_interests = get_collection("roommate_interests")
        try:
            pipeline = [
                {"$match": {"postId": {"$in": candidate_ids}, "status": "interested"}},
                {"$group": {"_id": "$postId", "count": {"$sum": 1}}},
            ]
            counts = list(roommate_interests.aggregate(pipeline))
            counts_map = {c["_id"]: c["count"] for c in counts}
        except Exception:
            counts_map = {}
        for c in candidates:
            c["interestCount"] = counts_map.get(c["_id"], 0)

    scored: List[Dict[str, Any]] = []
    for item in candidates:
        s = calculate_listing_score(item, criteria)
        if s > 0.1:
            item["matchScore"] = s
            scored.append(item)

    scored.sort(key=lambda x: x.get("matchScore", 0.0), reverse=True)
    return scored


def get_roommate_with_details(post_id):
    posts = get_collection("roommate_posts")
    pipeline = [
        {"$match": {"_id": post_id}},
        {
            "$lookup": {
                "from": "users",
                "localField": "userId",
                "foreignField": "_id",
                "as": "poster",
            }
        },
        {"$unwind": {"path": "$poster", "preserveNullAndEmptyArrays": True}},
        {
            "$addFields": {
                "poster": {
                    "name": "$poster.name",
                    "phoneNumber": "$poster.phone",
                    "whatsappNumber": "$poster.whatsapp",
                }
            }
        },
    ]
    docs = list(posts.aggregate(pipeline))
    return docs[0] if docs else None
