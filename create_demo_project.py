# Simple script to create a demo project in the backend for testing
import requests
import json

# Backend URL
BASE_URL = "http://localhost:8000/api/v1"

# Demo project data
demo_project = {
    "name": "Career Development Project",
    "description": "Practice workplace skills through AI-powered simulation",
    "user_role": "team_member",
    "team_size": 3,
    "project_type": "web_development"
}

def create_demo_project():
    try:
        # First try to get the project to see if it exists
        response = requests.get(f"{BASE_URL}/projects/demo-project-1")
        if response.status_code == 200:
            print("Demo project already exists!")
            return
    except:
        pass
    
    # Create the project
    try:
        response = requests.post(f"{BASE_URL}/projects", json=demo_project)
        if response.status_code == 200:
            print("Demo project created successfully!")
            print(json.dumps(response.json(), indent=2))
        else:
            print(f"Failed to create project: {response.status_code}")
            print(response.text)
    except Exception as e:
        print(f"Error creating demo project: {e}")

if __name__ == "__main__":
    create_demo_project()
