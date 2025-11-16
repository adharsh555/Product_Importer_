from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .db import engine, Base
from . import models

from .routes.upload import router as upload_router
from .routes.products import router as products_router
from .routes.webhooks import router as webhooks_router
from .routes.events import router as events_router

app = FastAPI(title="Acme Product Importer")

@app.get("/api/health")
def health():
    return {"status": "ok"}

# IMPORTANT — your real frontend domain:
FRONTEND_URL = "https://product-importer-csv-production.up.railway.app"

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",   # local dev
        FRONTEND_URL,              # deployed frontend
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize DB models
Base.metadata.create_all(bind=engine)

# Routes
app.include_router(upload_router, prefix="/api")
app.include_router(products_router, prefix="/api")
app.include_router(webhooks_router, prefix="/api")
app.include_router(events_router, prefix="/api")
