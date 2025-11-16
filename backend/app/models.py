from sqlalchemy import Column, Integer, String, Boolean, Index, event
from .db import Base   # ← IMPORT Base FROM db.py (critical)

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)

    sku = Column(String(128), nullable=False)
    sku_lower = Column(String(128), nullable=False, index=True)

    name = Column(String(512), nullable=False)
    description = Column(String, nullable=True)
    price = Column(String(64), nullable=True)
    active = Column(Boolean, default=True, nullable=False)

    __table_args__ = (
        Index("uq_products_sku_lower", "sku_lower", unique=True),
    )


@event.listens_for(Product, "before_insert")
def set_sku_lower(mapper, connection, target):
    target.sku_lower = (target.sku or "").strip().lower()


@event.listens_for(Product, "before_update")
def set_sku_lower_update(mapper, connection, target):
    target.sku_lower = (target.sku or "").strip().lower()
