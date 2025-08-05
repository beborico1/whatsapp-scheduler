# WhatsApp Scheduler - API Documentation

## Table of Contents
- [Overview](#overview)
- [Base URL](#base-url)
- [Authentication](#authentication)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [API Endpoints](#api-endpoints)
  - [Messages API](#messages-api)
  - [Recipients API](#recipients-api)
  - [Groups API](#groups-api)
  - [Schedules API](#schedules-api)
  - [Health Check API](#health-check-api)
- [WebSocket Events](#websocket-events)
- [Webhooks](#webhooks)
- [API Examples](#api-examples)
- [SDKs & Client Libraries](#sdks--client-libraries)

## Overview

The WhatsApp Scheduler API is a RESTful service that enables scheduling and automation of WhatsApp messages. Built with FastAPI, it provides automatic request validation, interactive documentation, and high performance.

### API Features
- **RESTful Design**: Standard HTTP methods and status codes
- **JSON Format**: All requests and responses use JSON
- **Pagination**: Built-in pagination for list endpoints
- **Filtering**: Query parameters for filtering results
- **Validation**: Automatic request validation with detailed errors
- **Documentation**: Auto-generated OpenAPI/Swagger docs

## Base URL

```
Production: https://whatsapp-scheduler-production.up.railway.app/api
Development: http://localhost:8000/api
```

### Interactive Documentation

- **Swagger UI**: `/docs`
- **ReDoc**: `/redoc`
- **OpenAPI Schema**: `/openapi.json`

## Authentication

> **Note**: Authentication is not yet implemented in the current version. When implemented, it will use JWT tokens.

### Future Authentication Flow

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secure_password"
}
```

Response:
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

### Using Authentication Token

```http
GET /api/messages
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
```

## Error Handling

### Error Response Format

All errors follow a consistent format:

```json
{
  "detail": "Error message describing what went wrong",
  "status_code": 400,
  "error_code": "VALIDATION_ERROR",
  "errors": [
    {
      "field": "phone_number",
      "message": "Invalid phone number format",
      "code": "invalid_format"
    }
  ]
}
```

### HTTP Status Codes

| Status Code | Description |
|------------|-------------|
| 200 | Success - Request completed successfully |
| 201 | Created - Resource created successfully |
| 204 | No Content - Request successful, no content to return |
| 400 | Bad Request - Invalid request parameters |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource already exists |
| 422 | Unprocessable Entity - Validation error |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server error |

### Common Error Codes

| Error Code | Description |
|-----------|-------------|
| `VALIDATION_ERROR` | Request validation failed |
| `RESOURCE_NOT_FOUND` | Requested resource doesn't exist |
| `DUPLICATE_RESOURCE` | Resource already exists |
| `INVALID_PHONE_NUMBER` | Phone number format is invalid |
| `SCHEDULING_CONFLICT` | Message already scheduled for this time |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `WHATSAPP_API_ERROR` | WhatsApp API returned an error |

## Rate Limiting

Rate limits protect the API from abuse and ensure fair usage:

| Endpoint | Rate Limit | Window |
|----------|------------|--------|
| POST /api/schedules | 100 requests | 1 minute |
| GET endpoints | 1000 requests | 1 minute |
| PUT/DELETE endpoints | 100 requests | 1 minute |
| WhatsApp sending | 1000 messages | 1 hour |

Rate limit headers:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1672531200
Retry-After: 60
```

## API Endpoints

### Messages API

#### List Messages

```http
GET /api/messages
```

Query Parameters:
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `skip` | integer | Number of items to skip | 0 |
| `limit` | integer | Maximum items to return | 100 |
| `search` | string | Search in title and content | - |
| `sort_by` | string | Field to sort by | created_at |
| `sort_order` | string | Sort order (asc/desc) | desc |

Response:
```json
{
  "items": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "title": "Welcome Message",
      "content": "Hello! Welcome to our service.",
      "created_at": "2024-01-01T10:00:00Z",
      "updated_at": "2024-01-01T10:00:00Z"
    }
  ],
  "total": 50,
  "page": 1,
  "pages": 5,
  "per_page": 10
}
```

#### Create Message

```http
POST /api/messages
Content-Type: application/json

{
  "title": "Welcome Message",
  "content": "Hello {{name}}! Welcome to our service."
}
```

Request Body:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | Yes | Message title (1-255 chars) |
| `content` | string | Yes | Message content (1-5000 chars) |

Response (201 Created):
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "title": "Welcome Message",
  "content": "Hello {{name}}! Welcome to our service.",
  "created_at": "2024-01-01T10:00:00Z",
  "updated_at": "2024-01-01T10:00:00Z"
}
```

#### Get Message

```http
GET /api/messages/{message_id}
```

Response:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "title": "Welcome Message",
  "content": "Hello {{name}}! Welcome to our service.",
  "created_at": "2024-01-01T10:00:00Z",
  "updated_at": "2024-01-01T10:00:00Z",
  "scheduled_count": 5,
  "sent_count": 3
}
```

#### Update Message

```http
PUT /api/messages/{message_id}
Content-Type: application/json

{
  "title": "Updated Welcome Message",
  "content": "Hi {{name}}! Welcome aboard!"
}
```

Response:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "title": "Updated Welcome Message",
  "content": "Hi {{name}}! Welcome aboard!",
  "created_at": "2024-01-01T10:00:00Z",
  "updated_at": "2024-01-01T11:00:00Z"
}
```

#### Delete Message

```http
DELETE /api/messages/{message_id}
```

Response (204 No Content)

### Recipients API

#### List Recipients

```http
GET /api/recipients
```

Query Parameters:
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `skip` | integer | Number of items to skip | 0 |
| `limit` | integer | Maximum items to return | 100 |
| `search` | string | Search in name and phone | - |
| `group_id` | string | Filter by group ID | - |

Response:
```json
{
  "items": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174001",
      "name": "John Doe",
      "phone_number": "+1234567890",
      "created_at": "2024-01-01T10:00:00Z",
      "groups": [
        {
          "id": "123e4567-e89b-12d3-a456-426614174002",
          "name": "VIP Customers"
        }
      ]
    }
  ],
  "total": 150,
  "page": 1,
  "pages": 15,
  "per_page": 10
}
```

#### Create Recipient

```http
POST /api/recipients
Content-Type: application/json

{
  "name": "John Doe",
  "phone_number": "+1234567890",
  "group_ids": ["123e4567-e89b-12d3-a456-426614174002"]
}
```

Request Body:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Recipient name (1-100 chars) |
| `phone_number` | string | Yes | Phone number with country code |
| `group_ids` | array | No | List of group IDs to assign |

Response (201 Created):
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174001",
  "name": "John Doe",
  "phone_number": "+1234567890",
  "created_at": "2024-01-01T10:00:00Z",
  "groups": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174002",
      "name": "VIP Customers"
    }
  ]
}
```

#### Get Recipient

```http
GET /api/recipients/{recipient_id}
```

Response:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174001",
  "name": "John Doe",
  "phone_number": "+1234567890",
  "created_at": "2024-01-01T10:00:00Z",
  "groups": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174002",
      "name": "VIP Customers",
      "description": "Our most valued customers"
    }
  ],
  "message_count": 10,
  "last_message_date": "2024-01-15T14:30:00Z"
}
```

#### Delete Recipient

```http
DELETE /api/recipients/{recipient_id}
```

Response (204 No Content)

### Groups API

#### List Groups

```http
GET /api/recipients/groups
```

Query Parameters:
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `skip` | integer | Number of items to skip | 0 |
| `limit` | integer | Maximum items to return | 100 |
| `include_recipients` | boolean | Include recipient details | false |

Response:
```json
{
  "items": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174002",
      "name": "VIP Customers",
      "description": "Our most valued customers",
      "created_at": "2024-01-01T10:00:00Z",
      "recipient_count": 25,
      "recipients": []  // Populated if include_recipients=true
    }
  ],
  "total": 10,
  "page": 1,
  "pages": 1,
  "per_page": 100
}
```

#### Create Group

```http
POST /api/recipients/groups
Content-Type: application/json

{
  "name": "New Customers",
  "description": "Customers who joined this month",
  "recipient_ids": [
    "123e4567-e89b-12d3-a456-426614174001",
    "123e4567-e89b-12d3-a456-426614174003"
  ]
}
```

Request Body:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Group name (1-100 chars) |
| `description` | string | No | Group description (max 500 chars) |
| `recipient_ids` | array | No | Initial recipients to add |

Response (201 Created):
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174004",
  "name": "New Customers",
  "description": "Customers who joined this month",
  "created_at": "2024-01-01T10:00:00Z",
  "recipient_count": 2
}
```

#### Get Group

```http
GET /api/recipients/groups/{group_id}
```

Response:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174002",
  "name": "VIP Customers",
  "description": "Our most valued customers",
  "created_at": "2024-01-01T10:00:00Z",
  "recipients": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174001",
      "name": "John Doe",
      "phone_number": "+1234567890"
    }
  ],
  "scheduled_messages": 5,
  "sent_messages": 20
}
```

#### Update Group Recipients

```http
PUT /api/recipients/groups/{group_id}/recipients
Content-Type: application/json

