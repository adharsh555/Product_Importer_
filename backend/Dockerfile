FROM python:3.11-slim

WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend /app

ENV PYTHONUNBUFFERED=1

# IMPORTANT: Run FastAPI + Celery worker together
CMD ["sh","-c","uvicorn app.main:app --host 0.0.0.0 --port $PORT & celery -A app.celery_app.celery_app worker --loglevel=info --pool=solo -Q imports --concurrency=1"]



