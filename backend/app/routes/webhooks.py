# backend/app/routes/webhooks.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import requests
import time

router = APIRouter()

# In-memory storage for simplicity (replace with DB if desired)
WEBHOOKS = {}
_next_id = 1

class WebhookIn(BaseModel):
    url: str
    event: str
    enabled: Optional[bool] = True

@router.get("/webhooks")
def list_hooks():
    return list(WEBHOOKS.values())

@router.post("/webhooks")
def create_hook(h: WebhookIn):
    global _next_id
    hook = h.dict()
    hook['id'] = _next_id
    WEBHOOKS[_next_id] = hook
    _next_id += 1
    return hook

@router.put("/webhooks/{id}")
def update_hook(id: int, h: WebhookIn):
    if id not in WEBHOOKS:
        raise HTTPException(status_code=404)
    hook = h.dict()
    hook['id'] = id
    WEBHOOKS[id] = hook
    return hook

@router.delete("/webhooks/{id}")
def delete_hook(id: int):
    if id not in WEBHOOKS:
        raise HTTPException(status_code=404)
    del WEBHOOKS[id]
    return {"status":"deleted"}

@router.post("/webhooks/{id}/test")
def test_hook(id: int):
    if id not in WEBHOOKS:
        raise HTTPException(status_code=404)
    hook = WEBHOOKS[id]
    try:
        start = time.time()
        resp = requests.post(hook['url'], json={"test":"ping","event":hook['event']}, timeout=5)
        elapsed = time.time() - start
        return {"status_code": resp.status_code, "response_time_ms": int(elapsed*1000), "body": resp.text[:1000]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