{
  "recipient_ids": [
    "123e4567-e89b-12d3-a456-426614174001",
    "123e4567-e89b-12d3-a456-426614174003",
    "123e4567-e89b-12d3-a456-426614174005"
  ]
}
```

This replaces all recipients in the group with the provided list.

Response:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174002",
  "name": "VIP Customers",
  "recipient_count": 3,
  "updated_at": "2024-01-01T11:00:00Z"
}
```

#### Delete Group

```http
DELETE /api/recipients/groups/{group_id}
```

Response (204 No Content)

### Schedules API

#### List Scheduled Messages

```http
GET /api/schedules
```

Query Parameters:
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `skip` | integer | Number of items to skip | 0 |
| `limit` | integer | Maximum items to return | 100 |
| `status` | string | Filter by status (pending/processing/sent/failed/cancelled/archived) | - |
| `from_date` | datetime | Filter messages scheduled after this date | - |
| `to_date` | datetime | Filter messages scheduled before this date | - |
| `message_id` | string | Filter by message ID | - |
| `group_id` | string | Filter by group ID | - |

Response:
```json
{
  "items": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174005",
      "message": {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "title": "Welcome Message",
        "content": "Hello! Welcome to our service."
      },
      "group": {
        "id": "123e4567-e89b-12d3-a456-426614174002",
        "name": "VIP Customers",
        "recipient_count": 25
      },
      "scheduled_time": "2024-01-02T15:00:00Z",
      "status": "pending",
      "created_at": "2024-01-01T10:00:00Z",
      "sent_at": null,
      "error_message": null,
      "recipient_count": 25,
      "sent_count": 0,
      "failed_count": 0
    }
  ],
  "total": 30,
  "page": 1,
  "pages": 3,
  "per_page": 10
}
```

