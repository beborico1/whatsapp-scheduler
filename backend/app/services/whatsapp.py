import os
import requests
from typing import List, Dict, Any
from dotenv import load_dotenv

load_dotenv()

class WhatsAppService:
    def __init__(self):
        self.access_token = os.getenv("WHATSAPP_ACCESS_TOKEN")
        self.phone_number_id = os.getenv("WHATSAPP_PHONE_NUMBER_ID")
        self.api_version = os.getenv("WHATSAPP_API_VERSION", "v18.0")
        self.base_url = f"https://graph.facebook.com/{self.api_version}/{self.phone_number_id}"
        
    def send_message(self, recipient_phone: str, message_text: str) -> Dict[str, Any]:
        """Send a text message to a WhatsApp recipient"""
        url = f"{self.base_url}/messages"
        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json"
        }
        
        # Format phone number (remove any non-numeric characters)
        formatted_phone = ''.join(filter(str.isdigit, recipient_phone))
        
        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": formatted_phone,
            "type": "text",
            "text": {
                "preview_url": False,
                "body": message_text
            }
        }
        
        try:
            response = requests.post(url, headers=headers, json=payload)
            response.raise_for_status()
            return {"success": True, "data": response.json()}
        except requests.exceptions.RequestException as e:
            return {"success": False, "error": str(e), "details": response.text if 'response' in locals() else None}
    
    def send_template_message(self, recipient_phone: str, template_name: str, components: List[Dict] = None) -> Dict[str, Any]:
        """Send a template message to a WhatsApp recipient"""
        url = f"{self.base_url}/messages"
        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json"
        }
        
        formatted_phone = ''.join(filter(str.isdigit, recipient_phone))
        
        payload = {
            "messaging_product": "whatsapp",
            "to": formatted_phone,
            "type": "template",
            "template": {
                "name": template_name,
                "language": {
                    "code": "en_US"
                }
            }
        }
        
        if components:
            payload["template"]["components"] = components
        
        try:
            response = requests.post(url, headers=headers, json=payload)
            response.raise_for_status()
            return {"success": True, "data": response.json()}
        except requests.exceptions.RequestException as e:
            return {"success": False, "error": str(e), "details": response.text if 'response' in locals() else None}
    
    def get_message_status(self, message_id: str) -> Dict[str, Any]:
        """Get the status of a sent message"""
        url = f"https://graph.facebook.com/{self.api_version}/{message_id}"
        headers = {
            "Authorization": f"Bearer {self.access_token}"
        }
        
        try:
            response = requests.get(url, headers=headers)
            response.raise_for_status()
            return {"success": True, "data": response.json()}
        except requests.exceptions.RequestException as e:
            return {"success": False, "error": str(e)}

whatsapp_service = WhatsAppService()