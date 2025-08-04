from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import Recipient, RecipientGroup
from app.schemas import (
    Recipient as RecipientSchema,
    RecipientCreate,
    RecipientGroup as RecipientGroupSchema,
    RecipientGroupCreate,
    RecipientGroupWithRecipients
)

router = APIRouter()

# Group endpoints (must be defined before recipient endpoints to avoid route conflicts)
@router.post("/groups", response_model=RecipientGroupSchema)
def create_group(group: RecipientGroupCreate, db: Session = Depends(get_db)):
    # Check if group name already exists
    existing = db.query(RecipientGroup).filter(RecipientGroup.name == group.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Group name already exists")
    
    db_group = RecipientGroup(name=group.name, description=group.description)
    
    # Add recipients if specified
    if group.recipient_ids:
        recipients = db.query(Recipient).filter(Recipient.id.in_(group.recipient_ids)).all()
        db_group.recipients = recipients
    
    db.add(db_group)
    db.commit()
    db.refresh(db_group)
    return db_group

@router.get("/groups", response_model=List[RecipientGroupWithRecipients])
def read_groups(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    groups = db.query(RecipientGroup).offset(skip).limit(limit).all()
    return groups

@router.get("/groups/{group_id}", response_model=RecipientGroupWithRecipients)
def read_group(group_id: int, db: Session = Depends(get_db)):
    group = db.query(RecipientGroup).filter(RecipientGroup.id == group_id).first()
    if group is None:
        raise HTTPException(status_code=404, detail="Group not found")
    return group

@router.put("/groups/{group_id}/recipients", response_model=RecipientGroupWithRecipients)
def update_group_recipients(group_id: int, recipient_ids: List[int], db: Session = Depends(get_db)):
    db_group = db.query(RecipientGroup).filter(RecipientGroup.id == group_id).first()
    if db_group is None:
        raise HTTPException(status_code=404, detail="Group not found")
    
    recipients = db.query(Recipient).filter(Recipient.id.in_(recipient_ids)).all()
    db_group.recipients = recipients
    
    db.commit()
    db.refresh(db_group)
    return db_group

@router.delete("/groups/{group_id}")
def delete_group(group_id: int, db: Session = Depends(get_db)):
    db_group = db.query(RecipientGroup).filter(RecipientGroup.id == group_id).first()
    if db_group is None:
        raise HTTPException(status_code=404, detail="Group not found")
    
    db.delete(db_group)
    db.commit()
    return {"message": "Group deleted successfully"}

# Recipient endpoints
@router.post("/", response_model=RecipientSchema)
def create_recipient(recipient: RecipientCreate, db: Session = Depends(get_db)):
    # Check if phone number already exists
    existing = db.query(Recipient).filter(Recipient.phone_number == recipient.phone_number).first()
    if existing:
        raise HTTPException(status_code=400, detail="Phone number already exists")
    
    db_recipient = Recipient(name=recipient.name, phone_number=recipient.phone_number)
    
    # Add to groups if specified
    if recipient.group_ids:
        groups = db.query(RecipientGroup).filter(RecipientGroup.id.in_(recipient.group_ids)).all()
        db_recipient.groups = groups
    
    db.add(db_recipient)
    db.commit()
    db.refresh(db_recipient)
    return db_recipient

@router.get("/", response_model=List[RecipientSchema])
def read_recipients(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    recipients = db.query(Recipient).offset(skip).limit(limit).all()
    return recipients

@router.get("/{recipient_id}", response_model=RecipientSchema)
def read_recipient(recipient_id: int, db: Session = Depends(get_db)):
    recipient = db.query(Recipient).filter(Recipient.id == recipient_id).first()
    if recipient is None:
        raise HTTPException(status_code=404, detail="Recipient not found")
    return recipient

@router.delete("/{recipient_id}")
def delete_recipient(recipient_id: int, db: Session = Depends(get_db)):
    db_recipient = db.query(Recipient).filter(Recipient.id == recipient_id).first()
    if db_recipient is None:
        raise HTTPException(status_code=404, detail="Recipient not found")
    
    db.delete(db_recipient)
    db.commit()
    return {"message": "Recipient deleted successfully"}