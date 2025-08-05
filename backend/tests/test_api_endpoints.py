import pytest
from datetime import datetime, timedelta, timezone
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

from app.models import Message, Recipient, RecipientGroup, ScheduledMessage


class TestSchedulesAPI:
    """Test suite for schedule-related API endpoints."""
    
    def test_create_scheduled_message_success(
        self, 
        client: TestClient, 
        sample_message: Message, 
        sample_group: RecipientGroup
    ):
        """Test successful creation of a scheduled message."""
        future_time = datetime.now(timezone.utc) + timedelta(hours=1)
        
        payload = {
            "message_id": sample_message.id,
            "group_id": sample_group.id,
            "scheduled_time": future_time.isoformat()
        }
        
        response = client.post("/api/schedules/", json=payload)
        
        assert response.status_code == 200
        data = response.json()
        assert data["message_id"] == sample_message.id
        assert data["group_id"] == sample_group.id
        assert data["status"] == "pending"
        assert "id" in data
    
    def test_create_scheduled_message_past_time(
        self, 
        client: TestClient, 
        sample_message: Message, 
        sample_group: RecipientGroup
    ):
        """Test that scheduling a message in the past fails."""
        past_time = datetime.now(timezone.utc) - timedelta(hours=1)
        
        payload = {
            "message_id": sample_message.id,
            "group_id": sample_group.id,
            "scheduled_time": past_time.isoformat()
        }
        
        response = client.post("/api/schedules/", json=payload)
        
        assert response.status_code == 400
        assert "future" in response.json()["detail"].lower()
    
    def test_create_scheduled_message_invalid_message(
        self, 
        client: TestClient, 
        sample_group: RecipientGroup
    ):
        """Test creation with non-existent message ID."""
        future_time = datetime.now(timezone.utc) + timedelta(hours=1)
        
        payload = {
            "message_id": 9999,
            "group_id": sample_group.id,
            "scheduled_time": future_time.isoformat()
        }
        
        response = client.post("/api/schedules/", json=payload)
        
        assert response.status_code == 404
        assert "Message not found" in response.json()["detail"]
    
    def test_create_scheduled_message_invalid_group(
        self, 
        client: TestClient, 
        sample_message: Message
    ):
        """Test creation with non-existent group ID."""
        future_time = datetime.now(timezone.utc) + timedelta(hours=1)
        
        payload = {
            "message_id": sample_message.id,
            "group_id": 9999,
            "scheduled_time": future_time.isoformat()
        }
        
        response = client.post("/api/schedules/", json=payload)
        
        assert response.status_code == 404
        assert "group not found" in response.json()["detail"].lower()
    
    def test_get_scheduled_messages(
        self, 
        client: TestClient, 
        sample_schedule: ScheduledMessage
    ):
        """Test retrieving list of scheduled messages."""
        response = client.get("/api/schedules/")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        assert any(item["id"] == sample_schedule.id for item in data)
    
    def test_get_scheduled_messages_with_filter(
        self, 
        client: TestClient, 
        db_session,
        sample_message,
        sample_group
    ):
        """Test filtering scheduled messages by status."""
        # Create messages with different statuses
        statuses = ["pending", "sent", "failed"]
        for status in statuses:
            scheduled = ScheduledMessage(
                message_id=sample_message.id,
                group_id=sample_group.id,
                scheduled_time=datetime.now(timezone.utc) + timedelta(hours=1),
                status=status
            )
            db_session.add(scheduled)
        db_session.commit()
        
        # Test filtering
        response = client.get("/api/schedules/?status=pending")
        
        assert response.status_code == 200
        data = response.json()
        assert all(item["status"] == "pending" for item in data)
    
    def test_get_scheduled_message_by_id(
        self, 
        client: TestClient, 
        sample_schedule: ScheduledMessage
    ):
        """Test retrieving a specific scheduled message."""
        response = client.get(f"/api/schedules/{sample_schedule.id}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == sample_schedule.id
        assert data["message_id"] == sample_schedule.message_id
        assert data["group_id"] == sample_schedule.group_id
    
    def test_get_scheduled_message_not_found(self, client: TestClient):
        """Test retrieving non-existent scheduled message."""
        response = client.get("/api/schedules/9999")
        
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()
    
    def test_cancel_scheduled_message(
        self, 
        client: TestClient, 
        sample_schedule: ScheduledMessage
    ):
        """Test cancelling a pending scheduled message."""
        response = client.put(f"/api/schedules/{sample_schedule.id}/cancel")
        
        assert response.status_code == 200
        assert "cancelled" in response.json()["message"].lower()
        
        # Verify status was updated
        get_response = client.get(f"/api/schedules/{sample_schedule.id}")
        assert get_response.json()["status"] == "cancelled"
    
    def test_cancel_non_pending_message(
        self, 
        client: TestClient, 
        db_session,
        sample_schedule: ScheduledMessage
    ):
        """Test that only pending messages can be cancelled."""
        sample_schedule.status = "sent"
        db_session.commit()
        
        response = client.put(f"/api/schedules/{sample_schedule.id}/cancel")
        
        assert response.status_code == 400
        assert "only cancel pending" in response.json()["detail"].lower()
    
    @patch("app.api.schedules.send_scheduled_message.delay")
    def test_send_now(
        self, 
        mock_delay, 
        client: TestClient, 
        sample_schedule: ScheduledMessage
    ):
        """Test sending a scheduled message immediately."""
        mock_task = MagicMock()
        mock_task.id = "test-task-123"
        mock_delay.return_value = mock_task
        
        response = client.post(f"/api/schedules/{sample_schedule.id}/send-now")
        
        assert response.status_code == 200
        assert "queued" in response.json()["message"].lower()
        assert response.json()["task_id"] == "test-task-123"
        
        mock_delay.assert_called_once_with(sample_schedule.id)
    
    def test_send_now_invalid_status(
        self, 
        client: TestClient, 
        db_session,
        sample_schedule: ScheduledMessage
    ):
        """Test that only pending or failed messages can be sent immediately."""
        sample_schedule.status = "sent"
        db_session.commit()
        
        response = client.post(f"/api/schedules/{sample_schedule.id}/send-now")
        
        assert response.status_code == 400
        assert "pending or failed" in response.json()["detail"].lower()
    
    def test_archive_scheduled_message(
        self, 
        client: TestClient, 
        sample_schedule: ScheduledMessage
    ):
        """Test archiving a scheduled message."""
        response = client.put(f"/api/schedules/{sample_schedule.id}/archive")
        
        assert response.status_code == 200
        assert "archived" in response.json()["message"].lower()
        
        # Verify status was updated
        get_response = client.get(f"/api/schedules/{sample_schedule.id}")
        assert get_response.json()["status"] == "archived"
    
    def test_archive_already_archived(
        self, 
        client: TestClient, 
        db_session,
        sample_schedule: ScheduledMessage
    ):
        """Test archiving an already archived message."""
        sample_schedule.status = "archived"
        db_session.commit()
        
        response = client.put(f"/api/schedules/{sample_schedule.id}/archive")
        
        assert response.status_code == 400
        assert "already archived" in response.json()["detail"].lower()
    
    def test_delete_scheduled_message(
        self, 
        client: TestClient, 
        db_session,
        sample_schedule: ScheduledMessage
    ):
        """Test deleting a scheduled message."""
        schedule_id = sample_schedule.id
        
        response = client.delete(f"/api/schedules/{schedule_id}")
        
        assert response.status_code == 200
        assert "deleted" in response.json()["message"].lower()
        
        # Verify deletion
        get_response = client.get(f"/api/schedules/{schedule_id}")
        assert get_response.status_code == 404
    
    def test_delete_sent_message(
        self, 
        client: TestClient, 
        db_session,
        sample_schedule: ScheduledMessage
    ):
        """Test that sent messages cannot be deleted."""
        sample_schedule.status = "sent"
        db_session.commit()
        
        response = client.delete(f"/api/schedules/{sample_schedule.id}")
        
        assert response.status_code == 400
        assert "cannot delete sent" in response.json()["detail"].lower()


class TestMessagesAPI:
    """Test suite for message-related API endpoints."""
    
    def test_create_message(self, client: TestClient):
        """Test creating a new message."""
        payload = {
            "name": "Test Message",
            "content": "This is a test message content"
        }
        
        response = client.post("/api/messages/", json=payload)
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == payload["name"]
        assert data["content"] == payload["content"]
        assert "id" in data
    
    def test_create_message_validation(self, client: TestClient):
        """Test message creation validation."""
        # Missing required fields
        response = client.post("/api/messages/", json={})
        assert response.status_code == 422
        
        # Empty name
        response = client.post("/api/messages/", json={"name": "", "content": "Test"})
        assert response.status_code == 422
    
    def test_get_messages(self, client: TestClient, sample_message: Message):
        """Test retrieving list of messages."""
        response = client.get("/api/messages/")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert any(item["id"] == sample_message.id for item in data)
    
    def test_get_message_by_id(self, client: TestClient, sample_message: Message):
        """Test retrieving a specific message."""
        response = client.get(f"/api/messages/{sample_message.id}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == sample_message.id
        assert data["name"] == sample_message.name
        assert data["content"] == sample_message.content
    
    def test_update_message(self, client: TestClient, sample_message: Message):
        """Test updating a message."""
        payload = {
            "name": "Updated Message",
            "content": "Updated content"
        }
        
        response = client.put(f"/api/messages/{sample_message.id}", json=payload)
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == payload["name"]
        assert data["content"] == payload["content"]
    
    def test_delete_message(self, client: TestClient, db_session):
        """Test deleting a message."""
        message = Message(name="To Delete", content="Delete me")
        db_session.add(message)
        db_session.commit()
        message_id = message.id
        
        response = client.delete(f"/api/messages/{message_id}")
        
        assert response.status_code == 200
        
        # Verify deletion
        get_response = client.get(f"/api/messages/{message_id}")
        assert get_response.status_code == 404


class TestRecipientsAPI:
    """Test suite for recipient-related API endpoints."""
    
    def test_create_recipient(self, client: TestClient):
        """Test creating a new recipient."""
        payload = {
            "name": "John Doe",
            "phone_number": "+1234567890"
        }
        
        response = client.post("/api/recipients/", json=payload)
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == payload["name"]
        assert data["phone_number"] == payload["phone_number"]
    
    def test_get_recipients(self, client: TestClient, sample_recipient: Recipient):
        """Test retrieving list of recipients."""
        response = client.get("/api/recipients/")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert any(item["id"] == sample_recipient.id for item in data)
    
    def test_create_group(self, client: TestClient, sample_recipient: Recipient):
        """Test creating a recipient group."""
        payload = {
            "name": "Test Group",
            "recipient_ids": [sample_recipient.id]
        }
        
        response = client.post("/api/recipients/groups/", json=payload)
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == payload["name"]
        assert len(data["recipients"]) == 1
        assert data["recipients"][0]["id"] == sample_recipient.id
    
    def test_get_groups(self, client: TestClient, sample_group: RecipientGroup):
        """Test retrieving list of groups."""
        response = client.get("/api/recipients/groups/")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert any(item["id"] == sample_group.id for item in data)