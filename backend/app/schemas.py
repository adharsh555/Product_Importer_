# backend/app/schemas.py
from pydantic import BaseModel, HttpUrl
from typing import Optional, List

class ProductBase(BaseModel):
    sku: str
    name: str
    description: Optional[str] = None
    price: Optional[str] = None
    active: Optional[bool] = True

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str]
    description: Optional[str]
    price: Optional[str]
    active: Optional[bool]

class ProductOut(ProductBase):
    id: int
    class Config:
        orm_mode = True

class WebhookBase(BaseModel):
    url: HttpUrl
    event: str
    enabled: bool = True

class WebhookOut(WebhookBase):
    id: int
    class Config:
        orm_mode = True
