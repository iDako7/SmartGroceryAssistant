import pytest
from pydantic import ValidationError
from app.schemas.translate import TranslateRequest, TranslateResponse


def test_translate_request_valid():
    req = TranslateRequest(text="chicken breast")
    assert req.text == "chicken breast"


def test_translate_request_empty_rejected():
    with pytest.raises(ValidationError):
        TranslateRequest(text="")


def test_translate_response_valid():
    resp = TranslateResponse(name_en="Chicken breast", name_zh="鸡胸肉")
    assert resp.name_en == "Chicken breast"
    assert resp.name_zh == "鸡胸肉"
