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

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://product-importer-csv-production.up.railway.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

app.include_router(upload_router, prefix="/api")
app.include_router(products_router, prefix="/api")
app.include_router(webhooks_router, prefix="/api")
app.include_router(events_router, prefix="/api")
