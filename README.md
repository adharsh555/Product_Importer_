
# Acme Product Importer

A minimal, containerized product importer built with FastAPI, React, Celery, Redis, and PostgreSQL. Supports large CSV uploads (up to 500,000 records), real-time progress updates, product management, bulk deletion, and webhook configuration.

## Features

- **Large CSV upload** with progress tracking
- **Real-time status updates** using Redis Pub/Sub
- **Automatic SKU-based upsert** (case-insensitive)
- **Product CRUD** with filtering and pagination
- **Bulk delete** with confirmation
- **Webhook creation, editing, testing, and deletion**
- **Fully containerized** with Docker Compose

## Tech Stack

### Backend
- FastAPI
- SQLAlchemy
- Celery
- Redis
- PostgreSQL

### Frontend
- React + Vite
- Fetch API
- Minimal CSS

## Getting Started

### 1. Install Docker Desktop

Download and install Docker Desktop from:  
https://www.docker.com/products/docker-desktop/

### 2. Clone the repository

```bash
git clone https://github.com/<your-username>/acme-product-importer.git
cd acme-product-importer
```

### 3. Start the application

```bash
docker compose up --build
```

### 4. Access the UI

- **Frontend**: http://localhost:5173
- **API Docs**: http://localhost:8000/docs

## Project Structure

```
backend/     - FastAPI application, Celery tasks, database models  
frontend/    - React UI (Vite)  
docker-compose.yml
```

## Stopping Containers

```bash
docker compose down
```

To remove database + uploads:

```bash
docker compose down -v
```

## Notes

- Designed for handling very large CSV files without UI freeze
- SKU uniqueness and overwrite logic are enforced
- Webhook tester works with tools like webhook.site
- Minimal UI kept intentionally simple for clarity and assignment requirements

