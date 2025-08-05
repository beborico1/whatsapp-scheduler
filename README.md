# 🚀 WhatsApp Scheduler - The Ultimate Messaging Automation Platform

<div align="center">
  
  ### 🌐 [**LIVE DEMO**](https://whatsapp-scheduler-production.up.railway.app/) | [**API DOCS**](https://whatsapp-scheduler-production.up.railway.app/docs)
  
  <img src="frontend/public/logo.png" alt="WhatsApp Scheduler Logo" width="200"/>
  
  **Schedule. Automate. Deliver.**
  
  ***Built for Baltra's Technical Assessment***
  
  [![FastAPI](https://img.shields.io/badge/FastAPI-0.104.1-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
  [![React](https://img.shields.io/badge/React-19.1.1-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-4.9.5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![Celery](https://img.shields.io/badge/Celery-5.3.4-37814A?style=for-the-badge&logo=celery&logoColor=white)](https://docs.celeryproject.org/)
  [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
  [![Redis](https://img.shields.io/badge/Redis-7.0-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
  [![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
</div>

---

## 📚 Documentation

### Core Documentation
- 🏛️ **[Architecture](docs/ARCHITECTURE.md)** - System design and component architecture
- 🚀 **[Performance](docs/PERFORMANCE.md)** - Benchmarks and optimization strategies
- 🔒 **[Security](docs/SECURITY.md)** - Security measures and best practices
- 📡 **[API Reference](docs/API.md)** - Complete API documentation

### Getting Started
- 📖 **[Setup Guide](docs/SETUP_GUIDE.md)** - Installation and configuration instructions
- 🔬 **[Technology Deep Dive](docs/TECH_DIVE.md)** - In-depth explanation of technologies used

---

## 🌟 Overview

**WhatsApp Scheduler** is a sophisticated, production-ready messaging automation platform that empowers businesses to schedule and manage WhatsApp messages at scale. Built with modern technologies and a microservices architecture, it combines the power of FastAPI, React, and Celery to deliver a seamless messaging experience.

> 📋 **Note**: This project was developed as part of **Baltra's Technical Assessment** for the Senior Founding Engineer role, demonstrating full-stack capabilities, system design, and WhatsApp API integration expertise.

### 🎯 Key Features

- **📅 Advanced Scheduling**: Schedule messages for any future date and time with timezone support
- **👥 Group Management**: Organize recipients into groups for bulk messaging campaigns
- **💬 Message Templates**: Create and manage reusable message templates
- **🌍 Multi-language Support**: Full internationalization (English & Spanish)
- **🔄 Real-time Status Updates**: Track message delivery status in real-time
- **📱 Responsive Design**: Beautiful, mobile-first UI that works on any device
- **🚀 High Performance**: Asynchronous task processing with Celery for scalability
- **🔒 Enterprise Ready**: Production-grade error handling and monitoring

---

## 🏗️ Architecture

### System Architecture

![Railway Architecture](docs/assets/railway-architecture.png)

```mermaid
graph TB
    subgraph "Frontend"
        A[React TypeScript App]
        B[Responsive UI Components]
        C[API Service Layer]
    end
    
    subgraph "Backend Services"
        D[FastAPI Server]
        E[Celery Workers]
        F[Celery Beat Scheduler]
    end
    
    subgraph "Data Layer"
        G[(PostgreSQL)]
        H[(Redis)]
    end
    
    subgraph "External Services"
        I[WhatsApp Business API]
    end
    
    A --> C
    C --> D
    D --> G
    D --> H
    E --> G
    E --> H
    E --> I
    F --> H
    B --> A
```

### Component Overview

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Frontend** | React 19.1.1 + TypeScript | Modern, responsive user interface |
| **API Server** | FastAPI 0.104.1 | High-performance REST API |
| **Task Queue** | Celery 5.3.4 | Asynchronous message processing |
| **Database** | PostgreSQL 15 | Persistent data storage |
| **Cache/Broker** | Redis 7.0 | Message broker & caching |
| **Container** | Docker | Consistent deployment environment |

---

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- WhatsApp Business API credentials
- Node.js 18+ (for local development)
- Python 3.11+ (for local development)

### 🐳 Docker Deployment (Recommended)

1. **Clone the repository**
   ```bash
   git clone https://github.com/beborico1/whatsapp-scheduler.git
   cd whatsapp-scheduler
   ```

2. **Configure environment variables**
   ```bash
   # Backend configuration
   cd backend
   cp .env.example .env
   # Edit .env with your WhatsApp API credentials
   ```

3. **Start the application**
   ```bash
   docker-compose up -d
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - API Documentation: http://localhost:8000/api/docs

### 🛠️ Local Development Setup

<details>
<summary>Click to expand local setup instructions</summary>

#### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations
alembic upgrade head

# Start the API server
uvicorn main:app --reload

# In separate terminals:
# Start Celery worker
celery -A app.celery_app worker --loglevel=info

# Start Celery beat
celery -A app.celery_app beat --loglevel=info
```

#### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

</details>

---

## 📋 Features Deep Dive

### 📱 User Interface

The application features a clean, intuitive interface with four main sections:

1. **Schedule Messages** - Create and schedule new messages
2. **Message Management** - Create, edit, and organize message templates
3. **Recipient Management** - Manage contacts and groups
4. **Scheduled Messages** - Monitor and manage scheduled messages

### 🔄 Workflow

1. **Create Recipients**: Add individual contacts with phone numbers
2. **Organize Groups**: Group recipients for bulk messaging
3. **Compose Messages**: Create reusable message templates
4. **Schedule Delivery**: Select message, group, and delivery time
5. **Monitor Status**: Track delivery status in real-time

### 🌐 Internationalization

Full support for multiple languages with easy switching between:
- 🇺🇸 English
- 🇪🇸 Spanish

---

## 🧰 Technology Stack Explained

### Backend Technologies

#### **FastAPI** 
- **Why**: Modern, fast web framework with automatic API documentation
- **Benefits**: Type hints, async support, automatic validation, OpenAPI/Swagger integration

#### **Celery**
- **What**: Distributed task queue for handling asynchronous jobs
- **Why**: Reliable message delivery, retry mechanisms, scheduled tasks
- **Components**:
  - **Worker**: Processes queued tasks (sending messages)
  - **Beat**: Schedules periodic tasks (checking for due messages)

#### **SQLAlchemy + Alembic**
- **Why**: Powerful ORM with migration support
- **Benefits**: Database agnostic, type safety, version control for schema

#### **PostgreSQL**
- **Why**: Robust, ACID-compliant relational database
- **Benefits**: JSON support, full-text search, proven reliability

#### **Redis**
- **Why**: In-memory data store for caching and message broker
- **Benefits**: High performance, pub/sub support, persistence options

### Frontend Technologies

#### **React 19**
- **Why**: Industry-standard UI library with huge ecosystem
- **Benefits**: Component reusability, virtual DOM, strong community

#### **TypeScript**
- **Why**: Type safety and better developer experience
- **Benefits**: Catch errors early, better IDE support, self-documenting code

#### **React Router**
- **Why**: Declarative routing for single-page applications
- **Benefits**: Dynamic routing, lazy loading, navigation guards

#### **Axios**
- **Why**: Promise-based HTTP client
- **Benefits**: Interceptors, request/response transformation, wide browser support

#### **date-fns**
- **Why**: Modern JavaScript date utility library
- **Benefits**: Tree-shakeable, immutable, comprehensive formatting

---

## 🚢 Deployment Options

### 🚄 Railway Deployment

The project includes Railway-specific configuration files:

- `railway.json` - General Railway configuration
- `railway-beat.toml` - Celery Beat scheduler configuration
- `railway-worker.toml` - Celery Worker configuration

Railway provides:
- Automatic deployments from GitHub
- Built-in PostgreSQL and Redis
- Easy environment variable management
- Horizontal scaling capabilities

### 🔲 Render Deployment

Configuration in `render.yaml` includes:
- Web service for backend API
- Worker service for Celery
- Cron job for Celery Beat
- Static site for frontend
- Managed PostgreSQL database

### 🐳 Docker Deployment

Full Docker support with:
- Multi-stage builds for optimization
- Non-root user for security
- Health checks for reliability
- Volume mounts for development

### ☁️ Other Platforms

Also configured for:
- **Heroku** (`Procfile`, `app.json`)
- **Google Cloud Run** (`cloudbuild.yaml`, `app.yaml`)
- **Vercel** (`vercel.json`) - Frontend only

---

## 📁 Project Structure

```
whatsapp-scheduler/
├── backend/                    # FastAPI Backend
│   ├── app/                   # Application code
│   │   ├── api/              # API endpoints
│   │   ├── models/           # SQLAlchemy models
│   │   ├── services/         # Business logic
│   │   └── tasks/            # Celery tasks
│   ├── alembic/              # Database migrations
│   ├── requirements.txt      # Python dependencies
│   └── Dockerfile           # Backend container
│
├── frontend/                  # React Frontend
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── contexts/         # React contexts
│   │   ├── services/         # API services
│   │   └── utils/           # Utility functions
│   ├── public/              # Static assets
│   ├── package.json         # Node dependencies
│   └── Dockerfile          # Frontend container
│
├── docker-compose.yml        # Local development
├── railway.json             # Railway configuration
├── render.yaml             # Render configuration
└── README.md              # You are here! 
```

---

## 🔧 Configuration

### Environment Variables

#### Backend (.env)

```env
# Database
DATABASE_URL=postgresql://user:password@localhost/whatsapp_scheduler

# Redis
REDIS_URL=redis://localhost:6379/0

# Security
SECRET_KEY=your-secret-key-here

# WhatsApp API
WHATSAPP_ACCESS_TOKEN=your-access-token
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
WHATSAPP_API_VERSION=v18.0
```

#### Frontend

Frontend configuration is handled through environment variables at build time:
- `REACT_APP_API_URL` - Backend API URL (defaults to relative path)

---

## 🧪 API Documentation

Once running, access the interactive API documentation:

- **Swagger UI**: http://localhost:8000/api/docs
- **ReDoc**: http://localhost:8000/api/redoc

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/messages` | List all messages |
| POST | `/api/messages` | Create new message |
| GET | `/api/recipients` | List all recipients |
| POST | `/api/recipients` | Create new recipient |
| GET | `/api/groups` | List all groups |
| POST | `/api/schedules` | Schedule a message |
| GET | `/api/schedules` | List scheduled messages |

---

## 🔒 Security Considerations

- **Authentication**: Ready for JWT implementation
- **CORS**: Configurable origins
- **Input Validation**: Pydantic models for all inputs
- **SQL Injection**: Protected by SQLAlchemy ORM
- **Environment Variables**: Sensitive data kept in .env files
- **Docker Security**: Non-root user, minimal base images

---

## 📈 Performance & Scalability

### Optimization Strategies

1. **Async Operations**: FastAPI's async support for I/O operations
2. **Connection Pooling**: SQLAlchemy connection pool for database
3. **Task Distribution**: Celery for distributed task processing
4. **Caching**: Redis for frequently accessed data
5. **Pagination**: Built-in pagination for large datasets

### Scaling Options

- **Horizontal Scaling**: Add more Celery workers
- **Database Scaling**: PostgreSQL read replicas
- **Caching Layer**: Redis cluster for high availability
- **Load Balancing**: Nginx or cloud load balancers

---

## 🎯 Future Enhancements

From the project's todo list:

- ✅ **User Authentication**: Multi-tenant support with role-based access
- ✅ **Message Templates**: Variables and dynamic content
- ✅ **Bulk Import**: CSV/Excel recipient import
- ✅ **Analytics Dashboard**: Delivery rates, engagement metrics
- ✅ **Rich Media**: Support for images, documents, videos
- ✅ **Webhooks**: Real-time delivery notifications
- ✅ **A/B Testing**: Test different message variations
- ✅ **Rate Limiting**: Comply with WhatsApp rate limits
- ✅ **Two-way Messaging**: Receive and respond to messages

### Development Guidelines

- Follow PEP 8 for Python code
- Use ESLint configuration for TypeScript/JavaScript
- Write tests for new features
- Update documentation as needed

---

## 🚀 Deployment Readiness

### Health Check Endpoints

The application includes comprehensive health check endpoints for monitoring and orchestration:

| Endpoint | Service | Description |
|----------|---------|-------------|
| `GET /health` | Backend API | Basic health check for API server |
| `GET /health/db` | Backend API | Database connectivity check |
| `GET /health/redis` | Backend API | Redis connectivity check |
| `GET /health/celery` | Backend API | Celery worker status check |
| `GET /health/detailed` | Backend API | Combined health status of all services |

#### Example Health Check Response

```json
{
  "status": "healthy",
  "timestamp": "2024-01-05T12:00:00Z",
  "services": {
    "api": "healthy",
    "database": "healthy",
    "redis": "healthy",
    "celery": {
      "workers": 2,
      "status": "healthy"
    }
  }
}
```

#### Container Health Checks

Docker Compose configuration includes health checks:

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

These endpoints enable:
- **Kubernetes/Docker** readiness and liveness probes
- **Load balancer** health monitoring
- **Monitoring tools** integration (Prometheus, Datadog, etc.)
- **Automated deployment** validation

---

## 🎓 Baltra Technical Assessment

This project was built for **Baltra's Technical Assessment**:

### ✅ Core Requirements
- ✅ WhatsApp Business API integration with test numbers
- ✅ Python backend with FastAPI
- ✅ React frontend with TypeScript
- ✅ Message scheduling with Celery
- ✅ Database persistence with PostgreSQL
- ✅ Docker containerization
- ✅ Comprehensive documentation

### 🚀 Above & Beyond Features
- ✅ Multi-language support (English & Spanish)
- ✅ Real-time status tracking
- ✅ Group management system
- ✅ Responsive mobile-first design
- ✅ Production-ready error handling
- ✅ Multiple deployment configurations
- ✅ API documentation with Swagger
- ✅ Microservices architecture

---

<div align="center">
  <p>
    <a href="#-whatsapp-scheduler---the-ultimate-messaging-automation-platform">Back to top ⬆️</a>
  </p>
</div>