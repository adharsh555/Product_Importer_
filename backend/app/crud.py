# backend/app/crud.py
from sqlalchemy import create_engine, MetaData, Table
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import sessionmaker
from sqlalchemy.future import select
from sqlalchemy.exc import IntegrityError
from .models import Product
import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@db:5432/postgres")
engine = create_engine(DATABASE_URL, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


# ---------------------------------------------------------
# GET PRODUCTS (FILTER + PAGINATION)
# ---------------------------------------------------------
def get_products(skip: int = 0, limit: int = 50, filters: dict = None):
    filters = filters or {}
    with SessionLocal() as db:
        q = select(Product)

        if "sku" in filters:
            q = q.where(Product.sku_lower.like(f"%{filters['sku'].lower()}%"))
        if "name" in filters:
            q = q.where(Product.name.ilike(f"%{filters['name']}%"))
        if "description" in filters:
            q = q.where(Product.description.ilike(f"%{filters['description']}%"))
        if "active" in filters:
            q = q.where(Product.active == filters["active"])

        q = q.offset(skip).limit(limit)
        return db.execute(q).scalars().all()


# ---------------------------------------------------------
# GET SINGLE PRODUCT BY SKU
# ---------------------------------------------------------
def get_product_by_sku(sku: str):
    sku_lower = sku.strip().lower()
    with SessionLocal() as db:
        q = select(Product).where(Product.sku_lower == sku_lower)
        return db.execute(q).scalar_one_or_none()


# ---------------------------------------------------------
# BULK UPSERT USING sku_lower UNIQUE INDEX
# ---------------------------------------------------------
def upsert_products_bulk(records):
    """
    Bulk upsert using ON CONFLICT on sku_lower column.
    Each record must include 'sku', and we set 'sku_lower' automatically.
    """
    if not records:
        return

    # Normalize and compute sku_lower
    for r in records:
        r["sku"] = r["sku"].strip()
        r["sku_lower"] = r["sku"].lower()

    metadata = MetaData()
    metadata.reflect(bind=engine, only=["products"])
    products_table = Table("products", metadata, autoload_with=engine)

    stmt = insert(products_table).values(records)

    upsert = stmt.on_conflict_do_update(
        index_elements=["sku_lower"],
        set_={
            "sku": stmt.excluded.sku,
            "sku_lower": stmt.excluded.sku_lower,
            "name": stmt.excluded.name,
            "description": stmt.excluded.description,
            "price": stmt.excluded.price,
            "active": stmt.excluded.active,
        }
    )

    conn = engine.connect()
    trans = conn.begin()

    try:
        conn.execute(upsert)
        trans.commit()

    except Exception:
        trans.rollback()

        # fallback: safe row-by-row upsert
        sess = SessionLocal()
        try:
            for r in records:
                existing = (
                    sess.query(Product)
                    .filter(Product.sku_lower == r["sku_lower"])
                    .first()
                )

                if existing:
                    existing.sku = r["sku"]
                    existing.name = r.get("name") or existing.name
                    existing.description = r.get("description") or existing.description
                    existing.price = r.get("price") or existing.price
                    existing.active = r.get("active", existing.active)
                else:
                    p = Product(
                        sku=r["sku"],
                        sku_lower=r["sku_lower"],
                        name=r.get("name"),
                        description=r.get("description"),
                        price=r.get("price"),
                        active=r.get("active", True),
                    )
                    sess.add(p)

            sess.commit()
        finally:
            sess.close()

    finally:
        conn.close()


# ---------------------------------------------------------
# CREATE SINGLE PRODUCT
# ---------------------------------------------------------
def create_product(data):
    sku_raw = data["sku"].strip()
    p = Product(
        sku=sku_raw,
        sku_lower=sku_raw.lower(),
        name=data["name"],
        description=data.get("description"),
        price=data.get("price"),
        active=data.get("active", True),
    )

    with SessionLocal() as db:
        db.add(p)
        try:
            db.commit()
            db.refresh(p)
            return p
        except IntegrityError:
            db.rollback()
            raise


# ---------------------------------------------------------
# DELETE ALL PRODUCTS
# ---------------------------------------------------------
def delete_all_products():
    with SessionLocal() as db:
        db.query(Product).delete()
        db.commit()
