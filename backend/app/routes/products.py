# backend/app/routes/products.py
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List
from sqlalchemy import func

from ..db import SessionLocal
from ..models import Product

router = APIRouter()


# -------------------------
# Pydantic Schemas
# -------------------------
class ProductIn(BaseModel):
    sku: str
    name: str
    description: Optional[str] = ""
    price: Optional[str] = ""
    active: Optional[bool] = True


class ProductOut(BaseModel):
    sku: str
    name: str
    description: Optional[str] = ""
    price: Optional[str] = ""
    active: Optional[bool] = True


# -------------------------
# LIST PRODUCTS
# -------------------------
@router.get("/products", response_model=List[ProductOut])
def list_products(
    skip: int = 0,
    limit: int = 25,
    sku: str = "",
    name: str = "",
    description: str = "",
    active: Optional[bool] = None
):
    sess = SessionLocal()
    try:
        q = sess.query(Product)

        if sku:
            q = q.filter(func.lower(Product.sku).like(f"%{sku.lower()}%"))
        if name:
            q = q.filter(func.lower(Product.name).like(f"%{name.lower()}%"))
        if description:
            q = q.filter(func.lower(Product.description).like(f"%{description.lower()}%"))
        if active is not None:
            q = q.filter(Product.active == active)

        results = (
            q.order_by(Product.id.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

        return [
            {
                "sku": r.sku,
                "name": r.name,
                "description": r.description or "",
                "price": r.price or "",
                "active": r.active,
            }
            for r in results
        ]
    finally:
        sess.close()


# -------------------------
# CREATE PRODUCT
# -------------------------
@router.post("/products", response_model=ProductOut)
def create_product(payload: ProductIn):
    sess = SessionLocal()
    try:
        sku_norm = payload.sku.strip().lower()

        existing = (
            sess.query(Product)
            .filter(func.lower(Product.sku) == sku_norm)
            .first()
        )

        if existing:
            raise HTTPException(
                status_code=400,
                detail="SKU already exists (case-insensitive). Use update instead.",
            )

        p = Product(
            sku=sku_norm,
            name=payload.name,
            description=payload.description,
            price=payload.price,
            active=payload.active
        )

        sess.add(p)
        sess.commit()
        sess.refresh(p)

        return {
            "sku": p.sku,
            "name": p.name,
            "description": p.description or "",
            "price": p.price or "",
            "active": p.active,
        }
    finally:
        sess.close()


# -------------------------
# UPDATE PRODUCT
# -------------------------
@router.put("/products/{sku}", response_model=ProductOut)
def update_product(sku: str, payload: ProductIn):
    sess = SessionLocal()
    try:
        sku_norm = sku.strip().lower()

        p = (
            sess.query(Product)
            .filter(func.lower(Product.sku) == sku_norm)
            .first()
        )

        if not p:
            raise HTTPException(status_code=404, detail="Product not found")

        # Check if SKU is being changed
        new_sku = payload.sku.strip().lower()
        if new_sku != p.sku.lower():
            conflict = (
                sess.query(Product)
                .filter(func.lower(Product.sku) == new_sku)
                .first()
            )
            if conflict:
                raise HTTPException(
                    status_code=400,
                    detail="New SKU conflicts with existing product (case-insensitive)",
                )
            p.sku = new_sku

        p.name = payload.name
        p.description = payload.description
        p.price = payload.price
        p.active = payload.active

        sess.commit()
        sess.refresh(p)

        return {
            "sku": p.sku,
            "name": p.name,
            "description": p.description or "",
            "price": p.price or "",
            "active": p.active,
        }
    finally:
        sess.close()


# -------------------------
# DELETE SINGLE PRODUCT
# -------------------------
@router.delete("/products/{sku}")
def delete_product(sku: str):
    sess = SessionLocal()
    try:
        p = (
            sess.query(Product)
            .filter(func.lower(Product.sku) == sku.strip().lower())
            .first()
        )

        if not p:
            raise HTTPException(status_code=404, detail="Product not found")

        sess.delete(p)
        sess.commit()

        return {"status": "ok", "deleted": sku}
    finally:
        sess.close()


# -------------------------
# DELETE ALL PRODUCTS
# -------------------------
@router.delete("/products")
def delete_all_products(confirm: bool = False):
    if not confirm:
        raise HTTPException(status_code=400, detail="Missing ?confirm=true")

    from ..db import SessionLocal
    db = SessionLocal()

    try:
        db.query(Product).delete()
        db.commit()
        return {"status": "success", "message": "All products deleted"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()

