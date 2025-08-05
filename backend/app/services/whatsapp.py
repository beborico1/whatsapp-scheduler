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
        
        # Log configuration for debugging
        print(f"WhatsApp Service initialized:")
        print(f"- API Version: {self.api_version}")
        print(f"- Phone Number ID: {self.phone_number_id}")
        print(f"- Access Token: {'Present' if self.access_token else 'Missing'}")
        print(f"- Base URL: {self.base_url}")
        
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
        
        # Enhanced debug logging
        print(f"DEBUG: WhatsApp API Call Starting:")
        print(f"DEBUG: - URL: {url}")
        print(f"DEBUG: - Phone (original): {recipient_phone}")
        print(f"DEBUG: - Phone (formatted): {formatted_phone}")
        print(f"DEBUG: - Auth token present: {bool(self.access_token)}")
        print(f"DEBUG: - Auth token length: {len(self.access_token) if self.access_token else 0}")
        print(f"DEBUG: - Phone Number ID: {self.phone_number_id}")
        print(f"DEBUG: - API Version: {self.api_version}")
        print(f"DEBUG: - Message content length: {len(message_text)}")
        print(f"DEBUG: - Full payload: {payload}")
        
        try:
            print(f"DEBUG: Making POST request to WhatsApp API...")
            response = requests.post(url, headers=headers, json=payload, timeout=30)
            
            print(f"DEBUG: Response received:")
            print(f"DEBUG: - Status Code: {response.status_code}")
            print(f"DEBUG: - Response Headers: {dict(response.headers)}")
            print(f"DEBUG: - Response Body: {response.text}")
            
            response.raise_for_status()
            result_data = response.json()
            print(f"DEBUG: WhatsApp API SUCCESS - Message sent successfully")
            return {"success": True, "data": result_data}
            
        except requests.exceptions.RequestException as e:
            error_details = {
                "error_type": type(e).__name__,
                "error_message": str(e),
                "status_code": getattr(response, 'status_code', None) if 'response' in locals() else None,
                "response_text": getattr(response, 'text', None) if 'response' in locals() else None,
                "response_headers": dict(getattr(response, 'headers', {})) if 'response' in locals() else None
            }
            
            print(f"DEBUG: WhatsApp API ERROR:")
            print(f"DEBUG: - Error type: {error_details['error_type']}")
            print(f"DEBUG: - Error message: {error_details['error_message']}")
            print(f"DEBUG: - Status code: {error_details['status_code']}")
            print(f"DEBUG: - Response text: {error_details['response_text']}")
            print(f"DEBUG: - Response headers: {error_details['response_headers']}")
            
            return {
                "success": False, 
                "error": str(e), 
                "details": error_details['response_text'],
                "status_code": error_details['status_code'],
                "debug_info": error_details
            }
    
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