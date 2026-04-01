"""Tests for two-tier model configuration."""

import os
from unittest.mock import patch


class TestTwoTierModelConfig:
    def test_defaults(self):
        """Both model fields have sensible defaults."""
        from app.config import Settings

        s = Settings(openrouter_api_key="k", jwt_secret="s", redis_password="p")
        assert s.openrouter_model_fast
        assert s.openrouter_model_full

    def test_env_override_fast(self):
        with patch.dict(os.environ, {"OPENROUTER_MODEL_FAST": "test/fast-model"}):
            from app.config import Settings

            s = Settings(openrouter_api_key="k", jwt_secret="s", redis_password="p")
            assert s.openrouter_model_fast == "test/fast-model"

    def test_env_override_full(self):
        with patch.dict(os.environ, {"OPENROUTER_MODEL_FULL": "test/full-model"}):
            from app.config import Settings

            s = Settings(openrouter_api_key="k", jwt_secret="s", redis_password="p")
            assert s.openrouter_model_full == "test/full-model"

    def test_old_single_model_field_removed(self):
        """The old openrouter_model field no longer exists."""
        from app.config import Settings

        s = Settings(openrouter_api_key="k", jwt_secret="s", redis_password="p")
        assert not hasattr(s, "openrouter_model")
