"""Celery worker entry point. Run with: celery -A worker worker --loglevel=info"""

import app.worker.tasks  # noqa: F401 — register tasks with celery
from app.worker.celery_app import celery_app

__all__ = ["celery_app"]
