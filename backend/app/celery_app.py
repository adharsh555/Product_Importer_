# backend/app/celery_app.py
from celery import Celery
import os

REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")

# IMPORTANT: include=["app.tasks"] ensures tasks load
celery_app = Celery(
    "worker",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=["app.tasks"]
)

# Route all tasks starting with app.tasks.* to imports queue
celery_app.conf.task_routes = {
    "app.tasks.*": {"queue": "imports"}
}

# Ensure tasks are processed one-by-one
celery_app.conf.worker_prefetch_multiplier = 1
