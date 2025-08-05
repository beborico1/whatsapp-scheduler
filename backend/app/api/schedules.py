from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timezone
from app.database import get_db
from app.models import ScheduledMessage, Message, RecipientGroup
from app.schemas import ScheduledMessage as ScheduledMessageSchema, ScheduledMessageCreate
from app.tasks.whatsapp_tasks import send_scheduled_message

router = APIRouter()

@router.post("/", response_model=ScheduledMessageSchema)
def create_scheduled_message(schedule: ScheduledMessageCreate, db: Session = Depends(get_db)):
    # Verify message exists
    message = db.query(Message).filter(Message.id == schedule.message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    # Verify group exists
    group = db.query(RecipientGroup).filter(RecipientGroup.id == schedule.group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Recipient group not found")
    
    # Ensure scheduled time is in the future
    if schedule.scheduled_time <= datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Scheduled time must be in the future")
    
    db_schedule = ScheduledMessage(**schedule.dict())
    db.add(db_schedule)
    db.commit()
    db.refresh(db_schedule)
    
    # Only send immediately if the scheduled time has already passed (overdue)
    time_until_send = (schedule.scheduled_time - datetime.now(timezone.utc)).total_seconds()
    if time_until_send <= 0:
        print(f"DEBUG: Scheduling overdue message {db_schedule.id} for immediate sending (overdue by {abs(time_until_send)} seconds)")
        task = send_scheduled_message.delay(db_schedule.id)
        db_schedule.task_id = task.id
        db.commit()
        db.refresh(db_schedule)
    else:
        print(f"DEBUG: Message {db_schedule.id} scheduled for {schedule.scheduled_time}, will be sent in {time_until_send} seconds")
    
    return db_schedule

@router.get("/", response_model=List[ScheduledMessageSchema])
def read_scheduled_messages(
    status: str = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(ScheduledMessage)
    
    if status:
        query = query.filter(ScheduledMessage.status == status)
    
    scheduled_messages = query.order_by(ScheduledMessage.scheduled_time).offset(skip).limit(limit).all()
    return scheduled_messages

@router.get("/{schedule_id}", response_model=ScheduledMessageSchema)
def read_scheduled_message(schedule_id: int, db: Session = Depends(get_db)):
    scheduled_message = db.query(ScheduledMessage).filter(ScheduledMessage.id == schedule_id).first()
    if scheduled_message is None:
        raise HTTPException(status_code=404, detail="Scheduled message not found")
    return scheduled_message

@router.put("/{schedule_id}/cancel")
def cancel_scheduled_message(schedule_id: int, db: Session = Depends(get_db)):
    db_schedule = db.query(ScheduledMessage).filter(ScheduledMessage.id == schedule_id).first()
    if db_schedule is None:
        raise HTTPException(status_code=404, detail="Scheduled message not found")
    
    if db_schedule.status != "pending":
        raise HTTPException(status_code=400, detail="Can only cancel pending messages")
    
    db_schedule.status = "cancelled"
    db.commit()
    return {"message": "Scheduled message cancelled successfully"}

@router.post("/{schedule_id}/send-now")
def send_now(schedule_id: int, db: Session = Depends(get_db)):
    db_schedule = db.query(ScheduledMessage).filter(ScheduledMessage.id == schedule_id).first()
    if db_schedule is None:
        raise HTTPException(status_code=404, detail="Scheduled message not found")
    
    if db_schedule.status not in ["pending", "failed"]:
        raise HTTPException(status_code=400, detail="Can only send pending or failed messages")
    
    # Queue the message for immediate sending
    task = send_scheduled_message.delay(db_schedule.id)
    db_schedule.task_id = task.id
    db_schedule.status = "pending"
    db.commit()
    
    return {"message": "Message queued for immediate sending", "task_id": task.id}

@router.put("/{schedule_id}/archive")
def archive_scheduled_message(schedule_id: int, db: Session = Depends(get_db)):
    db_schedule = db.query(ScheduledMessage).filter(ScheduledMessage.id == schedule_id).first()
    if db_schedule is None:
        raise HTTPException(status_code=404, detail="Scheduled message not found")
    
    if db_schedule.status == "archived":
        raise HTTPException(status_code=400, detail="Message is already archived")
    
    db_schedule.status = "archived"
    db.commit()
    return {"message": "Scheduled message archived successfully"}

@router.delete("/{schedule_id}")
def delete_scheduled_message(schedule_id: int, db: Session = Depends(get_db)):
    db_schedule = db.query(ScheduledMessage).filter(ScheduledMessage.id == schedule_id).first()
    if db_schedule is None:
        raise HTTPException(status_code=404, detail="Scheduled message not found")
    
    if db_schedule.status not in ["pending", "cancelled", "failed", "archived"]:
        raise HTTPException(status_code=400, detail="Cannot delete sent or sending messages")
    
    db.delete(db_schedule)
    db.commit()
    return {"message": "Scheduled message deleted successfully"}