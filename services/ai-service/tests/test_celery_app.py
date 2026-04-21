"""Tests for Celery app configuration."""


class TestCeleryAppConfig:
    def test_celery_app_instantiates(self):
        from app.worker.celery_app import celery_app

        assert celery_app is not None
        assert celery_app.main == "ai_worker"

    def test_broker_url_from_settings(self):
        from app.worker.celery_app import celery_app

        assert "redis://" in celery_app.conf.broker_url

    def test_task_serializer_is_json(self):
        from app.worker.celery_app import celery_app

        assert celery_app.conf.task_serializer == "json"

    def test_accepts_only_json(self):
        from app.worker.celery_app import celery_app

        assert celery_app.conf.accept_content == ["json"]

    def test_acks_late_enabled(self):
        from app.worker.celery_app import celery_app

        assert celery_app.conf.task_acks_late is True

    def test_prefetch_multiplier_one(self):
        from app.worker.celery_app import celery_app

        assert celery_app.conf.worker_prefetch_multiplier == 1


class TestCeleryConfig:
    def test_broker_url_default(self):
        from app.config import settings

        assert hasattr(settings, "celery_broker_url")

    def test_result_ttl_default(self):
        from app.config import settings

        assert settings.celery_result_ttl == 3600
