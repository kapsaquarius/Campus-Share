"""
Base classes and utilities for service layer consistency
"""

import logging
from typing import Dict, List, Any, Tuple
from abc import ABC
from functools import wraps
from datetime import datetime
from bson import ObjectId
from scripts.database import get_collection


class ServiceException(Exception):
    """Base exception for service layer"""

    pass


class ValidationException(ServiceException):
    """Exception for validation errors"""

    pass


class NotFoundError(ServiceException):
    """Exception for resource not found"""

    pass


class ServiceResult:
    """Standardized service result wrapper"""

    def __init__(
        self, success: bool, data: Any = None, error: str = None, error_code: str = None
    ):
        self.success = success
        self.data = data
        self.error = error
        self.error_code = error_code

    @classmethod
    def ok(cls, data: Any = None):
        """Create success result"""
        return cls(success=True, data=data)

    @classmethod
    def fail(cls, error: str, error_code: str = None, data: Any = None):
        """Create failure result"""
        return cls(success=False, data=data, error=error, error_code=error_code)


class ServiceLogger:
    """Centralized logging for services"""

    @staticmethod
    def get_logger(service_name: str) -> logging.Logger:
        """Get logger for service"""
        logger = logging.getLogger(f"services.{service_name}")
        if not logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter(
                "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
            )
            handler.setFormatter(formatter)
            logger.addHandler(handler)
            logger.setLevel(logging.INFO)
        return logger


def service_method(f):
    """Decorator for service methods with consistent error handling"""

    @wraps(f)
    def wrapper(self, *args, **kwargs):
        try:
            return f(self, *args, **kwargs)
        except ValidationException as e:
            self.logger.warning(f"Validation error in {f.__name__}: {str(e)}")
            return ServiceResult.fail(str(e), "VALIDATION_ERROR")
        except NotFoundError as e:
            self.logger.warning(f"Not found error in {f.__name__}: {str(e)}")
            return ServiceResult.fail(str(e), "NOT_FOUND")
        except ServiceException as e:
            self.logger.error(f"Service error in {f.__name__}: {str(e)}")
            return ServiceResult.fail(str(e), "SERVICE_ERROR")
        except Exception as e:
            self.logger.error(f"Unexpected error in {f.__name__}: {str(e)}")
            return ServiceResult.fail("Internal service error", "INTERNAL_ERROR")

    return wrapper


class BaseService(ABC):
    """Base class for all services"""

    def __init__(self, service_name: str):
        self.service_name = service_name
        self.logger = ServiceLogger.get_logger(service_name)

    def _validate_required_fields(
        self, data: Dict[str, Any], required_fields: List[str]
    ):
        """Validate required fields"""
        if not data:
            raise ValidationException("Data is required")

        missing_fields = [field for field in required_fields if not data.get(field)]
        if missing_fields:
            raise ValidationException(
                f"Missing required fields: {', '.join(missing_fields)}"
            )

    def _validate_object_id(self, id_string: str, field_name: str = "ID") -> ObjectId:
        """Validate and convert string to ObjectId"""
        try:
            return ObjectId(id_string)
        except Exception:
            raise ValidationException(f"Invalid {field_name}")

    def _format_timestamps(self, obj: Dict[str, Any]) -> Dict[str, Any]:
        """Format datetime objects for API response"""
        if not obj:
            return obj

        formatted = obj.copy()
        for key, value in formatted.items():
            if isinstance(value, datetime):
                formatted[key] = value.isoformat() + "Z"
        return formatted


