# backend/app/tasks.py
from .celery_app import celery_app
from .crud import upsert_products_bulk

import csv
import os
import redis
import json
from pathlib import Path

REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")
r = redis.from_url(REDIS_URL)


def publish(upload_id, payload):
    channel = f"upload:{upload_id}"
    r.publish(channel, json.dumps(payload))


@celery_app.task(bind=True)
def import_csv_task(self, upload_id, file_path, chunk_size=5000):
    total = 0

    try:
        # -------------------------------------------------
        # FAST LINE COUNT
        # -------------------------------------------------
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            for _ in f:
                total += 1

        if total == 0:
            publish(upload_id, {"status": "error", "message": "Empty file"})
            return {"status": "error", "message": "Empty file"}

        processed = 0
        publish(upload_id, {"status": "parsing", "total": total})

        # -------------------------------------------------
        # READ CSV + UPSERT CHUNKS
        # -------------------------------------------------
        with open(file_path, newline='', encoding='utf-8', errors='ignore') as csvfile:
            reader = csv.DictReader(csvfile)
            batch = []

            for row in reader:
                sku = (row.get("sku") or row.get("SKU") or "").strip()
                name = (row.get("name") or row.get("Name") or "").strip()

                if not sku or not name:
                    processed += 1
                    continue

                batch.append({
                    "sku": sku,
                    "name": name,
                    "description": row.get("description", ""),
                    "price": row.get("price", ""),
                    "active": True,
                })

                # Full chunk
                if len(batch) >= chunk_size:
                    upsert_products_bulk(batch)
                    processed += len(batch)
                    publish(upload_id, {
                        "status": "processing",
                        "processed": processed,
                        "total": total
                    })
                    batch = []

            # Leftover batch
            if batch:
                upsert_products_bulk(batch)
                processed += len(batch)
                publish(upload_id, {
                    "status": "processing",
                    "processed": processed,
                    "total": total
                })

        # -------------------------------------------------
        # COMPLETE
        # -------------------------------------------------
        publish(upload_id, {
            "status": "complete",
            "processed": processed,
            "total": total
        })

    except Exception as e:
        publish(upload_id, {"status": "error", "message": str(e)})
        raise

    finally:
        # -------------------------------------------------
        # CLEANUP TEMP FILE
        # -------------------------------------------------
        try:
            Path(file_path).unlink(missing_ok=True)
        except Exception:
            pass

    return {
        "status": "complete",
        "processed": processed,
        "total": total
    }
