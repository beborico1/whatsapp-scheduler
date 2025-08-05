import pytest
import asyncio
from typing import Generator, AsyncGenerator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from app.database import Base, get_db
from app.models import Message, Recipient, RecipientGroup, Schedule
from main import app

# Test database URL - using SQLite for tests
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

# Create test engine
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

# Create test session
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session() -> Generator[Session, None, None]:
    """Create a clean database session for each test."""
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        # Drop all tables after test
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session: Session) -> TestClient:
    """Create a test client with database override."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    
    with TestClient(app) as test_client:
        yield test_client
    
    app.dependency_overrides.clear()


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


# Sample data fixtures
@pytest.fixture
def sample_message(db_session: Session) -> Message:
    """Create a sample message."""
    message = Message(
        name="Test Message",
        content="Hello, this is a test message!"
    )
    db_session.add(message)
    db_session.commit()
    db_session.refresh(message)
    return message


@pytest.fixture
def sample_recipient(db_session: Session) -> Recipient:
    """Create a sample recipient."""
    recipient = Recipient(
        name="John Doe",
        phone_number="+1234567890"
    )
    db_session.add(recipient)
    db_session.commit()
    db_session.refresh(recipient)
    return recipient


@pytest.fixture
def sample_group(db_session: Session, sample_recipient: Recipient) -> RecipientGroup:
    """Create a sample recipient group."""
    group = RecipientGroup(
        name="Test Group",
        recipients=[sample_recipient]
    )
    db_session.add(group)
    db_session.commit()
    db_session.refresh(group)
    return group


@pytest.fixture
def sample_schedule(
    db_session: Session, 
    sample_message: Message, 
    sample_group: RecipientGroup
) -> Schedule:
    """Create a sample schedule."""
    from datetime import datetime, timedelta
    
    schedule = Schedule(
        message_id=sample_message.id,
        group_id=sample_group.id,
        scheduled_time=datetime.utcnow() + timedelta(hours=1),
        status="pending"
    )
    db_session.add(schedule)
    db_session.commit()
    db_session.refresh(schedule)
    return schedule


# Mock fixtures for external services
@pytest.fixture
def mock_whatsapp_api(mocker):
    """Mock WhatsApp API calls."""
    mock = mocker.patch("app.services.whatsapp.WhatsAppService.send_message")
    mock.return_value = {
        "messaging_product": "whatsapp",
        "contacts": [{"input": "+1234567890", "wa_id": "1234567890"}],
        "messages": [{"id": "test-message-id"}]
    }
    return mock


@pytest.fixture
def mock_celery_task(mocker):
    """Mock Celery task execution."""
    mock = mocker.patch("app.tasks.whatsapp_tasks.send_whatsapp_message.delay")
    mock.return_value.id = "test-task-id"
    return mock