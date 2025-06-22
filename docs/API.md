# API Documentation

## Overview

The Work Simulation Platform API provides endpoints for managing AI agents, simulations, and artifacts.

## Base URL

- **Development**: `http://localhost:8000`
- **Production**: `https://api.worksimplatform.com`

## Authentication

Currently, the API uses no authentication for development. Production deployments should implement JWT tokens.

## Endpoints

### Health Check

```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "components": ["agents", "simulation", "events", "artifacts"]
}
```

### Agents

#### Get All Agents

```http
GET /api/v1/agents
```

**Response:**
```json
{
  "agents": [
    {
      "id": "manager_001",
      "name": "Sarah Johnson",
      "role": "Team Manager",
      "is_available": true
    }
  ]
}
```

#### Get Agent Details

```http
GET /api/v1/agents/{agent_id}
```

#### Chat with Agent

```http
POST /api/v1/agents/{agent_id}/chat
Content-Type: application/json

{
  "message": "Hello, how are you?"
}
```

#### Get Chat History

```http
GET /api/v1/agents/{agent_id}/history
```

### Simulations

#### Get Scenarios

```http
GET /api/v1/simulations/scenarios
```

#### Start Simulation

```http
POST /api/v1/simulations/start
Content-Type: application/json

{
  "scenario_id": "team_meeting",
  "participants": ["manager", "developer"],
  "duration_minutes": 30,
  "difficulty": "medium"
}
```

#### Get Simulation Details

```http
GET /api/v1/simulations/{simulation_id}
```

#### End Simulation

```http
POST /api/v1/simulations/{simulation_id}/end
```

### Artifacts

#### Get Templates

```http
GET /api/v1/artifacts/templates
```

#### Generate Artifact

```http
POST /api/v1/artifacts/generate
Content-Type: application/json

{
  "template_id": "meeting_minutes",
  "data": {
    "participants": ["John", "Jane"],
    "agenda": ["Item 1", "Item 2"],
    "decisions": ["Decision 1"],
    "action_items": ["Action 1"]
  },
  "simulation_id": "optional-simulation-id"
}
```

#### Get Artifact

```http
GET /api/v1/artifacts/{artifact_id}
```

## Error Handling

All endpoints return appropriate HTTP status codes:

- `200`: Success
- `400`: Bad Request
- `404`: Not Found
- `500`: Internal Server Error

Error responses include a `detail` field with the error message.

## Rate Limiting

Currently, no rate limiting is implemented. Production deployments should add rate limiting.

## SDKs

- **JavaScript/TypeScript**: Available in `frontend/src/services/api.ts`
- **Python**: Use the `requests` library with the endpoints above
- **cURL**: All endpoints support cURL requests

## Examples

### Start a Team Meeting Simulation

```bash
curl -X POST "http://localhost:8000/api/v1/simulations/start" \
  -H "Content-Type: application/json" \
  -d '{
    "scenario_id": "team_meeting",
    "participants": ["manager", "developer", "designer"],
    "duration_minutes": 45,
    "difficulty": "medium"
  }'
```

### Chat with a Manager

```bash
curl -X POST "http://localhost:8000/api/v1/agents/manager_001/chat" \
  -H "Content-Type: application/json" \
  -d '{"message": "What should we focus on in this sprint?"}'
```

### Generate Meeting Minutes

```bash
curl -X POST "http://localhost:8000/api/v1/artifacts/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "template_id": "meeting_minutes",
    "data": {
      "participants": ["Sarah", "Alex", "Mike"],
      "agenda": ["Sprint Planning", "Technical Debt"],
      "decisions": ["Use React for frontend", "Refactor legacy code"],
      "action_items": ["Set up CI/CD", "Code review process"]
    }
  }'
``` 