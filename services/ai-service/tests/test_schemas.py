"""Schema validation tests for translate and item-info payloads."""

import pytest
from pydantic import ValidationError
from app.schemas.translate import TranslateRequest, TranslateResponse
from app.schemas.item_info import ItemInfoRequest, ItemInfoResponse


def test_translate_request_valid():
    """Checks a non-empty translate input is accepted as-is."""
    req = TranslateRequest(text="chicken breast")
    assert req.text == "chicken breast"


def test_translate_request_empty_rejected():
    """Checks translate input rejects empty text via Pydantic validation."""
    with pytest.raises(ValidationError):
        TranslateRequest(text="")


def test_translate_response_valid():
    """Checks the translate response schema stores both language fields."""
    resp = TranslateResponse(name_en="Chicken breast", name_zh="鸡胸肉")
    assert resp.name_en == "Chicken breast"
    assert resp.name_zh == "鸡胸肉"


# --- Item Info ---


def test_item_info_request_minimal():
    """Checks minimal item-info input uses defaults when optional fields are omitted."""
    req = ItemInfoRequest(name_en="Ranch Dressing")
    assert req.name_en == "Ranch Dressing"
    assert req.name_zh is None
    assert req.language_preference == "en"


def test_item_info_request_full():
    """Checks item-info input accepts bilingual names and an explicit language preference."""
    req = ItemInfoRequest(name_en="Ranch Dressing", name_zh="牧场沙拉酱", language_preference="en-zh")
    assert req.language_preference == "en-zh"


def test_item_info_request_invalid_language():
    """Checks item-info input rejects unsupported language preference values."""
    with pytest.raises(ValidationError):
        ItemInfoRequest(name_en="Ranch", language_preference="fr")


def test_item_info_response_valid():
    """Checks the item-info response schema accepts all required descriptive fields."""
    resp = ItemInfoResponse(
        taste="Creamy and tangy",
        usage="Great as a dip or salad dressing",
        picking="Check expiration date",
        storage="Refrigerate after opening",
        funFact="Originally created at a ranch in California",
    )
    assert resp.taste == "Creamy and tangy"