#### Schedule Message

```http
POST /api/schedules
Content-Type: application/json

{
  "message_id": "123e4567-e89b-12d3-a456-426614174000",
  "group_id": "123e4567-e89b-12d3-a456-426614174002",
  "scheduled_time": "2024-01-02T15:00:00Z"
}
```

Request Body:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `message_id` | string | Yes | ID of the message to send |
| `group_id` | string | Yes | ID of the recipient group |
| `scheduled_time` | datetime | Yes | When to send the message (ISO 8601) |

Response (201 Created):
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174005",
  "message": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "title": "Welcome Message"
  },
  "group": {
    "id": "123e4567-e89b-12d3-a456-426614174002",
    "name": "VIP Customers"
  },
  "scheduled_time": "2024-01-02T15:00:00Z",
  "status": "pending",
  "created_at": "2024-01-01T10:00:00Z",
  "task_id": "celery-task-123",
  "recipient_count": 25
}
```

#### Get Scheduled Message

```http
GET /api/schedules/{schedule_id}
```

Response:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174005",
  "message": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "title": "Welcome Message",
    "content": "Hello! Welcome to our service."
  },
  "group": {
    "id": "123e4567-e89b-12d3-a456-426614174002",
    "name": "VIP Customers",
    "recipients": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174001",
        "name": "John Doe",
        "phone_number": "+1234567890",
        "status": "sent",
        "sent_at": "2024-01-02T15:00:30Z"
      }
    ]
  },
  "scheduled_time": "2024-01-02T15:00:00Z",
  "status": "sent",
  "created_at": "2024-01-01T10:00:00Z",
  "sent_at": "2024-01-02T15:00:35Z",
  "task_id": "celery-task-123",
  "processing_time": 35,
  "recipient_count": 25,
  "sent_count": 25,
  "failed_count": 0
}
```

#### Cancel Scheduled Message

```http
PUT /api/schedules/{schedule_id}/cancel
```

Only pending messages can be cancelled.

