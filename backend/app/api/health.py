from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime
import redis
from typing import Dict, Any
import os

from app.database import get_db

router = APIRouter()

def get_redis_client():
    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    return redis.from_url(redis_url)

@router.get("/")
async def health_check():
    """Basic health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "service": "whatsapp-scheduler-api"
    }

@router.get("/db")
async def health_check_db(db: Session = Depends(get_db)):
    """Database connectivity health check"""
    try:
        # Execute a simple query to check database connectivity
        result = db.execute(text("SELECT 1"))
        result.fetchone()
        return {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "service": "database"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "service": "database",
            "error": str(e)
        }

@router.get("/redis")
async def health_check_redis():
    """Redis connectivity health check"""
    try:
        r = get_redis_client()
        r.ping()
        return {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "service": "redis"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "service": "redis",
            "error": str(e)
        }

@router.get("/celery")
async def health_check_celery():
    """Celery worker status health check"""
    try:
        from app.celery_app import celery_app
        
        # Get active workers
        inspect = celery_app.control.inspect()
        stats = inspect.stats()
        
        if stats:
            worker_count = len(stats)
            return {
                "status": "healthy",
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "service": "celery",
                "workers": worker_count,
                "worker_details": list(stats.keys())
            }
        else:
            return {
                "status": "unhealthy",
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "service": "celery",
                "error": "No active workers found"
            }
    except Exception as e:
        return {
            "status": "unhealthy",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "service": "celery",
            "error": str(e)
        }

@router.get("/detailed")
async def health_check_detailed(db: Session = Depends(get_db)):
    """Combined health status of all services"""
    services: Dict[str, Any] = {}
    overall_status = "healthy"
    
    # Check API
    services["api"] = "healthy"
    
    # Check Database
    try:
        result = db.execute(text("SELECT 1"))
        result.fetchone()
        services["database"] = "healthy"
    except Exception as e:
        services["database"] = {"status": "unhealthy", "error": str(e)}
        overall_status = "unhealthy"
    
    # Check Redis
    try:
        r = get_redis_client()
        r.ping()
        services["redis"] = "healthy"
    except Exception as e:
        services["redis"] = {"status": "unhealthy", "error": str(e)}
        overall_status = "unhealthy"
    
    # Check Celery
    try:
        from app.celery_app import celery_app
        inspect = celery_app.control.inspect()
        stats = inspect.stats()
        
        if stats:
            services["celery"] = {
                "status": "healthy",
                "workers": len(stats)
            }
        else:
            services["celery"] = {
                "status": "unhealthy",
                "error": "No active workers"
            }
            overall_status = "unhealthy"
    except Exception as e:
        services["celery"] = {
            "status": "unhealthy",
            "error": str(e)
        }
        overall_status = "unhealthy"
    
    return {
        "status": overall_status,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "services": services
    }