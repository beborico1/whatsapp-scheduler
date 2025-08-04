from fastapi import APIRouter
import os
from app.services.whatsapp import whatsapp_service

router = APIRouter()

@router.get("/whatsapp-config")
def check_whatsapp_config():
    """Check WhatsApp configuration (for debugging)"""
    return {
        "api_version": os.getenv("WHATSAPP_API_VERSION", "v18.0"),
        "phone_number_id": os.getenv("WHATSAPP_PHONE_NUMBER_ID"),
        "access_token_present": bool(os.getenv("WHATSAPP_ACCESS_TOKEN")),
        "access_token_length": len(os.getenv("WHATSAPP_ACCESS_TOKEN", "")),
        "base_url": whatsapp_service.base_url
    }

@router.post("/test-whatsapp")
def test_whatsapp_message():
    """Test sending a WhatsApp message with hello_world template"""
    # Use the hello_world template which doesn't require parameters
    result = whatsapp_service.send_template_message(
        recipient_phone="+526622271342",  # Your test number
        template_name="hello_world"
    )
    return result