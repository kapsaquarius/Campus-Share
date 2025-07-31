#!/usr/bin/env python3
"""
Comprehensive API Tests for CampusShare Backend
Tests all endpoints and functionality
"""

import requests
import json
import time
from datetime import datetime, timedelta

# Configuration
BASE_URL = "http://localhost:5000/api"
TEST_USER = {
    "username": f"testuser_{int(time.time())}",
    "email": f"test{int(time.time())}@example.com",
    "password": "TestPassword123",
    "name": "Test User"
}

class CampusShareAPITester:
    def __init__(self):
        self.session = requests.Session()
        self.token = None
        self.user_id = None
        self.test_results = []

    def log_test(self, test_name, success, message=""):
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        self.test_results.append({
            "test": test_name,
            "success": success,
            "message": message
        })

    def test_health_check(self):
        """Test health check endpoint"""
        try:
            response = self.session.get(f"{BASE_URL}/health")
            if response.status_code == 200:
                data = response.json()
                self.log_test("Health Check", True, f"API is healthy - {data.get('message', '')}")
                return True
            else:
                self.log_test("Health Check", False, f"Status code: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Health Check", False, f"Exception: {str(e)}")
            return False

    def test_register(self):
        """Test user registration"""
        try:
            response = self.session.post(
                f"{BASE_URL}/auth/register",
                json=TEST_USER,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 201:
                data = response.json()
                self.token = data.get("token")
                self.user_id = data.get("user", {}).get("_id")
                self.log_test("User Registration", True, f"User created: {TEST_USER['username']}")
                return True
            else:
                data = response.json()
                self.log_test("User Registration", False, f"Status: {response.status_code}, Error: {data.get('error', '')}")
                return False
        except Exception as e:
            self.log_test("User Registration", False, f"Exception: {str(e)}")
            return False

    def test_login(self):
        """Test user login"""
        try:
            response = self.session.post(
                f"{BASE_URL}/auth/login",
                json={
                    "username": TEST_USER["username"],
                    "password": TEST_USER["password"]
                },
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                self.token = data.get("token")
                self.log_test("User Login", True, f"Login successful for {TEST_USER['username']}")
                return True
            else:
                data = response.json()
                self.log_test("User Login", False, f"Status: {response.status_code}, Error: {data.get('error', '')}")
                return False
        except Exception as e:
            self.log_test("User Login", False, f"Exception: {str(e)}")
            return False

    def test_get_profile(self):
        """Test getting user profile"""
        if not self.token:
            self.log_test("Get Profile", False, "No token available")
            return False
            
        try:
            response = self.session.get(
                f"{BASE_URL}/auth/profile",
                headers={"Authorization": f"Bearer {self.token}"}
            )
            
            if response.status_code == 200:
                data = response.json()
                user = data.get("user", {})
                self.log_test("Get Profile", True, f"Profile retrieved for {user.get('username', '')}")
                return True
            else:
                data = response.json()
                self.log_test("Get Profile", False, f"Status: {response.status_code}, Error: {data.get('error', '')}")
                return False
        except Exception as e:
            self.log_test("Get Profile", False, f"Exception: {str(e)}")
            return False

    def test_update_profile(self):
        """Test updating user profile"""
        if not self.token:
            self.log_test("Update Profile", False, "No token available")
            return False
            
        try:
            update_data = {
                "name": "Updated Test User",
                "phone": "+1234567890",
                "whatsapp": "+1234567890"
            }
            
            response = self.session.put(
                f"{BASE_URL}/auth/profile",
                json=update_data,
                headers={"Authorization": f"Bearer {self.token}"}
            )
            
            if response.status_code == 200:
                data = response.json()
                self.log_test("Update Profile", True, "Profile updated successfully")
                return True
            else:
                data = response.json()
                self.log_test("Update Profile", False, f"Status: {response.status_code}, Error: {data.get('error', '')}")
                return False
        except Exception as e:
            self.log_test("Update Profile", False, f"Exception: {str(e)}")
            return False

    def test_get_rides(self):
        """Test getting rides"""
        if not self.token:
            self.log_test("Get Rides", False, "No token available")
            return False
            
        try:
            response = self.session.get(
                f"{BASE_URL}/rides",
                headers={"Authorization": f"Bearer {self.token}"}
            )
            
            if response.status_code == 200:
                data = response.json()
                rides_count = len(data.get("rides", []))
                self.log_test("Get Rides", True, f"Retrieved {rides_count} rides")
                return True
            else:
                data = response.json()
                self.log_test("Get Rides", False, f"Status: {response.status_code}, Error: {data.get('error', '')}")
                return False
        except Exception as e:
            self.log_test("Get Rides", False, f"Exception: {str(e)}")
            return False

    def test_create_ride(self):
        """Test creating a ride"""
        if not self.token:
            self.log_test("Create Ride", False, "No token available")
            return False
            
        try:
            ride_data = {
                "startingFrom": "Boulder, Colorado 80301",
                "goingTo": "Denver International Airport",
                "travelDate": "2024-02-15",
                "departureStartTime": "14:30",
                "departureEndTime": "15:30",
                "availableSeats": 4,
                "suggestedContribution": {
                    "amount": 25,
                    "currency": "USD"
                }
            }
            
            response = self.session.post(
                f"{BASE_URL}/rides",
                json=ride_data,
                headers={"Authorization": f"Bearer {self.token}"}
            )
            
            if response.status_code == 201:
                data = response.json()
                self.log_test("Create Ride", True, f"Ride created with ID: {data.get('ride', {}).get('_id', '')}")
                return True
            else:
                data = response.json()
                self.log_test("Create Ride", False, f"Status: {response.status_code}, Error: {data.get('error', '')}")
                return False
        except Exception as e:
            self.log_test("Create Ride", False, f"Exception: {str(e)}")
            return False

    def test_get_roommates(self):
        """Test getting roommate requests"""
        if not self.token:
            self.log_test("Get Roommates", False, "No token available")
            return False
            
        try:
            response = self.session.get(
                f"{BASE_URL}/roommates",
                headers={"Authorization": f"Bearer {self.token}"}
            )
            
            if response.status_code == 200:
                data = response.json()
                requests_count = len(data.get("requests", []))
                self.log_test("Get Roommates", True, f"Retrieved {requests_count} roommate requests")
                return True
            else:
                data = response.json()
                self.log_test("Get Roommates", False, f"Status: {response.status_code}, Error: {data.get('error', '')}")
                return False
        except Exception as e:
            self.log_test("Get Roommates", False, f"Exception: {str(e)}")
            return False

    def test_get_subleases(self):
        """Test getting subleases"""
        if not self.token:
            self.log_test("Get Subleases", False, "No token available")
            return False
            
        try:
            response = self.session.get(
                f"{BASE_URL}/subleases",
                headers={"Authorization": f"Bearer {self.token}"}
            )
            
            if response.status_code == 200:
                data = response.json()
                subleases_count = len(data.get("subleases", []))
                self.log_test("Get Subleases", True, f"Retrieved {subleases_count} subleases")
                return True
            else:
                data = response.json()
                self.log_test("Get Subleases", False, f"Status: {response.status_code}, Error: {data.get('error', '')}")
                return False
        except Exception as e:
            self.log_test("Get Subleases", False, f"Exception: {str(e)}")
            return False

    def test_get_notifications(self):
        """Test getting notifications"""
        if not self.token:
            self.log_test("Get Notifications", False, "No token available")
            return False
            
        try:
            response = self.session.get(
                f"{BASE_URL}/notifications",
                headers={"Authorization": f"Bearer {self.token}"}
            )
            
            if response.status_code == 200:
                data = response.json()
                notifications_count = len(data.get("notifications", []))
                self.log_test("Get Notifications", True, f"Retrieved {notifications_count} notifications")
                return True
            else:
                data = response.json()
                self.log_test("Get Notifications", False, f"Status: {response.status_code}, Error: {data.get('error', '')}")
                return False
        except Exception as e:
            self.log_test("Get Notifications", False, f"Exception: {str(e)}")
            return False

    def test_get_locations(self):
        """Test getting locations"""
        try:
            response = self.session.get(f"{BASE_URL}/locations")
            
            if response.status_code == 200:
                data = response.json()
                locations_count = len(data.get("locations", []))
                self.log_test("Get Locations", True, f"Retrieved {locations_count} locations")
                return True
            else:
                data = response.json()
                self.log_test("Get Locations", False, f"Status: {response.status_code}, Error: {data.get('error', '')}")
                return False
        except Exception as e:
            self.log_test("Get Locations", False, f"Exception: {str(e)}")
            return False

    def run_all_tests(self):
        """Run all tests"""
        print("🧪 Starting CampusShare API Tests")
        print("=" * 50)
        
        tests = [
            self.test_health_check,
            self.test_register,
            self.test_login,
            self.test_get_profile,
            self.test_update_profile,
            self.test_get_rides,
            self.test_create_ride,
            self.test_get_roommates,
            self.test_get_subleases,
            self.test_get_notifications,
            self.test_get_locations,
        ]
        
        for test in tests:
            test()
            time.sleep(0.5)  # Small delay between tests
        
        # Summary
        print("\n" + "=" * 50)
        print("📊 Test Summary")
        print("=" * 50)
        
        passed = sum(1 for result in self.test_results if result["success"])
        total = len(self.test_results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        if passed == total:
            print("\n🎉 All tests passed! The API is working correctly.")
        else:
            print("\n⚠️ Some tests failed. Please check the errors above.")
        
        return passed == total

def main():
    tester = CampusShareAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    exit(main()) 