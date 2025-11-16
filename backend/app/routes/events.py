# backend/app/routes/events.py
from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
import redis
import os
import json
import asyncio

router = APIRouter()
REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")
r = redis.from_url(REDIS_URL, decode_responses=True)

@router.get("/events/{upload_id}")
async def events(upload_id: str, request: Request):
    """
    SSE endpoint that subscribes to Redis channel "upload:{upload_id}"
    """
    pubsub = r.pubsub()
    channel = f"upload:{upload_id}"
    pubsub.subscribe(channel)

    async def event_generator():
        try:
            while True:
                if await request.is_disconnected():
                    break
                message = pubsub.get_message(timeout=1.0)
                if message and message.get("type") == "message":
                    data = message.get("data")
                    yield f"data: {data}\n\n"
                await asyncio.sleep(0.1)
        finally:
            try:
                pubsub.unsubscribe(channel)
                pubsub.close()
            except Exception:
                pass
    return StreamingResponse(event_generator(), media_type="text/event-stream")
