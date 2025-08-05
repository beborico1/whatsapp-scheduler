from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

# Message schemas
class MessageBase(BaseModel):
    title: str
    content: str

class MessageCreate(MessageBase):
    pass

class Message(MessageBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True

# Recipient schemas
class RecipientBase(BaseModel):
    name: str
    phone_number: str

class RecipientCreate(RecipientBase):
    group_ids: List[int] = []

class Recipient(RecipientBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# RecipientGroup schemas
class RecipientGroupBase(BaseModel):
    name: str
    description: Optional[str] = None

class RecipientGroupCreate(RecipientGroupBase):
    recipient_ids: List[int] = []

class RecipientGroupWithRecipients(RecipientGroupBase):
    id: int
    created_at: datetime
    recipients: List[Recipient]
    
    class Config:
        from_attributes = True

class RecipientGroup(RecipientGroupBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# ScheduledMessage schemas
class ScheduledMessageBase(BaseModel):
    message_id: int
    group_id: int
    scheduled_time: datetime

class ScheduledMessageCreate(ScheduledMessageBase):
    pass

class ScheduledMessage(ScheduledMessageBase):
    id: int
    status: str
    task_id: Optional[str]
    error_message: Optional[str]
    created_at: datetime
    sent_at: Optional[datetime]
    message: Message
    group: RecipientGroupWithRecipients
    
    class Config:
        from_attributes = True