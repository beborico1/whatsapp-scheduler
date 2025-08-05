from datetime import datetime, timezone, timedelta
from sqlalchemy import create_engine, func
from sqlalchemy.orm import sessionmaker
from app.models import ScheduledMessage
from app.database import Base
import os
from dotenv import load_dotenv
import logging

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ScheduleMonitor:
    def __init__(self):
        database_url = os.getenv("DATABASE_URL", "postgresql://user:password@localhost/whatsapp_scheduler")
        self.engine = create_engine(database_url)
        Session = sessionmaker(bind=self.engine)
        self.session = Session()
    
    def analyze_timing_accuracy(self, hours_back=24):
        """Analyze timing accuracy of scheduled messages over the past N hours"""
        cutoff_time = datetime.now(timezone.utc) - timedelta(hours=hours_back)
        
        # Get all sent messages in the time period
        sent_messages = self.session.query(ScheduledMessage).filter(
            ScheduledMessage.status.in_(['sent', 'partially_sent']),
            ScheduledMessage.sent_at >= cutoff_time
        ).all()
        
        if not sent_messages:
            logger.info("No sent messages found in the specified period")
            return
        
        delays = []
        delay_buckets = {
            "on_time": 0,      # Within 10 seconds
            "slight": 0,       # 10-30 seconds
            "moderate": 0,     # 30-60 seconds
            "significant": 0,  # 1-3 minutes
            "severe": 0        # Over 3 minutes
        }
        
        for msg in sent_messages:
            if msg.sent_at and msg.scheduled_time:
                delay = (msg.sent_at - msg.scheduled_time).total_seconds()
                delays.append(delay)
                
                if delay <= 10:
                    delay_buckets["on_time"] += 1
                elif delay <= 30:
                    delay_buckets["slight"] += 1
                elif delay <= 60:
                    delay_buckets["moderate"] += 1
                elif delay <= 180:
                    delay_buckets["significant"] += 1
                else:
                    delay_buckets["severe"] += 1
                    logger.warning(f"Severe delay: Message {msg.id} delayed by {delay:.0f} seconds")
        
        if delays:
            avg_delay = sum(delays) / len(delays)
            max_delay = max(delays)
            min_delay = min(delays)
            
            logger.info(f"\n=== Schedule Timing Report (Past {hours_back} hours) ===")
            logger.info(f"Total messages analyzed: {len(sent_messages)}")
            logger.info(f"Average delay: {avg_delay:.1f} seconds")
            logger.info(f"Max delay: {max_delay:.1f} seconds")
            logger.info(f"Min delay: {min_delay:.1f} seconds")
            logger.info(f"\nDelay Distribution:")
            logger.info(f"  On time (≤10s): {delay_buckets['on_time']} ({delay_buckets['on_time']/len(sent_messages)*100:.1f}%)")
            logger.info(f"  Slight (10-30s): {delay_buckets['slight']} ({delay_buckets['slight']/len(sent_messages)*100:.1f}%)")
            logger.info(f"  Moderate (30-60s): {delay_buckets['moderate']} ({delay_buckets['moderate']/len(sent_messages)*100:.1f}%)")
            logger.info(f"  Significant (1-3m): {delay_buckets['significant']} ({delay_buckets['significant']/len(sent_messages)*100:.1f}%)")
            logger.info(f"  Severe (>3m): {delay_buckets['severe']} ({delay_buckets['severe']/len(sent_messages)*100:.1f}%)")
    
    def check_stuck_messages(self):
        """Check for messages that are stuck in pending state"""
        stuck_threshold = datetime.now(timezone.utc) - timedelta(minutes=5)
        
        stuck_messages = self.session.query(ScheduledMessage).filter(
            ScheduledMessage.status == 'pending',
            ScheduledMessage.scheduled_time <= stuck_threshold
        ).all()
        
        if stuck_messages:
            logger.warning(f"\n=== Stuck Messages Alert ===")
            logger.warning(f"Found {len(stuck_messages)} stuck messages:")
            for msg in stuck_messages:
                delay = (datetime.now(timezone.utc) - msg.scheduled_time).total_seconds() / 60
                logger.warning(f"  - Message {msg.id}: Scheduled {delay:.1f} minutes ago, Task ID: {msg.task_id}")
        else:
            logger.info("No stuck messages found")
    
    def close(self):
        self.session.close()

if __name__ == "__main__":
    monitor = ScheduleMonitor()
    try:
        monitor.analyze_timing_accuracy(hours_back=24)
        monitor.check_stuck_messages()
    finally:
        monitor.close()