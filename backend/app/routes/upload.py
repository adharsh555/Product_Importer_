# backend/app/routes/upload.py
from fastapi import APIRouter, UploadFile, File, HTTPException
import uuid, os
from ..tasks import import_csv_task, publish
from pathlib import Path

router = APIRouter()

UPLOAD_DIR = Path("/tmp/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

@router.post("/upload")
async def upload_csv(file: UploadFile = File(...)):
    # Save file stream to disk (do not load all in memory).
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files supported.")
    upload_id = str(uuid.uuid4())
    dest = UPLOAD_DIR / f"{upload_id}.csv"
    # stream to disk in chunks
    with open(dest, "wb") as f:
        while True:
            chunk = await file.read(1024*1024)
            if not chunk:
                break
            f.write(chunk)
    # Kick off async Celery task
    import_csv_task.delay(upload_id, str(dest))
    # Immediately notify client that processing has started
    publish(upload_id, {"status":"queued"})
    return {"upload_id": upload_id, "message": "file received, processing started"}
