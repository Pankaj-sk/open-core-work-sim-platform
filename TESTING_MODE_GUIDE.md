# Testing Configuration Guide

## 🧪 TESTING_MODE Enabled

The application is currently running in **TESTING_MODE** which provides the following benefits for testing:

### ✅ **Authentication Bypassed**
- All protected endpoints can be accessed without login
- Mock user data is automatically provided:
  ```json
  {
    "id": 1,
    "username": "test_user",
    "email": "test@example.com",
    "full_name": "Test User",
    "role": "user"
  }
  ```

### ✅ **Simplified API Testing**
You can now test endpoints directly without authentication:

```bash
# Test health endpoint
curl http://localhost:8000/health

# Test project creation (no auth required in testing mode)
curl -X POST http://localhost:8000/api/v1/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Project",
    "description": "A test project",
    "user_role": "senior_developer",
    "team_size": 5,
    "project_type": "web_development"
  }'

# Test agents endpoint
curl http://localhost:8000/api/v1/agents

# Test chat with agent
curl -X POST http://localhost:8000/api/v1/agents/sarah_manager/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, how are you?"}'
```

### ✅ **Input Validation Still Active**
Even in testing mode, input validation is still enforced:
- Project names must be 3-200 characters
- Team size must be 2-20 members
- Project types must be valid enum values

### ⚠️ **Important Security Note**
**TESTING_MODE is currently ENABLED** in `core/api.py`. 

**Before deploying to production:**
1. Set `TESTING_MODE = False` in `core/api.py`
2. This will re-enable proper authentication
3. All endpoints will require valid session tokens

### 🚀 **Frontend Testing**
The frontend can now connect to the backend without authentication issues. The React app should be able to:
- Fetch data from all endpoints
- Create projects
- Chat with agents
- Display project lists

### 🧪 **Running Tests**
```bash
# Run all tests
python -m pytest test_comprehensive.py -v

# Run specific test categories
python -m pytest test_comprehensive.py::TestAPIEndpoints -v
python -m pytest test_comprehensive.py::TestInputValidation -v
python -m pytest test_comprehensive.py::TestProjects -v
```
