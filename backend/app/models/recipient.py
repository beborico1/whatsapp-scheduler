from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

recipient_group_association = Table(
    'recipient_group_association',
    Base.metadata,
    Column('recipient_id', Integer, ForeignKey('recipients.id')),
    Column('group_id', Integer, ForeignKey('recipient_groups.id'))
)

class Recipient(Base):
    __tablename__ = "recipients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    phone_number = Column(String(20), nullable=False, unique=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    groups = relationship("RecipientGroup", secondary=recipient_group_association, back_populates="recipients")

class RecipientGroup(Base):
    __tablename__ = "recipient_groups"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, unique=True)
    description = Column(String(500))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    recipients = relationship("Recipient", secondary=recipient_group_association, back_populates="groups")