"""Celery application configuration for async AI tasks."""

from celery import Celery

from app.config import settings

celery_app = Celery("ai_worker", broker=settings.celery_broker_url)
celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
)
