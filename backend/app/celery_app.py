from celery import Celery
import os
from dotenv import load_dotenv

load_dotenv()

celery_app = Celery(
    "whatsapp_scheduler",
    broker=os.getenv("REDIS_URL", "redis://localhost:6379/0"),
    backend=os.getenv("REDIS_URL", "redis://localhost:6379/0"),
    include=["app.tasks.whatsapp_tasks"]
)

celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    beat_schedule={
        'check-scheduled-messages': {
            'task': 'app.tasks.whatsapp_tasks.check_scheduled_messages',
            'schedule': 10.0,  # Run every 10 seconds for better precision
        },
    },
    task_routes={
        'app.tasks.whatsapp_tasks.send_scheduled_message': {'queue': 'high_priority'},
    },
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    task_time_limit=300,
    task_soft_time_limit=240,
)