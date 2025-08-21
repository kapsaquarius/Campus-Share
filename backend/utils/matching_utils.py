"""
Common utilities for ride and roommate matching services
"""

import re
from typing import List, Dict, Any
from datetime import datetime
from services.location_service import location_service


class MatchingHelper:
    """Common helper methods for matching services"""

    @staticmethod
    def tokenize_text(text: str) -> List[str]:
        """Extract meaningful tokens from text for matching"""
        return [
            t for t in re.findall(r"[A-Za-z0-9]+", (text or "").lower()) if len(t) >= 2
        ]

    @staticmethod
    def time_to_minutes(time_str: str) -> int:
        """Convert HH:MM time string to minutes since midnight"""
        try:
            hours, minutes = map(int, time_str.split(":"))
            return hours * 60 + minutes
        except (ValueError, AttributeError):
            raise ValueError(f"Invalid time format: {time_str}")

    @staticmethod
    def calculate_time_overlap(start1: str, end1: str, start2: str, end2: str) -> float:
        """Calculate overlap ratio between two time ranges"""
        try:
            start1_min = MatchingHelper.time_to_minutes(start1)
            end1_min = MatchingHelper.time_to_minutes(end1)
            start2_min = MatchingHelper.time_to_minutes(start2)
            end2_min = MatchingHelper.time_to_minutes(end2)

            # Calculate overlap
            overlap_start = max(start1_min, start2_min)
            overlap_end = min(end1_min, end2_min)

            if overlap_start >= overlap_end:
                return 0.0

            overlap_duration = overlap_end - overlap_start
            total_duration = min(end1_min - start1_min, end2_min - start2_min)

            return overlap_duration / total_duration if total_duration > 0 else 0.0
        except Exception:
            return 0.0

    @staticmethod
    def validate_time_format(time_str: str) -> bool:
        """Validate time format (HH:MM in 24-hour format)"""
        if not time_str:
            return False
        pattern = r"^([01]?[0-9]|2[0-3]):[0-5][0-9]$"
        return bool(re.match(pattern, time_str))

    @staticmethod
    def is_valid_time_range(start_time: str, end_time: str) -> bool:
        """Check if start time is before end time"""
        try:
            start_min = MatchingHelper.time_to_minutes(start_time)
            end_min = MatchingHelper.time_to_minutes(end_time)
            return start_min < end_min
        except Exception:
            return False

    @staticmethod
    def get_location_variations(location_string: str) -> List[str]:
        """Get all possible variations of a location string"""
        if not location_string:
            return []

        try:
            parsed = location_service.parse_location_string(location_string)

            if not parsed:
                # Handle unparseable locations
                s = location_string.strip()
                variants = [s]
                if "," in s:
                    no_comma = " ".join([p.strip() for p in s.split(",")])
                    variants.append(no_comma)
                else:
                    parts = s.split()
                    if len(parts) >= 2:
                        variants.append(parts[0] + ", " + " ".join(parts[1:]))

                return MatchingHelper._deduplicate_list(variants)

            # Handle parseable locations
            variations = [location_string]
            if parsed.get("city") and parsed.get("state"):
                city_variations = location_service.get_all_city_display_names(
                    parsed["city"], parsed["state"]
                )
                variations.extend(city_variations)

            return MatchingHelper._deduplicate_list(variations)

        except Exception:
            # Fallback to basic handling
            return [location_string.strip()] if location_string else []

    @staticmethod
    def _deduplicate_list(items: List[str]) -> List[str]:
        """Remove duplicates while preserving order"""
        seen = set()
        unique = []
        for item in items:
            if item and item not in seen:
                seen.add(item)
                unique.append(item)
        return unique

    @staticmethod
    def calculate_interval_overlap(
        a_min: float, a_max: float, b_min: float, b_max: float
    ) -> float:
        """Calculate overlap ratio between two numeric intervals"""
        if any(val is None for val in [a_min, a_max, b_min, b_max]):
            return 0.0

        if a_min > a_max or b_min > b_max:
            return 0.0

        overlap_start = max(a_min, b_min)
        overlap_end = min(a_max, b_max)

        if overlap_start >= overlap_end:
            return 0.0

        overlap = overlap_end - overlap_start
        a_range = a_max - a_min
        b_range = b_max - b_min
        min_range = min(a_range, b_range)

        return overlap / min_range if min_range > 0 else 0.0

    @staticmethod
    def calculate_text_similarity(text1: str, text2: str) -> float:
        """Calculate similarity between two text strings using token overlap"""
        if not text1 or not text2:
            return 0.0

        tokens1 = set(MatchingHelper.tokenize_text(text1))
        tokens2 = set(MatchingHelper.tokenize_text(text2))

        if not tokens1 or not tokens2:
            return 0.0

        intersection = tokens1.intersection(tokens2)
        union = tokens1.union(tokens2)

        return len(intersection) / len(union) if union else 0.0

    @staticmethod
    def calculate_location_match_score(location1: str, location2: str) -> float:
        """Calculate location matching score with variations"""
        if not location1 or not location2:
            return 0.0

        # Direct match
        if location1.lower() == location2.lower():
            return 1.0

        # Get variations for both locations
        variations1 = MatchingHelper.get_location_variations(location1)
        variations2 = MatchingHelper.get_location_variations(location2)

        # Check for any matching variation
        for v1 in variations1:
            for v2 in variations2:
                if v1.lower() == v2.lower():
                    return 0.9  # High score for variation match

        # Fallback to text similarity
        return MatchingHelper.calculate_text_similarity(location1, location2)

    @staticmethod
    def normalize_score(
        score: float, min_val: float = 0.0, max_val: float = 1.0
    ) -> float:
        """Normalize a score to be within specified range"""
        return max(min_val, min(max_val, score))

    @staticmethod
    def calculate_date_proximity_score(
        date1: str, date2: str, max_days: int = 7
    ) -> float:
        """Calculate proximity score between two dates"""
        try:
            d1 = datetime.strptime(date1, "%Y-%m-%d")
            d2 = datetime.strptime(date2, "%Y-%m-%d")

            days_diff = abs((d1 - d2).days)

            if days_diff == 0:
                return 1.0
            elif days_diff <= max_days:
                return 1.0 - (days_diff / max_days)
            else:
                return 0.0

        except Exception:
            return 0.0


