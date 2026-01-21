#!/usr/bin/env python3
"""
Instagram Clone Backend API Test Suite
Tests all backend endpoints comprehensively
"""

import requests
import json
import sys
from datetime import datetime

# Backend URL from frontend/.env
BASE_URL = "https://instaclone-801.preview.emergentagent.com/api"

class InstagramAPITester:
    def __init__(self):
        self.base_url = BASE_URL
        self.token = None
        self.user_id = None
        self.post_id = None
        self.story_id = None
        self.test_results = []
        
    def log_test(self, test_name, success, message="", response_data=None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        
        self.test_results.append({
            "test": test_name,
            "success": success,
            "message": message,
            "response_data": response_data
        })
        
    def make_request(self, method, endpoint, data=None, headers=None):
        """Make HTTP request with error handling"""
        url = f"{self.base_url}{endpoint}"
        
        if headers is None:
            headers = {}
            
        if self.token and "Authorization" not in headers:
            headers["Authorization"] = f"Bearer {self.token}"
            
        headers["Content-Type"] = "application/json"
        
        try:
            if method.upper() == "GET":
                response = requests.get(url, headers=headers, timeout=30)
            elif method.upper() == "POST":
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method.upper() == "DELETE":
                response = requests.delete(url, headers=headers, timeout=30)
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            return response
            
        except requests.exceptions.RequestException as e:
            print(f"Request failed: {e}")
            return None
    
    def test_auth_signup(self):
        """Test user signup"""
        print("\n=== Testing Authentication - Signup ===")
        
        user_data = {
            "username": "john_doe",
            "email": "john@example.com", 
            "displayName": "John Doe",
            "password": "password123"
        }
        
        response = self.make_request("POST", "/auth/signup", user_data)
        
        if response is None:
            self.log_test("Auth Signup", False, "Request failed - no response")
            return False
            
        if response.status_code == 200:
            data = response.json()
            if "token" in data and "user" in data:
                self.token = data["token"]
                self.user_id = data["user"]["id"]
                self.log_test("Auth Signup", True, f"User created successfully with ID: {self.user_id}")
                return True
            else:
                self.log_test("Auth Signup", False, "Missing token or user in response")
                return False
        else:
            self.log_test("Auth Signup", False, f"Status: {response.status_code}, Response: {response.text}")
            return False
    
    def test_auth_login(self):
        """Test user login"""
        print("\n=== Testing Authentication - Login ===")
        
        login_data = {
            "email": "john@example.com",
            "password": "password123"
        }
        
        response = self.make_request("POST", "/auth/login", login_data)
        
        if response is None:
            self.log_test("Auth Login", False, "Request failed - no response")
            return False
            
        if response.status_code == 200:
            data = response.json()
            if "token" in data and "user" in data:
                self.token = data["token"]  # Update token
                self.log_test("Auth Login", True, "Login successful")
                return True
            else:
                self.log_test("Auth Login", False, "Missing token or user in response")
                return False
        else:
            self.log_test("Auth Login", False, f"Status: {response.status_code}, Response: {response.text}")
            return False
    
    def test_auth_me(self):
        """Test get current user"""
        print("\n=== Testing Authentication - Get Me ===")
        
        if not self.token:
            self.log_test("Auth Me", False, "No token available")
            return False
            
        response = self.make_request("GET", "/auth/me")
        
        if response is None:
            self.log_test("Auth Me", False, "Request failed - no response")
            return False
            
        if response.status_code == 200:
            data = response.json()
            if "id" in data and "username" in data:
                self.log_test("Auth Me", True, f"User info retrieved: {data['username']}")
                return True
            else:
                self.log_test("Auth Me", False, "Invalid user data in response")
                return False
        else:
            self.log_test("Auth Me", False, f"Status: {response.status_code}, Response: {response.text}")
            return False
    
    def test_create_post(self):
        """Test creating a post"""
        print("\n=== Testing Posts - Create Post ===")
        
        if not self.token:
            self.log_test("Create Post", False, "No token available")
            return False
            
        post_data = {
            "text": "My first Instagram post! #excited",
            "commentsEnabled": True,
            "isAnonymous": False
        }
        
        response = self.make_request("POST", "/posts", post_data)
        
        if response is None:
            self.log_test("Create Post", False, "Request failed - no response")
            return False
            
        if response.status_code == 200:
            data = response.json()
            if "id" in data and "text" in data:
                self.post_id = data["id"]
                self.log_test("Create Post", True, f"Post created with ID: {self.post_id}")
                return True
            else:
                self.log_test("Create Post", False, "Invalid post data in response")
                return False
        else:
            self.log_test("Create Post", False, f"Status: {response.status_code}, Response: {response.text}")
            return False
    
    def test_get_feed(self):
        """Test getting the feed"""
        print("\n=== Testing Posts - Get Feed ===")
        
        if not self.token:
            self.log_test("Get Feed", False, "No token available")
            return False
            
        response = self.make_request("GET", "/feed")
        
        if response is None:
            self.log_test("Get Feed", False, "Request failed - no response")
            return False
            
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                self.log_test("Get Feed", True, f"Feed retrieved with {len(data)} posts")
                return True
            else:
                self.log_test("Get Feed", False, "Feed response is not a list")
                return False
        else:
            self.log_test("Get Feed", False, f"Status: {response.status_code}, Response: {response.text}")
            return False
    
    def test_get_user_posts(self):
        """Test getting user posts"""
        print("\n=== Testing Posts - Get User Posts ===")
        
        if not self.token or not self.user_id:
            self.log_test("Get User Posts", False, "No token or user_id available")
            return False
            
        response = self.make_request("GET", f"/users/{self.user_id}/posts")
        
        if response is None:
            self.log_test("Get User Posts", False, "Request failed - no response")
            return False
            
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                self.log_test("Get User Posts", True, f"User posts retrieved: {len(data)} posts")
                return True
            else:
                self.log_test("Get User Posts", False, "User posts response is not a list")
                return False
        else:
            self.log_test("Get User Posts", False, f"Status: {response.status_code}, Response: {response.text}")
            return False
    
    def test_react_to_post(self):
        """Test reacting to a post"""
        print("\n=== Testing Reactions - React to Post ===")
        
        if not self.token or not self.post_id:
            self.log_test("React to Post", False, "No token or post_id available")
            return False
            
        reaction_data = {
            "reactionType": "black_heart"
        }
        
        response = self.make_request("POST", f"/posts/{self.post_id}/react", reaction_data)
        
        if response is None:
            self.log_test("React to Post", False, "Request failed - no response")
            return False
            
        if response.status_code == 200:
            data = response.json()
            if "success" in data and data["success"]:
                self.log_test("React to Post", True, "Reaction added successfully")
                return True
            else:
                self.log_test("React to Post", False, "Reaction response invalid")
                return False
        else:
            self.log_test("React to Post", False, f"Status: {response.status_code}, Response: {response.text}")
            return False
    
    def test_create_comment(self):
        """Test creating a comment"""
        print("\n=== Testing Comments - Create Comment ===")
        
        if not self.token or not self.post_id:
            self.log_test("Create Comment", False, "No token or post_id available")
            return False
            
        comment_data = {
            "text": "Great post!"
        }
        
        response = self.make_request("POST", f"/posts/{self.post_id}/comments", comment_data)
        
        if response is None:
            self.log_test("Create Comment", False, "Request failed - no response")
            return False
            
        if response.status_code == 200:
            data = response.json()
            if "id" in data and "text" in data:
                self.log_test("Create Comment", True, f"Comment created with ID: {data['id']}")
                return True
            else:
                self.log_test("Create Comment", False, "Invalid comment data in response")
                return False
        else:
            self.log_test("Create Comment", False, f"Status: {response.status_code}, Response: {response.text}")
            return False
    
    def test_get_comments(self):
        """Test getting comments"""
        print("\n=== Testing Comments - Get Comments ===")
        
        if not self.token or not self.post_id:
            self.log_test("Get Comments", False, "No token or post_id available")
            return False
            
        response = self.make_request("GET", f"/posts/{self.post_id}/comments")
        
        if response is None:
            self.log_test("Get Comments", False, "Request failed - no response")
            return False
            
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                self.log_test("Get Comments", True, f"Comments retrieved: {len(data)} comments")
                return True
            else:
                self.log_test("Get Comments", False, "Comments response is not a list")
                return False
        else:
            self.log_test("Get Comments", False, f"Status: {response.status_code}, Response: {response.text}")
            return False
    
    def test_save_post(self):
        """Test saving a post"""
        print("\n=== Testing Save - Save Post ===")
        
        if not self.token or not self.post_id:
            self.log_test("Save Post", False, "No token or post_id available")
            return False
            
        response = self.make_request("POST", f"/posts/{self.post_id}/save")
        
        if response is None:
            self.log_test("Save Post", False, "Request failed - no response")
            return False
            
        if response.status_code == 200:
            data = response.json()
            if "isSaved" in data:
                self.log_test("Save Post", True, f"Post save status: {data['isSaved']}")
                return True
            else:
                self.log_test("Save Post", False, "Invalid save response")
                return False
        else:
            self.log_test("Save Post", False, f"Status: {response.status_code}, Response: {response.text}")
            return False
    
    def test_get_saved_posts(self):
        """Test getting saved posts"""
        print("\n=== Testing Save - Get Saved Posts ===")
        
        if not self.token:
            self.log_test("Get Saved Posts", False, "No token available")
            return False
            
        response = self.make_request("GET", "/saved-posts")
        
        if response is None:
            self.log_test("Get Saved Posts", False, "Request failed - no response")
            return False
            
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                self.log_test("Get Saved Posts", True, f"Saved posts retrieved: {len(data)} posts")
                return True
            else:
                self.log_test("Get Saved Posts", False, "Saved posts response is not a list")
                return False
        else:
            self.log_test("Get Saved Posts", False, f"Status: {response.status_code}, Response: {response.text}")
            return False
    
    def test_create_story(self):
        """Test creating a story"""
        print("\n=== Testing Stories - Create Story ===")
        
        if not self.token:
            self.log_test("Create Story", False, "No token available")
            return False
            
        story_data = {
            "text": "Hello from my story!"
        }
        
        response = self.make_request("POST", "/stories", story_data)
        
        if response is None:
            self.log_test("Create Story", False, "Request failed - no response")
            return False
            
        if response.status_code == 200:
            data = response.json()
            if "id" in data and "text" in data:
                self.story_id = data["id"]
                self.log_test("Create Story", True, f"Story created with ID: {self.story_id}")
                return True
            else:
                self.log_test("Create Story", False, "Invalid story data in response")
                return False
        else:
            self.log_test("Create Story", False, f"Status: {response.status_code}, Response: {response.text}")
            return False
    
    def test_get_stories(self):
        """Test getting stories"""
        print("\n=== Testing Stories - Get Stories ===")
        
        if not self.token:
            self.log_test("Get Stories", False, "No token available")
            return False
            
        response = self.make_request("GET", "/stories")
        
        if response is None:
            self.log_test("Get Stories", False, "Request failed - no response")
            return False
            
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                self.log_test("Get Stories", True, f"Stories retrieved: {len(data)} stories")
                return True
            else:
                self.log_test("Get Stories", False, "Stories response is not a list")
                return False
        else:
            self.log_test("Get Stories", False, f"Status: {response.status_code}, Response: {response.text}")
            return False
    
    def test_get_explore(self):
        """Test getting explore feed"""
        print("\n=== Testing Explore - Get Explore Feed ===")
        
        if not self.token:
            self.log_test("Get Explore", False, "No token available")
            return False
            
        response = self.make_request("GET", "/explore")
        
        if response is None:
            self.log_test("Get Explore", False, "Request failed - no response")
            return False
            
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                self.log_test("Get Explore", True, f"Explore feed retrieved: {len(data)} posts")
                return True
            else:
                self.log_test("Get Explore", False, "Explore response is not a list")
                return False
        else:
            self.log_test("Get Explore", False, f"Status: {response.status_code}, Response: {response.text}")
            return False
    
    def run_all_tests(self):
        """Run all tests in sequence"""
        print(f"🚀 Starting Instagram Clone Backend API Tests")
        print(f"📡 Testing against: {self.base_url}")
        print(f"⏰ Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Authentication Tests
        if not self.test_auth_signup():
            print("❌ Signup failed - skipping remaining tests")
            return self.generate_summary()
            
        if not self.test_auth_login():
            print("❌ Login failed - skipping remaining tests")
            return self.generate_summary()
            
        self.test_auth_me()
        
        # Posts Tests
        self.test_create_post()
        self.test_get_feed()
        self.test_get_user_posts()
        
        # Reactions Tests
        self.test_react_to_post()
        
        # Comments Tests
        self.test_create_comment()
        self.test_get_comments()
        
        # Save Tests
        self.test_save_post()
        self.test_get_saved_posts()
        
        # Stories Tests
        self.test_create_story()
        self.test_get_stories()
        
        # Explore Tests
        self.test_get_explore()
        
        return self.generate_summary()
    
    def generate_summary(self):
        """Generate test summary"""
        print("\n" + "="*60)
        print("📊 TEST SUMMARY")
        print("="*60)
        
        passed = sum(1 for result in self.test_results if result["success"])
        failed = len(self.test_results) - passed
        
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"📈 Success Rate: {(passed/len(self.test_results)*100):.1f}%")
        
        if failed > 0:
            print("\n🔍 FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"   ❌ {result['test']}: {result['message']}")
        
        print(f"\n⏰ Completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        return {
            "total": len(self.test_results),
            "passed": passed,
            "failed": failed,
            "success_rate": passed/len(self.test_results)*100,
            "results": self.test_results
        }

def main():
    """Main function to run tests"""
    tester = InstagramAPITester()
    summary = tester.run_all_tests()
    
    # Exit with error code if tests failed
    if summary["failed"] > 0:
        sys.exit(1)
    else:
        sys.exit(0)

if __name__ == "__main__":
    main()