Response:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174005",
  "status": "cancelled",
  "cancelled_at": "2024-01-01T11:00:00Z",
  "cancelled_by": "user@example.com"
}
```

#### Send Message Immediately

```http
POST /api/schedules/{schedule_id}/send-now
```

Immediately sends a pending scheduled message.

Response:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174005",
  "status": "processing",
  "task_id": "celery-task-124",
  "processing_started_at": "2024-01-01T11:00:00Z"
}
```

#### Archive Scheduled Message

```http
PUT /api/schedules/{schedule_id}/archive
```

Archives a completed or cancelled message.

Response:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174005",
  "status": "archived",
  "archived_at": "2024-01-01T11:00:00Z"
}
```

#### Delete Scheduled Message

```http
DELETE /api/schedules/{schedule_id}
```

Only cancelled or failed messages can be deleted.

Response (204 No Content)

### Health Check API

#### Basic Health Check

```http
GET /health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T10:00:00Z",
  "version": "1.0.0"
}
```

#### Database Health Check

```http
GET /health/db
```

Response:
```json
{
  "status": "healthy",
  "database": "postgresql",
  "connection_pool": {
    "size": 20,
    "checked_in": 18,
    "checked_out": 2,
    "overflow": 0
  }
}
```

#### Redis Health Check

```http
GET /health/redis
```

Response:
```json
{
  "status": "healthy",
  "redis_version": "7.0.5",
  "connected_clients": 5,
  "used_memory": "15.2MB",
  "uptime_days": 45
}
```

#### Celery Health Check

```http
GET /health/celery
```

Response:
```json
{
  "status": "healthy",
  "workers": 3,
  "active_tasks": 2,
  "queued_tasks": 10,
  "worker_details": [
    {
      "name": "worker-1",
      "status": "online",
      "current_task": "send_whatsapp_message",
      "processed": 1250
    }
  ]
}
```

#### Detailed Health Check

```http
GET /health/detailed
```

Combines all health checks into one response:

```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T10:00:00Z",
  "services": {
    "api": {
      "status": "healthy",
      "uptime": "5d 12h 30m",
      "requests_per_minute": 150
    },
    "database": {
      "status": "healthy",
      "connection_pool": "18/20",
      "response_time": "5ms"
    },
    "redis": {
      "status": "healthy",
      "memory_usage": "15.2MB",
      "queue_depth": 10
    },
    "celery": {
      "status": "healthy",
      "workers": 3,
      "active_tasks": 2
    }
  }
}
```

## WebSocket Events

> **Note**: WebSocket support is planned for real-time updates.

### Connection

```javascript
const ws = new WebSocket('wss://api.example.com/ws');

ws.onopen = () => {
  // Authenticate
  ws.send(JSON.stringify({
    type: 'auth',
    token: 'your-jwt-token'
  }));
};
```

### Event Types

| Event | Description | Payload |
|-------|-------------|---------|
| `message.scheduled` | New message scheduled | Schedule object |
| `message.processing` | Message processing started | `{schedule_id, started_at}` |
| `message.sent` | Message sent successfully | `{schedule_id, recipient_id, sent_at}` |
| `message.failed` | Message sending failed | `{schedule_id, recipient_id, error}` |
| `message.completed` | All messages sent | `{schedule_id, stats}` |

## Webhooks

### Webhook Configuration

```http
POST /api/webhooks
Content-Type: application/json

{
  "url": "https://your-app.com/webhooks/whatsapp",
  "events": ["message.sent", "message.failed"],
  "secret": "your-webhook-secret"
}
```

### Webhook Payload

```json
{
  "event": "message.sent",
  "timestamp": "2024-01-01T10:00:00Z",
  "data": {
    "schedule_id": "123e4567-e89b-12d3-a456-426614174005",
    "recipient_id": "123e4567-e89b-12d3-a456-426614174001",
    "message_id": "whatsapp-message-id",
    "sent_at": "2024-01-01T10:00:00Z"
  }
}
```

### Webhook Security

Verify webhook signatures:

```python
import hmac
import hashlib

def verify_webhook(payload: bytes, signature: str, secret: str) -> bool:
    expected = hmac.new(
        secret.encode(),
        payload,
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature)
```

## API Examples

### Complete Workflow Example

#### 1. Create a Message Template

```bash
curl -X POST https://api.example.com/api/messages \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Holiday Greeting",
    "content": "Happy holidays {{name}}! Enjoy 20% off your next purchase."
  }'
