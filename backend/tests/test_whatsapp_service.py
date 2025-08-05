import pytest
from unittest.mock import patch, MagicMock
import requests
from app.services.whatsapp import WhatsAppService


class TestWhatsAppService:
    """Test suite for WhatsApp service functionality."""
    
    @pytest.fixture
    def whatsapp_service(self):
        """Create a WhatsApp service instance with test configuration."""
        with patch.dict("os.environ", {
            "WHATSAPP_ACCESS_TOKEN": "test-token",
            "WHATSAPP_PHONE_NUMBER_ID": "test-phone-id",
            "WHATSAPP_API_VERSION": "v18.0"
        }):
            return WhatsAppService()
    
    def test_service_initialization(self, whatsapp_service):
        """Test WhatsApp service initializes with correct configuration."""
        assert whatsapp_service.access_token == "test-token"
        assert whatsapp_service.phone_number_id == "test-phone-id"
        assert whatsapp_service.api_version == "v18.0"
        assert whatsapp_service.base_url == "https://graph.facebook.com/v18.0/test-phone-id"
    
    @patch("requests.post")
    def test_send_message_success(self, mock_post, whatsapp_service):
        """Test successful message sending."""
        # Mock successful API response
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "messaging_product": "whatsapp",
            "contacts": [{"input": "+1234567890", "wa_id": "1234567890"}],
            "messages": [{"id": "wamid.123456"}]
        }
        mock_post.return_value = mock_response
        
        # Send message
        result = whatsapp_service.send_message("+1234567890", "Test message")
        
        # Assertions
        assert result["success"] is True
        assert "data" in result
        assert result["data"]["messages"][0]["id"] == "wamid.123456"
        
        # Verify API call
        mock_post.assert_called_once()
        call_args = mock_post.call_args
        assert call_args[0][0] == f"{whatsapp_service.base_url}/messages"
        assert call_args[1]["headers"]["Authorization"] == "Bearer test-token"
        assert call_args[1]["json"]["to"] == "1234567890"
        assert call_args[1]["json"]["text"]["body"] == "Test message"
    
    @patch("requests.post")
    def test_send_message_with_phone_formatting(self, mock_post, whatsapp_service):
        """Test phone number formatting removes non-numeric characters."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"messages": [{"id": "test-id"}]}
        mock_post.return_value = mock_response
        
        # Test various phone formats
        phone_formats = [
            ("+1 (234) 567-8900", "12345678900"),
            ("1-234-567-8900", "12345678900"),
            ("+44.7911.123456", "447911123456"),
            ("(555) 123 4567", "5551234567")
        ]
        
        for original, formatted in phone_formats:
            whatsapp_service.send_message(original, "Test")
            call_json = mock_post.call_args[1]["json"]
            assert call_json["to"] == formatted
    
    @patch("requests.post")
    def test_send_message_api_error(self, mock_post, whatsapp_service):
        """Test handling of API error responses."""
        # Mock error response
        mock_response = MagicMock()
        mock_response.status_code = 400
        mock_response.json.return_value = {
            "error": {
                "message": "Invalid phone number",
                "code": 100
            }
        }
        mock_response.text = '{"error": {"message": "Invalid phone number", "code": 100}}'
        mock_post.return_value = mock_response
        
        result = whatsapp_service.send_message("+invalid", "Test message")
        
        assert result["success"] is False
        assert result["error"] == "Invalid phone number"
        assert result["status_code"] == 400
        assert result["error_code"] == 100
    
    @patch("requests.post")
    def test_send_message_network_error(self, mock_post, whatsapp_service):
        """Test handling of network errors."""
        mock_post.side_effect = requests.exceptions.ConnectionError("Network error")
        
        result = whatsapp_service.send_message("+1234567890", "Test message")
        
        assert result["success"] is False
        assert "Network error" in result["error"]
        assert "debug_info" in result
    
    @patch("requests.post")
    def test_send_message_timeout(self, mock_post, whatsapp_service):
        """Test handling of request timeout."""
        mock_post.side_effect = requests.exceptions.Timeout("Request timed out")
        
        result = whatsapp_service.send_message("+1234567890", "Test message")
        
        assert result["success"] is False
        assert "Request timed out" in result["error"]
    
    @patch("requests.post")
    def test_send_template_message_success(self, mock_post, whatsapp_service):
        """Test successful template message sending."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "messages": [{"id": "template-msg-id"}]
        }
        mock_post.return_value = mock_response
        
        components = [{
            "type": "body",
            "parameters": [
                {"type": "text", "text": "John"}
            ]
        }]
        
        result = whatsapp_service.send_template_message(
            "+1234567890", 
            "hello_world",
            components
        )
        
        assert result["success"] is True
        assert result["data"]["messages"][0]["id"] == "template-msg-id"
        
        # Verify template payload
        call_json = mock_post.call_args[1]["json"]
        assert call_json["type"] == "template"
        assert call_json["template"]["name"] == "hello_world"
        assert call_json["template"]["components"] == components
    
    @patch("requests.post")
    def test_send_template_message_without_components(self, mock_post, whatsapp_service):
        """Test template message without components."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"messages": [{"id": "test-id"}]}
        mock_post.return_value = mock_response
        
        result = whatsapp_service.send_template_message("+1234567890", "simple_template")
        
        assert result["success"] is True
        call_json = mock_post.call_args[1]["json"]
        assert "components" not in call_json["template"]
    
    @patch("requests.get")
    def test_get_message_status_success(self, mock_get, whatsapp_service):
        """Test getting message status."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "id": "wamid.123456",
            "status": "delivered",
            "timestamp": "1234567890"
        }
        mock_get.return_value = mock_response
        
        result = whatsapp_service.get_message_status("wamid.123456")
        
        assert result["success"] is True
        assert result["data"]["status"] == "delivered"
        
        # Verify API call
        expected_url = f"https://graph.facebook.com/v18.0/wamid.123456"
        mock_get.assert_called_once_with(
            expected_url,
            headers={"Authorization": "Bearer test-token"}
        )
    
    @patch("requests.get")
    def test_get_message_status_error(self, mock_get, whatsapp_service):
        """Test error handling for message status retrieval."""
        mock_get.side_effect = requests.exceptions.HTTPError("404 Not Found")
        
        result = whatsapp_service.get_message_status("invalid-id")
        
        assert result["success"] is False
        assert "404 Not Found" in result["error"]
    
    def test_empty_access_token(self):
        """Test service behavior with missing access token."""
        with patch.dict("os.environ", {
            "WHATSAPP_ACCESS_TOKEN": "",
            "WHATSAPP_PHONE_NUMBER_ID": "test-phone-id"
        }):
            service = WhatsAppService()
            assert service.access_token == ""
    
    @patch("requests.post")
    def test_non_json_error_response(self, mock_post, whatsapp_service):
        """Test handling of non-JSON error responses."""
        mock_response = MagicMock()
        mock_response.status_code = 500
        mock_response.json.side_effect = ValueError("Invalid JSON")
        mock_response.text = "Internal Server Error"
        mock_post.return_value = mock_response
        
        result = whatsapp_service.send_message("+1234567890", "Test")
        
        assert result["success"] is False
        assert "HTTP 500" in result["error"]
        assert "Internal Server Error" in result["error"]