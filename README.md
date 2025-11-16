
# Acme Product Importer

**Live Demo**: https://product-importer-csv-production.up.railway.app/  
**Repository**: https://github.com/adharsh555/Product_Importer

A minimal, containerized product importer built with FastAPI, Celery, Redis, PostgreSQL, and a React + Vite frontend. Supports large CSV uploads, background processing with real-time progress (SSE), product CRUD, webhook notifications, and persistent file storage via volumes.

## Features

- **Streaming CSV upload** (memory-efficient, chunked)
- **Background import** using Celery + Redis
- **Real-time progress updates** via Server-Sent Events (SSE)
- **SKU-based upsert** (create or update)
- **Product listing** with pagination and CRUD
- **Webhook configuration** + test endpoint
- **Fully containerized** with Docker and deployable on Railway
- **Persistent upload directory** using mounted volumes

## Tech Stack

**Backend**: FastAPI, SQLAlchemy, Celery  
**Database**: PostgreSQL  
**Broker/Worker**: Redis + Celery  
**Frontend**: React (Vite)  
**Deployment**: Docker, Railway

## Quick Start

### Prerequisites
- Python 3.9+, Node 16+, Docker + Docker Compose

### Local Development

**Backend**:
```bash
python -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt
docker-compose up -d postgres redis
uvicorn backend.app.main:app --reload
celery -A backend.app.celery_app.celery_app worker --loglevel=info -Q imports --pool=solo
```

**Frontend**:
```bash
cd frontend
npm install
npm run dev
```

### Docker
```bash
docker-compose up --build
```

Access the UI at http://localhost:5173 and API docs at http://localhost:8000/docs.

## Environment Variables

**Backend**: `DATABASE_URL`, `REDIS_URL`, `UPLOAD_PATH`  
**Frontend**: `VITE_API_URL=http://localhost:8000/api`

## Deployment (Railway)

Deploy backend with Dockerfile, attach PostgreSQL & Redis services, mount volume to `/tmp/uploads`, and set start command:
```bash
sh -c "uvicorn app.main:app --host 0.0.0.0 --port $PORT & celery -A app.celery_app.celery_app worker --loglevel=info -Q imports"
```

Deploy frontend as Static Site from `frontend/` directory with build command `npm install && npm run build`.

## Contact

**Adharsh Ajay**  
Email: adharshajay55@gmail.com  
Phone: +91 8138090299

