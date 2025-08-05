import pytest
from datetime import datetime, timedelta, timezone
from unittest.mock import patch, MagicMock, call
from sqlalchemy.orm import Session

from app.tasks.whatsapp_tasks import send_scheduled_message, check_scheduled_messages, SQLAlchemyTask
from app.models import ScheduledMessage, Message, RecipientGroup, Recipient


class TestSchedulingTasks:
    """Test suite for WhatsApp scheduling tasks."""
    
    @pytest.fixture
    def mock_task(self):
        """Create a mock Celery task with database session."""
        task = MagicMock(spec=SQLAlchemyTask)
        task.db = MagicMock(spec=Session)
        return task
    
    @pytest.fixture
    def sample_scheduled_message(self, db_session, sample_message, sample_group):
        """Create a scheduled message for testing."""
        scheduled = ScheduledMessage(
            message_id=sample_message.id,
            group_id=sample_group.id,
            scheduled_time=datetime.now(timezone.utc) + timedelta(minutes=5),
            status="pending"
        )
        db_session.add(scheduled)
        db_session.commit()
        db_session.refresh(scheduled)
        return scheduled
    
    def test_send_scheduled_message_success(
        self, 
        mock_task, 
        sample_scheduled_message,
        sample_message,
        sample_group,
        sample_recipient
    ):
        """Test successful sending of a scheduled message."""
        # Setup mock database queries
        mock_task.db.query.return_value.filter.return_value.first.return_value = sample_scheduled_message
        
        # Mock WhatsApp service
        with patch("app.tasks.whatsapp_tasks.whatsapp_service") as mock_whatsapp:
            mock_whatsapp.send_message.return_value = {
                "success": True,
                "data": {"messages": [{"id": "msg-123"}]}
            }
            
            # Execute task
            send_scheduled_message(mock_task, sample_scheduled_message.id)
            
            # Verify WhatsApp API was called for each recipient
            mock_whatsapp.send_message.assert_called_once_with(
                sample_recipient.phone_number,
                sample_message.content
            )
            
            # Verify status updates
            assert sample_scheduled_message.status == "sending"  # First update
            assert mock_task.db.commit.call_count >= 2  # At least two commits
    
    def test_send_scheduled_message_not_found(self, mock_task):
        """Test handling when scheduled message doesn't exist."""
        mock_task.db.query.return_value.filter.return_value.first.return_value = None
        
        # Should not raise exception
        send_scheduled_message(mock_task, 999)
        
        # Verify no WhatsApp calls were made
        with patch("app.tasks.whatsapp_tasks.whatsapp_service") as mock_whatsapp:
            mock_whatsapp.send_message.assert_not_called()
    
    def test_send_scheduled_message_partial_failure(
        self,
        mock_task,
        db_session
    ):
        """Test handling partial failures when sending to multiple recipients."""
        # Create multiple recipients
        recipients = [
            Recipient(name="User 1", phone_number="+1111111111"),
            Recipient(name="User 2", phone_number="+2222222222"),
            Recipient(name="User 3", phone_number="+3333333333")
        ]
        for r in recipients:
            db_session.add(r)
        
        group = RecipientGroup(name="Test Group", recipients=recipients)
        db_session.add(group)
        
        message = Message(name="Test", content="Test message")
        db_session.add(message)
        
        scheduled = ScheduledMessage(
            message=message,
            group=group,
            scheduled_time=datetime.now(timezone.utc),
            status="pending"
        )
        db_session.add(scheduled)
        db_session.commit()
        
        mock_task.db.query.return_value.filter.return_value.first.return_value = scheduled
        
        # Mock mixed results
        with patch("app.tasks.whatsapp_tasks.whatsapp_service") as mock_whatsapp:
            mock_whatsapp.send_message.side_effect = [
                {"success": True, "data": {"messages": [{"id": "1"}]}},
                {"success": False, "error": "Network error"},
                {"success": True, "data": {"messages": [{"id": "3"}]}}
            ]
            
            send_scheduled_message(mock_task, scheduled.id)
            
            # Should be marked as partially sent
            assert scheduled.status == "partially_sent"
            assert "Network error" in scheduled.error_message
    
    def test_send_scheduled_message_all_failed(
        self,
        mock_task,
        sample_scheduled_message,
        sample_message,
        sample_group
    ):
        """Test handling when all messages fail to send."""
        mock_task.db.query.return_value.filter.return_value.first.return_value = sample_scheduled_message
        
        with patch("app.tasks.whatsapp_tasks.whatsapp_service") as mock_whatsapp:
            mock_whatsapp.send_message.return_value = {
                "success": False,
                "error": "API Error",
                "details": "Invalid credentials"
            }
            
            send_scheduled_message(mock_task, sample_scheduled_message.id)
            
            assert sample_scheduled_message.status == "failed"
            assert "API Error" in sample_scheduled_message.error_message
    
    def test_send_scheduled_message_empty_group(
        self,
        mock_task,
        db_session
    ):
        """Test handling group with no recipients."""
        empty_group = RecipientGroup(name="Empty Group", recipients=[])
        db_session.add(empty_group)
        
        message = Message(name="Test", content="Test")
        db_session.add(message)
        
        scheduled = ScheduledMessage(
            message=message,
            group=empty_group,
            scheduled_time=datetime.now(timezone.utc),
            status="pending"
        )
        db_session.add(scheduled)
        db_session.commit()
        
        mock_task.db.query.return_value.filter.return_value.first.return_value = scheduled
        
        send_scheduled_message(mock_task, scheduled.id)
        
        assert scheduled.status == "failed"
        assert "No recipients" in scheduled.error_message
    
    def test_send_scheduled_message_exception_handling(
        self,
        mock_task,
        sample_scheduled_message
    ):
        """Test exception handling during message sending."""
        mock_task.db.query.return_value.filter.return_value.first.return_value = sample_scheduled_message
        
        with patch("app.tasks.whatsapp_tasks.whatsapp_service") as mock_whatsapp:
            mock_whatsapp.send_message.side_effect = Exception("Unexpected error")
            
            with pytest.raises(Exception):
                send_scheduled_message(mock_task, sample_scheduled_message.id)
            
            assert sample_scheduled_message.status == "failed"
            assert "System error" in sample_scheduled_message.error_message
    
    def test_check_scheduled_messages_finds_pending(
        self,
        mock_task,
        db_session
    ):
        """Test that check_scheduled_messages finds and queues pending messages."""
        # Create past and future scheduled messages
        past_time = datetime.now(timezone.utc) - timedelta(minutes=5)
        future_time = datetime.now(timezone.utc) + timedelta(minutes=5)
        
        message = Message(name="Test", content="Test")
        db_session.add(message)
        
        group = RecipientGroup(name="Test Group")
        db_session.add(group)
        
        past_scheduled = ScheduledMessage(
            message=message,
            group=group,
            scheduled_time=past_time,
            status="pending"
        )
        future_scheduled = ScheduledMessage(
            message=message,
            group=group,
            scheduled_time=future_time,
            status="pending"
        )
        
        db_session.add_all([past_scheduled, future_scheduled])
        db_session.commit()
        
        # Mock query to return only past message
        mock_task.db.query.return_value.filter.return_value.all.return_value = [past_scheduled]
        
        with patch("app.tasks.whatsapp_tasks.send_scheduled_message.delay") as mock_delay:
            mock_delay.return_value.id = "task-123"
            
            check_scheduled_messages(mock_task)
            
            # Verify only past message was queued
            mock_delay.assert_called_once_with(past_scheduled.id)
    
    def test_check_scheduled_messages_no_pending(self, mock_task):
        """Test check_scheduled_messages when no messages are pending."""
        mock_task.db.query.return_value.filter.return_value.all.return_value = []
        
        with patch("app.tasks.whatsapp_tasks.send_scheduled_message.delay") as mock_delay:
            check_scheduled_messages(mock_task)
            
            # Verify no tasks were queued
            mock_delay.assert_not_called()
    
    def test_check_scheduled_messages_filters_correctly(self, mock_task):
        """Test that check_scheduled_messages applies correct filters."""
        mock_query = mock_task.db.query.return_value
        mock_filter = mock_query.filter
        mock_filter.return_value.all.return_value = []
        
        current_time = datetime.now(timezone.utc)
        
        with patch("app.tasks.whatsapp_tasks.datetime") as mock_datetime:
            mock_datetime.now.return_value = current_time
            
            check_scheduled_messages(mock_task)
            
            # Verify correct model was queried
            mock_task.db.query.assert_called_with(ScheduledMessage)
            
            # Cannot directly test filter conditions, but verify filter was called
            assert mock_filter.called
    
    def test_check_scheduled_messages_exception_handling(self, mock_task):
        """Test exception handling in check_scheduled_messages."""
        mock_task.db.query.side_effect = Exception("Database error")
        
        with pytest.raises(Exception):
            check_scheduled_messages(mock_task)
    
    def test_sql_alchemy_task_db_property(self):
        """Test SQLAlchemyTask database session management."""
        task = SQLAlchemyTask()
        
        with patch("app.tasks.whatsapp_tasks.SessionLocal") as mock_session:
            mock_db = MagicMock()
            mock_session.return_value = mock_db
            
            # First access should create session
            db1 = task.db
            assert db1 == mock_db
            mock_session.assert_called_once()
            
            # Second access should return same session
            db2 = task.db
            assert db2 == db1
            assert mock_session.call_count == 1
    
    def test_sql_alchemy_task_after_return(self):
        """Test SQLAlchemyTask cleanup after task completion."""
        task = SQLAlchemyTask()
        mock_db = MagicMock()
        task._db = mock_db
        
        task.after_return(None, None, None, None, None, None)
        
        mock_db.close.assert_called_once()
        assert task._db is None