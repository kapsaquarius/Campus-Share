from typing import List, Dict, Optional
import re
from utils.service_base import DatabaseService, ValidationHelper, track_service_call


class LocationService(DatabaseService):
    def __init__(self):
        super().__init__("location_service", "locations")
        self.locations = self.collection  # Backward compatibility

    @track_service_call("search_locations")
    def search_locations(self, query: str, limit: int = 10) -> List[Dict]:
        """Search locations by ZIP code, city, or state with smart ranking.
        Prioritize exact/prefix city matches (e.g., "New York, NY") over broad state matches (e.g., any city in New York state).
        """
        q = ValidationHelper.sanitize_string(query or "")
        if not q:
            return []

        # Ensure reasonable limit
        limit = max(1, min(limit, 100))

        search_query = {
            "$or": [
                {"zipCode": {"$regex": q, "$options": "i"}},
                {"city": {"$regex": q, "$options": "i"}},
                {"state": {"$regex": q, "$options": "i"}},
                {"stateName": {"$regex": q, "$options": "i"}},
                {
                    "$expr": {
                        "$regexMatch": {
                            "input": {"$concat": ["$city", " ", "$state"]},
                            "regex": q,
                            "options": "i",
                        }
                    }
                },
                {
                    "$expr": {
                        "$regexMatch": {
                            "input": {"$concat": ["$city", ", ", "$state"]},
                            "regex": q,
                            "options": "i",
                        }
                    }
                },
                {
                    "$expr": {
                        "$regexMatch": {
                            "input": {"$concat": ["$city", ", ", "$stateName"]},
                            "regex": q,
                            "options": "i",
                        }
                    }
                },
                {
                    "$expr": {
                        "$regexMatch": {
                            "input": {"$concat": ["$city", " ", "$stateName"]},
                            "regex": q,
                            "options": "i",
                        }
                    }
                },
            ]
        }

        raw_results = list(self.locations.find(search_query).limit(250))

        q_lower = q.lower()
        words = [w for w in re.split(r"\s+", q_lower) if len(w) >= 2]

        def score(loc: Dict) -> int:
            city = str(loc.get("city", "")).lower()
            state = str(loc.get("state", "")).lower()
            state_name = str(loc.get("stateName", "")).lower()

            display_variants = [
                f"{city}",
                f"{city} {state}",
                f"{city}, {state}",
                f"{city} {state_name}",
                f"{city}, {state_name}",
            ]

            s = 0

            if city == q_lower:
                s += 1000

            if city.startswith(q_lower):
                s += 800

            if any(variant == q_lower for variant in display_variants):
                s += 700

            if q_lower in city:
                s += 500

            if words and all(w in city for w in words):
                s += 400

            if q_lower == state or q_lower == state_name:
                s += 120
            if state.startswith(q_lower) or state_name.startswith(q_lower):
                s += 80
            if q_lower in state or q_lower in state_name:
                s += 60

            s += max(0, 50 - len(city))
            return s

        ranked = sorted(raw_results, key=score, reverse=True)

        seen_keys = set()
        unique_city_state = []
        for loc in ranked:
            key = (str(loc.get("city", "")).lower(), str(loc.get("state", "")).lower())
            if key in seen_keys:
                continue
            seen_keys.add(key)
            unique_city_state.append(loc)
            if len(unique_city_state) >= limit:
                break

        return self._format_locations(unique_city_state)

    def _get_word_conditions(self, query: str) -> List[Dict]:
        """Generate word-based search conditions for multi-word queries"""
        words = [
            word.strip()
            for word in query.split()
            if word.strip() and len(word.strip()) >= 2
        ]
        conditions = []

        for word in words:
            conditions.extend(
                [
                    {"displayName": {"$regex": word, "$options": "i"}},
                    {"city": {"$regex": word, "$options": "i"}},
                    {"stateName": {"$regex": word, "$options": "i"}},
                ]
            )

        return conditions

    @track_service_call("get_location_by_id")
    def get_location_by_id(self, location_id: str) -> Optional[Dict]:
        """Get a location by ID - needed for ride references"""
        try:
            location_id_obj = self._validate_object_id(location_id, "Location ID")
            location = self.locations.find_one({"_id": location_id_obj})
            return self._format_location(location) if location else None
        except Exception as e:
            self.logger.error(f"Error getting location by ID {location_id}: {str(e)}")
            return None

    def _format_location(self, location: Dict) -> Dict:
        """Format a single location for API response"""
        if not location:
            return None

        return {
            "_id": str(location["_id"]),
            "zipCode": location["zipCode"],
            "city": location["city"],
            "state": location["state"],
            "stateName": location["stateName"],
            "displayName": f"{location['city']}, {location['state']}",
        }

    def _format_locations(self, locations: List[Dict]) -> List[Dict]:
        """Format multiple locations for API response"""
        return [self._format_location(location) for location in locations]

    def get_all_city_locations(self, city: str, state: str) -> List[Dict]:
        """Get all zip codes for a given city and state"""
        query = {
            "city": {"$regex": f"^{re.escape(city)}$", "$options": "i"},
            "state": {"$regex": f"^{re.escape(state)}$", "$options": "i"},
        }

        locations = list(self.locations.find(query).sort("zipCode", 1))
        return self._format_locations(locations)

    def get_all_city_display_names(self, city: str, state_name: str) -> List[str]:
        """Get all possible display name variations for a city"""
        query = {
            "city": {"$regex": f"^{re.escape(city)}$", "$options": "i"},
            "$or": [
                {
                    "stateName": {
                        "$regex": f"^{re.escape(state_name)}$",
                        "$options": "i",
                    }
                },
                {"state": {"$regex": f"^{re.escape(state_name)}$", "$options": "i"}},
            ],
        }

        locations = list(self.locations.find(query).sort("zipCode", 1))
        display_names = []

        for location in locations:
            general_name = f"{location['city']}, {location['stateName']}"
            specific_name = (
                f"{location['city']}, {location['stateName']} {location['zipCode']}"
            )
            general_abbrev = f"{location['city']}, {location['state']}"
            specific_abbrev = (
                f"{location['city']}, {location['state']} {location['zipCode']}"
            )

            if general_name not in display_names:
                display_names.append(general_name)
            display_names.append(specific_name)
            if general_abbrev not in display_names:
                display_names.append(general_abbrev)
            display_names.append(specific_abbrev)

        return display_names

    def parse_location_string(self, location_string: str) -> Dict:
        """Parse a location string to extract city, state, and zip code"""
        pattern = r"^(.+?),\s*(.+?)(?:\s+(\d{5}))?$"
        match = re.match(pattern, location_string.strip())

        if match:
            city = match.group(1).strip()
            state_part = match.group(2).strip()
            zip_code = match.group(3)

            if not zip_code and " " in state_part:
                parts = state_part.rsplit(" ", 1)
                if len(parts) == 2 and parts[1].isdigit() and len(parts[1]) == 5:
                    state_part = parts[0]
                    zip_code = parts[1]

            return {"city": city, "state": state_part, "zipCode": zip_code}

        return None


location_service = LocationService()