class DatabaseService(BaseService):
    """Base class for services that interact with database collections"""

    def __init__(self, service_name: str, collection_name: str):
        super().__init__(service_name)
        self.collection_name = collection_name
        self.collection = get_collection(collection_name)

    def _format_object_id(self, obj: Dict[str, Any]) -> Dict[str, Any]:
        """Format ObjectId for API response"""
        if not obj:
            return obj

        formatted = obj.copy()
        if "_id" in formatted:
            formatted["_id"] = str(formatted["_id"])
        if "userId" in formatted:
            formatted["userId"] = str(formatted["userId"])

        # Format any other ObjectId fields
        for key, value in formatted.items():
            if isinstance(value, ObjectId):
                formatted[key] = str(value)

        return self._format_timestamps(formatted)

    def _format_object_list(
        self, obj_list: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Format list of objects"""
        return [self._format_object_id(obj) for obj in obj_list]


class ValidationHelper:
    """Common validation utilities for services"""

    @staticmethod
    def validate_email(email: str) -> bool:
        """Validate email format"""
        import re

        pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
        return bool(re.match(pattern, email))

    @staticmethod
    def validate_phone(phone: str) -> bool:
        """Validate phone number format"""
        import re

        # Basic international phone validation
        pattern = r"^\+[\d\s\-\(\)]{7,}$"
        return bool(re.match(pattern, phone.strip()))

    @staticmethod
    def validate_date_string(date_str: str, format_str: str = "%Y-%m-%d") -> bool:
        """Validate date string format"""
        try:
            datetime.strptime(date_str, format_str)
            return True
        except ValueError:
            return False

    @staticmethod
    def validate_time_string(time_str: str, format_str: str = "%H:%M") -> bool:
        """Validate time string format"""
        try:
            datetime.strptime(time_str, format_str)
            return True
        except ValueError:
            return False

    @staticmethod
    def sanitize_string(text: str, max_length: int = None) -> str:
        """Sanitize and trim string input"""
        if not text:
            return ""

        sanitized = text.strip()
        if max_length and len(sanitized) > max_length:
            sanitized = sanitized[:max_length]

        return sanitized


class PaginationHelper:
    """Pagination utilities for services"""

    @staticmethod
    def paginate_query(
        collection,
        query: Dict[str, Any],
        page: int = 1,
        per_page: int = 10,
        sort_by: str = "createdAt",
        sort_order: int = -1,
    ) -> Tuple[List[Dict], int]:
        """Execute paginated query"""
        # Ensure reasonable limits
        page = max(1, page)
        per_page = min(max(1, per_page), 100)

        # Get total count
        total = collection.count_documents(query)

        # Get paginated results
        skip = (page - 1) * per_page
        results = list(
            collection.find(query).sort(sort_by, sort_order).skip(skip).limit(per_page)
        )

        return results, total

    @staticmethod
    def create_pagination_response(
        items: List[Any], total: int, page: int, per_page: int
    ) -> Dict[str, Any]:
        """Create standardized pagination response"""
        return {
            "items": items,
            "pagination": {
                "page": page,
                "per_page": per_page,
                "total": total,
                "total_pages": (total + per_page - 1) // per_page,
            },
        }


class CacheHelper:
    """Simple in-memory cache helper for services"""

    _cache = {}

    @classmethod
    def get(cls, key: str) -> Any:
        """Get cached value"""
        return cls._cache.get(key)

    @classmethod
    def set(cls, key: str, value: Any, ttl: int = 300):
        """Set cached value with TTL (in seconds)"""
        import time

        expiry = time.time() + ttl
        cls._cache[key] = {"value": value, "expiry": expiry}

    @classmethod
    def clear_expired(cls):
        """Clear expired cache entries"""
        import time

        current_time = time.time()
        expired_keys = [
            key
            for key, data in cls._cache.items()
            if data.get("expiry", 0) < current_time
        ]
        for key in expired_keys:
            del cls._cache[key]

    @classmethod
    def clear_all(cls):
        """Clear all cache"""
        cls._cache.clear()


class ServiceMetrics:
    """Simple metrics collection for services"""

    _metrics = {}

    @classmethod
    def increment_counter(cls, metric_name: str, value: int = 1):
        """Increment a counter metric"""
        if metric_name not in cls._metrics:
            cls._metrics[metric_name] = 0
        cls._metrics[metric_name] += value

    @classmethod
    def get_metrics(cls) -> Dict[str, Any]:
        """Get all metrics"""
        return cls._metrics.copy()

    @classmethod
    def reset_metrics(cls):
        """Reset all metrics"""
        cls._metrics.clear()


def track_service_call(metric_name: str):
    """Decorator to track service method calls"""

    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            ServiceMetrics.increment_counter(f"service_calls.{metric_name}")
            start_time = datetime.now()
            try:
                result = f(*args, **kwargs)
                ServiceMetrics.increment_counter(f"service_calls.{metric_name}.success")
                return result
            except Exception:
                ServiceMetrics.increment_counter(f"service_calls.{metric_name}.error")
                raise
            finally:
                duration = (datetime.now() - start_time).total_seconds()
                ServiceMetrics.increment_counter(
                    f"service_calls.{metric_name}.duration_ms", int(duration * 1000)
                )

        return wrapper

    return decorator
