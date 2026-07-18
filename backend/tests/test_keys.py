from unittest.mock import MagicMock, patch

from app.config import get_api_keys, get_llm_client_and_model
from app.schemas import WorkflowDsl
from app.services.llm import extract_sop_from_transcript


def test_get_api_keys_parsing():
    # Test comma separation
    assert get_api_keys("key1,key2, key3 ") == ["key1", "key2", "key3"]
    # Test semicolon separation
    assert get_api_keys("key1;key2;key3") == ["key1", "key2", "key3"]
    # Test whitespace separation
    assert get_api_keys("key1 \n key2 \t key3") == ["key1", "key2", "key3"]
    # Test empty or None
    assert get_api_keys("") == []
    assert get_api_keys(None) == []


def test_get_llm_client_and_model_prefixes():
    # Test traditional Gemini key
    client, model = get_llm_client_and_model("AIzaSyOldPrefixKey")
    assert model == "gemini-3.5-flash"
    assert client.base_url == "https://generativelanguage.googleapis.com/v1beta/openai/"

    # Test new Gemini key prefix
    client, model = get_llm_client_and_model("AQ.NewPrefixKey")
    assert model == "gemini-3.5-flash"
    assert client.base_url == "https://generativelanguage.googleapis.com/v1beta/openai/"

    # Test default OpenAI fallback key
    client, model = get_llm_client_and_model("sk-proj-OpenAIKey")
    assert model == "gpt-4o-mini"
    assert str(client.base_url) == "https://api.openai.com/v1/"


@patch("app.services.llm.get_llm_client_and_model")
def test_extract_sop_rotation_fallback(mock_get_llm):
    # Setup mocks
    mock_client_fail = MagicMock()
    mock_client_fail.beta.chat.completions.parse.side_effect = Exception(
        "Rate limited or Auth failed"
    )

    mock_client_success = MagicMock()
    mock_choice = MagicMock()
    mock_parsed = MagicMock(spec=WorkflowDsl)
    mock_parsed.metadata = MagicMock(title="Success Title", description="Success Desc")
    mock_choice.message.parsed = mock_parsed
    mock_client_success.beta.chat.completions.parse.return_value = MagicMock(choices=[mock_choice])

    # First key fails, second key succeeds
    mock_get_llm.side_effect = [
        (mock_client_fail, "gemini-3.5-flash"),
        (mock_client_success, "gemini-3.5-flash"),
    ]

    # Call extract_sop_from_transcript with two keys
    result = extract_sop_from_transcript(
        "Some incident logs that need parsing.", "AQ.KeyFailed,AQ.KeySucceeded"
    )
    assert result == mock_parsed
    assert mock_get_llm.call_count == 2


@patch("app.routes.component.get_api_keys")
@patch("app.routes.component.get_llm_client_and_model")
@patch("app.routes.component.Settings")
def test_generate_component_rotation_fallback(mock_settings, mock_get_llm, mock_get_keys):
    # Configure mock settings
    mock_settings.return_value.openai_api_key = "AQ.KeyFailed,AQ.KeySucceeded"
    mock_get_keys.return_value = ["AQ.KeyFailed", "AQ.KeySucceeded"]

    mock_client_fail = MagicMock()
    mock_client_fail.beta.chat.completions.parse.side_effect = Exception("Key invalid")

    mock_client_success = MagicMock()
    mock_choice = MagicMock()
    mock_parsed = MagicMock()
    mock_parsed.code = "export default function Comp() {}"
    mock_parsed.component_name = "Comp"
    mock_choice.message.parsed = mock_parsed
    mock_client_success.beta.chat.completions.parse.return_value = MagicMock(choices=[mock_choice])

    mock_get_llm.side_effect = [
        (mock_client_fail, "gemini-3.5-flash"),
        (mock_client_success, "gemini-3.5-flash"),
    ]

    from app import create_app

    app = create_app()
    app.config["TESTING"] = True
    with app.test_client() as test_client:
        with patch("requests.get") as mock_get_auth:
            # Mock Auth check
            mock_get_auth.return_value.status_code = 200
            mock_get_auth.return_value.json.return_value = {
                "id": "user-uuid",
                "email": "user@example.com",
                "app_metadata": {"org_id": "org-uuid"},
            }

            res = test_client.post(
                "/api/v1/component/generate",
                json={"prompt": "Interactive graph component"},
                headers={"Authorization": "Bearer mock-token"},
            )
            assert res.status_code == 200
            assert res.json["code"] == "export default function Comp() {}"
            assert res.json["componentName"] == "Comp"
            assert mock_get_llm.call_count == 2
