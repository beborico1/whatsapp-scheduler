from celery import Task
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.celery_app import celery_app
from app.database import SessionLocal
from app.models import ScheduledMessage, Message, RecipientGroup
from app.services.whatsapp import whatsapp_service
import logging

logger = logging.getLogger(__name__)

class SQLAlchemyTask(Task):
    """Abstract base task that ensures a database session is properly managed."""
    _db = None

    @property
    def db(self) -> Session:
        if self._db is None:
            self._db = SessionLocal()
        return self._db

    def after_return(self, status, retval, task_id, args, kwargs, einfo):
        if self._db is not None:
            self._db.close()
            self._db = None

@celery_app.task(base=SQLAlchemyTask, bind=True)
def send_scheduled_message(self, scheduled_message_id: int):
    """Send a scheduled WhatsApp message to all recipients in the group"""
    try:
        # Get the scheduled message
        scheduled_msg = self.db.query(ScheduledMessage).filter(
            ScheduledMessage.id == scheduled_message_id
        ).first()
        
        if not scheduled_msg:
            logger.error(f"Scheduled message {scheduled_message_id} not found")
            return
        
        # Update status to sending
        scheduled_msg.status = "sending"
        self.db.commit()
        
        # Get the message and group
        message = scheduled_msg.message
        group = scheduled_msg.group
        
        # Send to all recipients in the group
        success_count = 0
        fail_count = 0
        errors = []
        
        for recipient in group.recipients:
            result = whatsapp_service.send_message(
                recipient.phone_number,
                message.content
            )
            
            if result["success"]:
                success_count += 1
                logger.info(f"Message sent successfully to {recipient.phone_number}")
            else:
                fail_count += 1
                error_msg = f"Failed to send to {recipient.name} ({recipient.phone_number}): {result['error']}"
                errors.append(error_msg)
                logger.error(error_msg)
        
        # Update scheduled message status
        if fail_count == 0:
            scheduled_msg.status = "sent"
        elif success_count == 0:
            scheduled_msg.status = "failed"
        else:
            scheduled_msg.status = "partially_sent"
        
        scheduled_msg.sent_at = datetime.now(timezone.utc)
        if errors:
            scheduled_msg.error_message = "; ".join(errors[:5])  # Store first 5 errors
        
        self.db.commit()
        
        logger.info(f"Scheduled message {scheduled_message_id} processed. Success: {success_count}, Failed: {fail_count}")
        
    except Exception as e:
        logger.exception(f"Error processing scheduled message {scheduled_message_id}")
        if 'scheduled_msg' in locals():
            scheduled_msg.status = "failed"
            scheduled_msg.error_message = str(e)
            self.db.commit()
        raise

@celery_app.task(base=SQLAlchemyTask, bind=True)
def check_scheduled_messages(self):
    """Check for messages that need to be sent"""
    try:
        current_time = datetime.now(timezone.utc)
        
        # Find all pending messages whose scheduled time has passed
        pending_messages = self.db.query(ScheduledMessage).filter(
            ScheduledMessage.status == "pending",
            ScheduledMessage.scheduled_time <= current_time
        ).all()
        
        for scheduled_msg in pending_messages:
            # Schedule the message to be sent
            send_scheduled_message.delay(scheduled_msg.id)
            logger.info(f"Queued scheduled message {scheduled_msg.id} for sending")
        
        if pending_messages:
            logger.info(f"Queued {len(pending_messages)} messages for sending")
            
    except Exception as e:
        logger.exception("Error checking scheduled messages")
        raise