```

#### 2. Create a Recipient Group

```bash
curl -X POST https://api.example.com/api/recipients/groups \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Holiday Campaign",
    "description": "Recipients for holiday promotion"
  }'
```

#### 3. Add Recipients

```bash
curl -X POST https://api.example.com/api/recipients \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Smith",
    "phone_number": "+1234567890",
    "group_ids": ["group-id-here"]
  }'
```

#### 4. Schedule the Message

```bash
curl -X POST https://api.example.com/api/schedules \
  -H "Content-Type: application/json" \
  -d '{
    "message_id": "message-id-here",
    "group_id": "group-id-here",
    "scheduled_time": "2024-12-25T09:00:00Z"
  }'
```

#### 5. Check Status

```bash
curl https://api.example.com/api/schedules/schedule-id-here
```

### Bulk Import Example

```python
import requests
import csv

# Read recipients from CSV
with open('recipients.csv', 'r') as file:
    reader = csv.DictReader(file)
    
    for row in reader:
        # Create recipient
        response = requests.post(
            'https://api.example.com/api/recipients',
            json={
                'name': row['name'],
                'phone_number': row['phone'],
                'group_ids': ['group-id-here']
            }
        )
        
        if response.status_code == 201:
            print(f"Created: {row['name']}")
        else:
            print(f"Failed: {row['name']} - {response.json()}")
```

### Pagination Example

```javascript
async function getAllMessages() {
  const messages = [];
  let page = 1;
  let hasMore = true;
  
  while (hasMore) {
    const response = await fetch(
      `https://api.example.com/api/messages?page=${page}&per_page=100`
    );
    const data = await response.json();
    
    messages.push(...data.items);
    hasMore = page < data.pages;
    page++;
  }
  
  return messages;
}
```

## SDKs & Client Libraries

### Python SDK

```python
from whatsapp_scheduler import Client

client = Client(
    base_url="https://api.example.com",
    api_key="your-api-key"
)

# Create a message
message = client.messages.create(
    title="Welcome",
    content="Hello {{name}}!"
)

# Schedule it
schedule = client.schedules.create(
    message_id=message.id,
    group_id="group-id",
    scheduled_time="2024-01-01T10:00:00Z"
)

# Check status
status = client.schedules.get(schedule.id)
print(f"Status: {status.status}")
```

### JavaScript/TypeScript SDK

```typescript
import { WhatsAppScheduler } from '@whatsapp-scheduler/sdk';

const client = new WhatsAppScheduler({
  baseURL: 'https://api.example.com',
  apiKey: 'your-api-key'
});

// Create and schedule a message
async function scheduleMessage() {
  // Create message
  const message = await client.messages.create({
    title: 'Welcome',
    content: 'Hello {{name}}!'
  });
  
  // Create group
  const group = await client.groups.create({
    name: 'New Users',
    recipientIds: ['recipient-1', 'recipient-2']
  });
  
  // Schedule
  const schedule = await client.schedules.create({
    messageId: message.id,
    groupId: group.id,
    scheduledTime: new Date('2024-01-01T10:00:00Z')
  });
  
  console.log(`Scheduled with ID: ${schedule.id}`);
}
```

### API Client Generation

Generate clients from OpenAPI spec:

```bash
# Generate Python client
openapi-generator generate -i https://api.example.com/openapi.json \
  -g python -o ./python-client

# Generate TypeScript client
openapi-generator generate -i https://api.example.com/openapi.json \
  -g typescript-axios -o ./ts-client

# Generate Go client
openapi-generator generate -i https://api.example.com/openapi.json \
  -g go -o ./go-client
```

## Testing the API

### Using cURL

```bash
# Test health endpoint
curl https://api.example.com/health

# Create a message
curl -X POST https://api.example.com/api/messages \
  -H "Content-Type: application/json" \
  -d '{"title": "Test", "content": "Hello World"}'
```

### Using Postman

1. Import the OpenAPI spec from `/openapi.json`
2. Set base URL in environment variables
3. Add authentication headers if required
4. Use the generated collection

### Using HTTPie

```bash
# Install HTTPie
pip install httpie

# Test endpoints
http GET api.example.com/health
http POST api.example.com/api/messages title="Test" content="Hello"
```