class ScoringEngine:
    """Advanced scoring engine for matching algorithms"""

    def __init__(self):
        self.weights = {"location": 0.4, "time": 0.3, "date": 0.2, "preferences": 0.1}

    def set_weights(self, **kwargs):
        """Update scoring weights"""
        for key, value in kwargs.items():
            if key in self.weights:
                self.weights[key] = value

    def calculate_weighted_score(self, scores: Dict[str, float]) -> float:
        """Calculate weighted average score"""
        total_score = 0.0
        total_weight = 0.0

        for category, score in scores.items():
            weight = self.weights.get(category, 0.1)
            if score is not None:
                total_score += score * weight
                total_weight += weight

        return total_score / total_weight if total_weight > 0 else 0.0

    def rank_matches(
        self, matches: List[Dict[str, Any]], score_key: str = "score"
    ) -> List[Dict[str, Any]]:
        """Rank matches by score in descending order"""
        return sorted(matches, key=lambda x: x.get(score_key, 0), reverse=True)


class FilterHelper:
    """Helper for filtering and searching results"""

    @staticmethod
    def apply_filters(
        items: List[Dict[str, Any]], filters: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Apply multiple filters to a list of items"""
        filtered = items.copy()

        for filter_name, filter_value in filters.items():
            if filter_value is not None:
                filtered = FilterHelper._apply_single_filter(
                    filtered, filter_name, filter_value
                )

        return filtered

    @staticmethod
    def _apply_single_filter(
        items: List[Dict[str, Any]], field: str, value: Any
    ) -> List[Dict[str, Any]]:
        """Apply a single filter"""
        if not items:
            return []

        # Handle different filter types
        if isinstance(value, str):
            return [
                item
                for item in items
                if str(item.get(field, "")).lower().find(value.lower()) != -1
            ]
        elif isinstance(value, (int, float)):
            return [item for item in items if item.get(field) == value]
        elif isinstance(value, bool):
            return [item for item in items if bool(item.get(field)) == value]
        elif isinstance(value, list):
            return [item for item in items if item.get(field) in value]
        else:
            return [item for item in items if item.get(field) == value]

    @staticmethod
    def paginate_results(items: List[Any], page: int = 1, per_page: int = 10) -> tuple:
        """Paginate results"""
        page = max(1, page)
        per_page = max(1, min(per_page, 100))

        total = len(items)
        start_idx = (page - 1) * per_page
        end_idx = start_idx + per_page

        paginated_items = items[start_idx:end_idx]
        total_pages = (total + per_page - 1) // per_page

        return paginated_items, {
            "page": page,
            "per_page": per_page,
            "total": total,
            "total_pages": total_pages,
        }
