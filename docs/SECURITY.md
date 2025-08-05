# WhatsApp Scheduler - Security Guide

## Table of Contents
- [Overview](#overview)
- [Current Security Measures](#current-security-measures)
- [Security Architecture](#security-architecture)
- [Authentication & Authorization](#authentication--authorization)
- [Data Protection](#data-protection)
- [API Security](#api-security)
- [Infrastructure Security](#infrastructure-security)
- [Security Best Practices](#security-best-practices)
- [Compliance & Privacy](#compliance--privacy)
- [Security Checklist](#security-checklist)
- [Incident Response](#incident-response)

## Overview

This document outlines the security measures, best practices, and considerations for the WhatsApp Scheduler application. Security is implemented in layers, from infrastructure to application level, ensuring defense in depth.

## Current Security Measures

### Application Security

| Security Feature | Status | Implementation |
|-----------------|---------|----------------|
| Input Validation | ✅ Implemented | Pydantic models validate all API inputs |
| SQL Injection Protection | ✅ Implemented | SQLAlchemy ORM prevents SQL injection |
| XSS Protection | ✅ Implemented | React automatically escapes output |
| CSRF Protection | ⚠️ Partial | Stateless API, needs token implementation |
| Authentication | ❌ Not Implemented | Ready for JWT integration |
| Authorization | ❌ Not Implemented | RBAC structure prepared |
| Rate Limiting | ⚠️ Basic | Simple rate limiting, needs enhancement |
| Encryption at Rest | ❌ Not Implemented | Database encryption needed |
| Encryption in Transit | ✅ Implemented | HTTPS in production |

### Infrastructure Security

```mermaid
graph TB
    subgraph "Security Layers"
        A[WAF/DDoS Protection]
        B[Load Balancer/SSL Termination]
        C[Application Firewall]
        D[Container Security]
        E[Network Isolation]
        F[Database Encryption]
    end
    
    A --> B
    B --> C
    C --> D
    D --> E
    E --> F
```

## Security Architecture

### Defense in Depth Strategy

```
┌─────────────────────────────────────────────────────┐
│                  External Layer                      │
│  - DDoS Protection                                  │
│  - Web Application Firewall (WAF)                  │
│  - Geographic IP Filtering                         │
└─────────────────────────────────────────────────────┘
                          │
┌─────────────────────────────────────────────────────┐
│                  Network Layer                       │
│  - TLS 1.3 Encryption                              │
│  - Certificate Pinning                             │
│  - VPC Network Isolation                           │
└─────────────────────────────────────────────────────┘
                          │
┌─────────────────────────────────────────────────────┐
│                Application Layer                     │
│  - Authentication & Authorization                   │
│  - Input Validation & Sanitization                 │
│  - Output Encoding                                 │
│  - Session Management                              │
└─────────────────────────────────────────────────────┘
                          │
┌─────────────────────────────────────────────────────┐
│                   Data Layer                         │
│  - Encryption at Rest                              │
│  - Database Access Control                         │
│  - Backup Encryption                               │
│  - Key Management                                  │
└─────────────────────────────────────────────────────┘
```

## Authentication & Authorization

### JWT Implementation (Recommended)

```python
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

# Configuration
SECRET_KEY = "your-secret-key-here"  # Use environment variable
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# User model
class User(BaseModel):
    id: str
    email: str
    role: str
    permissions: List[str]

# Token generation
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    
    to_encode.update({
        "exp": expire,
        "type": "access"
    })
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# Token validation
async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        token_data = TokenData(user_id=user_id)
    except JWTError:
        raise credentials_exception
    
    user = get_user(user_id=token_data.user_id)
    if user is None:
        raise credentials_exception
    return user
```

### Role-Based Access Control (RBAC)

```python
from enum import Enum
from functools import wraps

class Role(str, Enum):
    ADMIN = "admin"
    USER = "user"
    VIEWER = "viewer"

class Permission(str, Enum):
    CREATE_MESSAGE = "create_message"
    DELETE_MESSAGE = "delete_message"
    SCHEDULE_MESSAGE = "schedule_message"
    MANAGE_RECIPIENTS = "manage_recipients"
    VIEW_ANALYTICS = "view_analytics"
    MANAGE_USERS = "manage_users"

# Role-Permission mapping
ROLE_PERMISSIONS = {
    Role.ADMIN: [
        Permission.CREATE_MESSAGE,
        Permission.DELETE_MESSAGE,
        Permission.SCHEDULE_MESSAGE,
        Permission.MANAGE_RECIPIENTS,
        Permission.VIEW_ANALYTICS,
        Permission.MANAGE_USERS,
    ],
    Role.USER: [
        Permission.CREATE_MESSAGE,
        Permission.SCHEDULE_MESSAGE,
        Permission.MANAGE_RECIPIENTS,
        Permission.VIEW_ANALYTICS,
    ],
    Role.VIEWER: [
        Permission.VIEW_ANALYTICS,
    ],
}

# Permission decorator
def require_permission(permission: Permission):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, current_user: User = Depends(get_current_user), **kwargs):
            if permission not in ROLE_PERMISSIONS.get(current_user.role, []):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Insufficient permissions"
                )
            return await func(*args, current_user=current_user, **kwargs)
        return wrapper
    return decorator

# Usage example
@app.post("/api/messages")
@require_permission(Permission.CREATE_MESSAGE)
async def create_message(
    message: MessageCreate,
    current_user: User = Depends(get_current_user)
):
    # Only users with CREATE_MESSAGE permission can access
    return create_new_message(message, user_id=current_user.id)
```

## Data Protection

### Encryption at Rest

```python
from cryptography.fernet import Fernet
from sqlalchemy import TypeDecorator, String

# Generate encryption key
def generate_key():
    return Fernet.generate_key()

# Encrypted field type
class EncryptedType(TypeDecorator):
    impl = String
    
    def __init__(self, key, *args, **kwargs):
        self.key = key
        self.fernet = Fernet(self.key)
        super().__init__(*args, **kwargs)
    
    def process_bind_param(self, value, dialect):
        if value is not None:
            return self.fernet.encrypt(value.encode()).decode()
        return value
    
    def process_result_value(self, value, dialect):
        if value is not None:
            return self.fernet.decrypt(value.encode()).decode()
        return value

# Usage in models
class Recipient(Base):
    __tablename__ = "recipients"
    
    id = Column(UUID(as_uuid=True), primary_key=True)
    name = Column(String(255))
    phone_number = Column(EncryptedType(ENCRYPTION_KEY), nullable=False)
```

### Data Sanitization

```python
import re
from typing import Optional
import phonenumbers
import bleach

class DataSanitizer:
    @staticmethod
    def sanitize_phone(phone: str, country_code: str = "US") -> Optional[str]:
        """Sanitize and validate phone numbers"""
        try:
            parsed = phonenumbers.parse(phone, country_code)
            if phonenumbers.is_valid_number(parsed):
                return phonenumbers.format_number(
                    parsed, 
                    phonenumbers.PhoneNumberFormat.E164
                )
        except:
            pass
        return None
    
    @staticmethod
    def sanitize_html(content: str) -> str:
        """Remove potentially dangerous HTML"""
        allowed_tags = ['b', 'i', 'u', 'em', 'strong', 'br']
        return bleach.clean(content, tags=allowed_tags, strip=True)
    
    @staticmethod
    def sanitize_filename(filename: str) -> str:
        """Sanitize uploaded filenames"""
        # Remove path traversal attempts
        filename = filename.replace("..", "")
        # Allow only alphanumeric, dash, underscore, and dot
        return re.sub(r'[^a-zA-Z0-9._-]', '', filename)
```

### Sensitive Data Handling

```python
# Environment variable management
from pydantic import BaseSettings, SecretStr

class Settings(BaseSettings):
    # Database
    database_url: SecretStr
    
    # Security
    secret_key: SecretStr
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # WhatsApp API
    whatsapp_access_token: SecretStr
    whatsapp_phone_number_id: SecretStr
    
    # Encryption
    field_encryption_key: SecretStr
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False

# Logging sanitization
import logging
import re

class SensitiveDataFilter(logging.Filter):
    """Remove sensitive data from logs"""
    
    patterns = [
        (r'(password|token|key|secret)=["\']?[^"\'\s]+', r'\1=***REDACTED***'),
        (r'\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b', '****-****-****-****'),  # Credit cards
        (r'\+?\d{10,15}', lambda m: m.group()[:3] + '*' * (len(m.group())-6) + m.group()[-3:]),  # Phone numbers
    ]
    
    def filter(self, record):
        msg = record.getMessage()
        for pattern, replacement in self.patterns:
            msg = re.sub(pattern, replacement, msg, flags=re.IGNORECASE)
        record.msg = msg
        return True

# Apply to logger
logger = logging.getLogger(__name__)
logger.addFilter(SensitiveDataFilter())
```

## API Security

### Rate Limiting Implementation

```python
from datetime import datetime, timedelta
from collections import defaultdict
import asyncio

class RateLimiter:
    def __init__(self, redis_client):
        self.redis = redis_client
    
    async def check_rate_limit(
        self, 
        key: str, 
        max_requests: int, 
        window_seconds: int
    ) -> tuple[bool, int]:
        """Check if request is within rate limit"""
        now = datetime.utcnow()
        window_start = now - timedelta(seconds=window_seconds)
        
        # Remove old entries
        await self.redis.zremrangebyscore(
            key, 
            0, 
            window_start.timestamp()
        )
        
        # Count current requests
        current_requests = await self.redis.zcard(key)
        
        if current_requests >= max_requests:
            # Get oldest request time
            oldest = await self.redis.zrange(key, 0, 0, withscores=True)
            if oldest:
                reset_time = int(oldest[0][1]) + window_seconds
                return False, reset_time - int(now.timestamp())
            return False, window_seconds
        
        # Add current request
        await self.redis.zadd(key, {str(now.timestamp()): now.timestamp()})
        await self.redis.expire(key, window_seconds)
        
        return True, 0

# Rate limiting middleware
@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    # Skip rate limiting for health checks
    if request.url.path.startswith("/health"):
        return await call_next(request)
    
    # Get client identifier
    client_ip = request.client.host
    endpoint = request.url.path
    key = f"rate_limit:{client_ip}:{endpoint}"
    
    # Check rate limit (100 requests per minute)
    allowed, retry_after = await rate_limiter.check_rate_limit(
        key, 
        max_requests=100, 
        window_seconds=60
    )
    
    if not allowed:
        return JSONResponse(
            status_code=429,
            content={"detail": "Rate limit exceeded"},
            headers={"Retry-After": str(retry_after)}
        )
    
    response = await call_next(request)
    return response
```

### CORS Configuration

```python
from fastapi.middleware.cors import CORSMiddleware

# Production CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://your-domain.com",
        "https://app.your-domain.com",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
    expose_headers=["X-Total-Count", "X-Page-Count"],
    max_age=3600,  # Cache preflight requests for 1 hour
)
```

### API Security Headers

```python
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        
        # Security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "font-src 'self'; "
            "connect-src 'self' https://api.whatsapp.com"
        )
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = (
            "accelerometer=(), camera=(), geolocation=(), "
            "gyroscope=(), magnetometer=(), microphone=(), "
            "payment=(), usb=()"
        )
        
        return response

app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(TrustedHostMiddleware, allowed_hosts=["*.your-domain.com"])
```

### Request Validation

```python
from pydantic import BaseModel, validator, constr, EmailStr
import re

class SecureMessageCreate(BaseModel):
    title: constr(min_length=1, max_length=255, strip_whitespace=True)
    content: constr(min_length=1, max_length=5000, strip_whitespace=True)
    
    @validator('title', 'content')
    def no_script_tags(cls, v):
        if re.search(r'<\s*script', v, re.IGNORECASE):
            raise ValueError('Script tags not allowed')
        return v
    
    @validator('content')
    def sanitize_content(cls, v):
        # Additional content sanitization
        return DataSanitizer.sanitize_html(v)

class SecureRecipientCreate(BaseModel):
    name: constr(min_length=1, max_length=100, strip_whitespace=True)
    phone_number: str
    
    @validator('phone_number')
    def validate_phone(cls, v):
        sanitized = DataSanitizer.sanitize_phone(v)
        if not sanitized:
            raise ValueError('Invalid phone number')
        return sanitized
    
    @validator('name')
    def validate_name(cls, v):
        # Allow only letters, spaces, and common punctuation
        if not re.match(r"^[a-zA-Z\s\-'.]+$", v):
            raise ValueError('Invalid name format')
        return v
```

## Infrastructure Security

### Container Security

```dockerfile
# Secure Dockerfile
FROM python:3.11-slim as builder

# Security: Don't run as root
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Install dependencies
WORKDIR /app
COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

# Production stage
FROM python:3.11-slim

# Security updates
RUN apt-get update && apt-get upgrade -y && \
    apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy from builder
COPY --from=builder /home/appuser/.local /home/appuser/.local

# Create app user
RUN groupadd -r appuser && useradd -r -g appuser appuser

WORKDIR /app
COPY --chown=appuser:appuser . .

# Security: Use non-root user
USER appuser

# Security: Don't expose unnecessary information
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run with limited privileges
CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Network Security

```yaml
# docker-compose security configuration
version: '3.8'

services:
  backend:
    build: ./backend
    networks:
      - backend-net
      - db-net
    environment:
      - DATABASE_URL_FILE=/run/secrets/db_url
    secrets:
      - db_url
    security_opt:
      - no-new-privileges:true
    read_only: true
    tmpfs:
      - /tmp
      - /var/run
    
  db:
    image: postgres:15-alpine
    networks:
      - db-net
    environment:
      - POSTGRES_PASSWORD_FILE=/run/secrets/db_password
    secrets:
      - db_password
    volumes:
      - postgres_data:/var/lib/postgresql/data:Z
    security_opt:
      - no-new-privileges:true
    
  redis:
    image: redis:7-alpine
    command: redis-server --requirepass "${REDIS_PASSWORD}"
    networks:
      - backend-net
    security_opt:
      - no-new-privileges:true

networks:
  backend-net:
    driver: bridge
    internal: false
  db-net:
    driver: bridge
    internal: true

secrets:
  db_url:
    external: true
  db_password:
    external: true

volumes:
  postgres_data:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: ./data/postgres
```

### Secrets Management

```python
# Kubernetes secrets example
apiVersion: v1
kind: Secret
metadata:
  name: whatsapp-scheduler-secrets
type: Opaque
stringData:
  database-url: "postgresql://user:pass@host/db"
  jwt-secret: "your-secret-key"
  whatsapp-token: "your-whatsapp-token"
  encryption-key: "your-encryption-key"

---
# Use in deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
spec:
  template:
    spec:
      containers:
      - name: backend
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: whatsapp-scheduler-secrets
              key: database-url
        - name: SECRET_KEY
          valueFrom:
            secretKeyRef:
              name: whatsapp-scheduler-secrets
              key: jwt-secret
```

## Security Best Practices

### Code Security

1. **Dependency Management**
   ```bash
   # Regular security updates
   pip install --upgrade pip
   pip list --outdated
   
   # Security vulnerability scanning
   pip install safety
   safety check
   
   # Use pip-audit
   pip install pip-audit
   pip-audit
   ```

2. **Static Code Analysis**
   ```bash
   # Install security linters
   pip install bandit pylint mypy
   
   # Run security scan
   bandit -r app/
   
   # Type checking
   mypy app/
   ```

3. **Git Security**
   ```bash
   # Pre-commit hooks
   pip install pre-commit
   
   # .pre-commit-config.yaml
   repos:
   - repo: https://github.com/Yelp/detect-secrets
     rev: v1.4.0
     hooks:
     - id: detect-secrets
   - repo: https://github.com/PyCQA/bandit
     rev: 1.7.4
     hooks:
     - id: bandit
   ```

### Database Security

```sql
-- Principle of least privilege
CREATE USER app_user WITH PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE whatsapp_scheduler TO app_user;
GRANT USAGE ON SCHEMA public TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;

-- Row-level security
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY messages_isolation ON messages
    USING (user_id = current_setting('app.current_user_id')::uuid);

-- Audit logging
CREATE TABLE audit_log (
    id SERIAL PRIMARY KEY,
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL,
    user_id UUID,
    changed_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_log (table_name, operation, user_id, changed_data)
    VALUES (
        TG_TABLE_NAME,
        TG_OP,
        current_setting('app.current_user_id', true)::uuid,
        to_jsonb(NEW)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## Compliance & Privacy

### GDPR Compliance

```python
class GDPRCompliance:
    @staticmethod
    async def export_user_data(user_id: str, db: Session):
        """Export all user data for GDPR compliance"""
        data = {
            "user_info": get_user_info(user_id),
            "messages": get_user_messages(user_id),
            "recipients": get_user_recipients(user_id),
            "scheduled_messages": get_user_schedules(user_id),
            "audit_log": get_user_audit_log(user_id),
        }
        return data
    
    @staticmethod
    async def delete_user_data(user_id: str, db: Session):
        """Delete all user data (right to be forgotten)"""
        # Soft delete with anonymization
        user = db.query(User).filter(User.id == user_id).first()
        user.email = f"deleted_{user_id}@example.com"
        user.name = "Deleted User"
        user.phone_number = None
        user.deleted_at = datetime.utcnow()
        
        # Anonymize related data
        db.query(Message).filter(Message.user_id == user_id).update({
            "content": "[REDACTED]",
            "title": "[REDACTED]"
        })
        
        db.commit()
        return {"status": "user data anonymized"}
```

### Privacy Policy Implementation

```python
class PrivacyPolicy:
    @staticmethod
    def get_data_retention_policy():
        return {
            "messages": "90 days after deletion",
            "user_data": "Until account deletion",
            "logs": "30 days",
            "backups": "30 days",
        }
    
    @staticmethod
    def get_data_usage_policy():
        return {
            "purpose": "Message scheduling and delivery",
            "third_parties": ["WhatsApp Business API"],
            "data_types": ["phone_numbers", "message_content"],
            "retention": get_data_retention_policy(),
        }
```

## Security Checklist

### Development Phase
- [ ] Use environment variables for sensitive data
- [ ] Implement input validation on all endpoints
- [ ] Add CSRF protection for state-changing operations
- [ ] Enable SQL injection protection (use ORM)
- [ ] Implement proper error handling (no stack traces)
- [ ] Add security headers to all responses
- [ ] Use HTTPS in development environment
- [ ] Implement rate limiting
- [ ] Add request size limits
- [ ] Sanitize user inputs

### Pre-Production
- [ ] Run security vulnerability scan (OWASP ZAP)
- [ ] Perform dependency security audit
- [ ] Review and update all dependencies
- [ ] Implement authentication system
- [ ] Set up authorization/RBAC
- [ ] Configure CORS properly
- [ ] Enable database encryption
- [ ] Set up secrets management
- [ ] Implement audit logging
- [ ] Create security documentation

### Production Deployment
- [ ] Use TLS 1.3 for all connections
- [ ] Enable WAF (Web Application Firewall)
- [ ] Configure DDoS protection
- [ ] Set up intrusion detection
- [ ] Implement log monitoring
- [ ] Configure automated backups
- [ ] Set up security alerts
- [ ] Implement key rotation
- [ ] Configure firewall rules
- [ ] Regular security audits

### Ongoing Security
- [ ] Weekly dependency updates
- [ ] Monthly security scans
- [ ] Quarterly penetration testing
- [ ] Annual security audit
- [ ] Incident response drills
- [ ] Security training for team
- [ ] Monitor security advisories
- [ ] Update security patches
- [ ] Review access logs
- [ ] Update security documentation

## Incident Response

### Incident Response Plan

```python
class IncidentResponse:
    @staticmethod
    async def detect_breach(event_type: str, details: dict):
        """Automated breach detection and response"""
        severity = assess_severity(event_type)
        
        if severity >= SeverityLevel.HIGH:
            # Immediate actions
            await lock_affected_accounts(details)
            await notify_security_team(event_type, details)
            await create_incident_ticket(event_type, details)
            
            # Start forensics
            await capture_system_state()
            await preserve_logs()
        
        return {
            "incident_id": generate_incident_id(),
            "severity": severity,
            "status": "investigating",
            "actions_taken": ["accounts_locked", "team_notified"],
        }
    
    @staticmethod
    async def respond_to_incident(incident_id: str, action: str):
        """Execute incident response actions"""
        actions = {
            "isolate": isolate_affected_systems,
            "recover": restore_from_backup,
            "investigate": run_forensics,
            "communicate": notify_affected_users,
        }
        
        if action in actions:
            result = await actions[action](incident_id)
            await log_incident_action(incident_id, action, result)
            return result
```

### Security Monitoring

```python
# Real-time security monitoring
class SecurityMonitor:
    def __init__(self):
        self.alert_thresholds = {
            "failed_logins": 5,
            "rate_limit_hits": 100,
            "error_rate": 0.05,
            "response_time": 1000,  # ms
        }
    
    async def monitor_security_events(self):
        """Monitor security-relevant events"""
        events = await get_recent_events()
        
        for event in events:
            if event.type == "failed_login":
                await self.check_brute_force(event)
            elif event.type == "rate_limit":
                await self.check_ddos(event)
            elif event.type == "error":
                await self.check_injection_attempts(event)
    
    async def check_brute_force(self, event):
        """Detect brute force attempts"""
        key = f"failed_login:{event.ip_address}"
        count = await redis.incr(key)
        await redis.expire(key, 300)  # 5 minute window
        
        if count >= self.alert_thresholds["failed_logins"]:
            await self.trigger_alert("brute_force", event)
            await self.block_ip(event.ip_address)
```

## Conclusion

Security is a continuous process that requires constant vigilance and updates. This document provides a comprehensive security framework for the WhatsApp Scheduler application. Regular security audits, updates, and monitoring are essential to maintain a secure system. Always follow the principle of least privilege and defense in depth to ensure maximum security.