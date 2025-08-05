from celery import Task
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from app.celery_app import celery_app
from app.database import SessionLocal
from app.models import ScheduledMessage, Message, RecipientGroup
from app.services.whatsapp import whatsapp_service
import logging

# STARTUP DEBUG LOG - This should appear when worker starts
print("🚀🚀🚀 WORKER STARTUP: Updated whatsapp_tasks.py is loaded! 🚀🚀🚀")

# Test database connection immediately
try:
    from app.database import SessionLocal
    from sqlalchemy import text
    test_db = SessionLocal()
    test_db.execute(text("SELECT 1"))
    test_db.close()
    print("✅ Database connection test PASSED")
except Exception as e:
    print(f"❌ Database connection test FAILED: {e}")
    
print("🏁 whatsapp_tasks.py module initialization complete")

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
    print(f"🔥 CELERY DEBUG: Starting send_scheduled_message task for message ID {scheduled_message_id}")
    logger.info(f"DEBUG: Starting send_scheduled_message task for message ID {scheduled_message_id}")
    try:
        # Get the scheduled message
        scheduled_msg = self.db.query(ScheduledMessage).filter(
            ScheduledMessage.id == scheduled_message_id
        ).first()
        
        if not scheduled_msg:
            logger.error(f"DEBUG: Scheduled message {scheduled_message_id} not found in database")
            return
        
        logger.info(f"DEBUG: Found scheduled message {scheduled_message_id}, current status: {scheduled_msg.status}")
        
        # Update status to sending
        scheduled_msg.status = "sending"
        self.db.commit()
        logger.info(f"DEBUG: Updated message {scheduled_message_id} status to 'sending'")
        
        # Get the message and group
        message = scheduled_msg.message
        group = scheduled_msg.group
        
        logger.info(f"DEBUG: Message content: '{message.content[:50]}...'")
        print(f"🔥 CELERY DEBUG: Group '{group.name}' has {len(group.recipients)} recipients")
        logger.info(f"DEBUG: Group '{group.name}' has {len(group.recipients)} recipients")
        
        # Send to all recipients in the group
        success_count = 0
        fail_count = 0
        errors = []
        
        for i, recipient in enumerate(group.recipients):
            logger.info(f"DEBUG: Sending to recipient {i+1}/{len(group.recipients)}: {recipient.name} ({recipient.phone_number})")
            
            result = whatsapp_service.send_message(
                recipient.phone_number,
                message.content
            )
            
            print(f"🔥 CELERY DEBUG: WhatsApp API result for {recipient.phone_number}: {result}")
            logger.info(f"DEBUG: WhatsApp API result for {recipient.phone_number}: {result}")
            
            if result.get("success", False):
                success_count += 1
                logger.info(f"DEBUG: SUCCESS - Message sent to {recipient.phone_number}")
            else:
                fail_count += 1
                error_msg = f"Failed to send to {recipient.name} ({recipient.phone_number}): {result.get('error', 'Unknown error')}"
                if 'details' in result:
                    error_msg += f" - Details: {result['details']}"
                errors.append(error_msg)
                logger.error(f"DEBUG: FAILED - {error_msg}")
        
        # Update scheduled message status with detailed logging
        logger.info(f"DEBUG: Processing results - Success: {success_count}, Failed: {fail_count}, Total recipients: {len(group.recipients)}")
        
        if len(group.recipients) == 0:
            scheduled_msg.status = "failed"
            scheduled_msg.error_message = "No recipients found in group"
            logger.error(f"DEBUG: No recipients found for message {scheduled_message_id}")
        elif fail_count == 0 and success_count > 0:
            scheduled_msg.status = "sent"
            logger.info(f"DEBUG: All messages sent successfully for message {scheduled_message_id}")
        elif success_count == 0:
            scheduled_msg.status = "failed"
            logger.error(f"DEBUG: All messages failed for message {scheduled_message_id}")
        else:
            scheduled_msg.status = "partially_sent"
            logger.warning(f"DEBUG: Partial success for message {scheduled_message_id}")
        
        scheduled_msg.sent_at = datetime.now(timezone.utc)
        if errors:
            scheduled_msg.error_message = "; ".join(errors[:5])  # Store first 5 errors
            logger.error(f"DEBUG: Errors recorded: {scheduled_msg.error_message}")
        
        self.db.commit()
        print(f"🔥 CELERY DEBUG: Final status for message {scheduled_message_id}: '{scheduled_msg.status}'")
        logger.info(f"DEBUG: Updated message {scheduled_message_id} final status to '{scheduled_msg.status}'")
        
        logger.info(f"DEBUG: Scheduled message {scheduled_message_id} processing complete. Success: {success_count}, Failed: {fail_count}")
        
    except Exception as e:
        logger.exception(f"DEBUG: CRITICAL ERROR processing scheduled message {scheduled_message_id}: {str(e)}")
        if 'scheduled_msg' in locals():
            scheduled_msg.status = "failed"
            scheduled_msg.error_message = f"System error: {str(e)}"
            self.db.commit()
            logger.error(f"DEBUG: Set message {scheduled_message_id} status to failed due to exception")
        raise

@celery_app.task(base=SQLAlchemyTask, bind=True)
def check_scheduled_messages(self):
    """Check for messages that might have been missed (failsafe)"""
    logger.info("DEBUG: Running failsafe check for missed scheduled messages")
    try:
        current_time = datetime.now(timezone.utc)
        
        # Find messages that are overdue by more than 30 seconds and don't have a task_id
        # This catches messages that failed to schedule properly
        overdue_messages = self.db.query(ScheduledMessage).filter(
            ScheduledMessage.status == "pending",
            ScheduledMessage.scheduled_time <= current_time,
            ScheduledMessage.task_id == None
        ).all()
        
        if overdue_messages:
            logger.warning(f"DEBUG: Found {len(overdue_messages)} overdue messages without task IDs")
            
            for scheduled_msg in overdue_messages:
                delay = (current_time - scheduled_msg.scheduled_time).total_seconds()
                logger.warning(f"DEBUG: Recovering message {scheduled_msg.id} overdue by {delay:.1f} seconds")
                
                # Send immediately since it's overdue
                task = send_scheduled_message.delay(scheduled_msg.id)
                scheduled_msg.task_id = task.id
                self.db.commit()
                logger.info(f"DEBUG: Queued overdue message {scheduled_msg.id} with task ID {task.id}")
        
        # Also check for stuck messages (pending with task_id but overdue by >5 minutes)
        stuck_time = datetime.now(timezone.utc).replace(microsecond=0) - timedelta(minutes=5)
        stuck_messages = self.db.query(ScheduledMessage).filter(
            ScheduledMessage.status == "pending",
            ScheduledMessage.scheduled_time <= stuck_time,
            ScheduledMessage.task_id != None
        ).all()
        
        if stuck_messages:
            logger.error(f"DEBUG: Found {len(stuck_messages)} stuck messages")
            for msg in stuck_messages:
                logger.error(f"DEBUG: Message {msg.id} stuck with task_id {msg.task_id}")
                # Re-queue stuck messages
                task = send_scheduled_message.delay(msg.id)
                msg.task_id = task.id
                self.db.commit()
            
    except Exception as e:
        logger.exception(f"DEBUG: CRITICAL ERROR in check_scheduled_messages: {str(e)}")
        raise