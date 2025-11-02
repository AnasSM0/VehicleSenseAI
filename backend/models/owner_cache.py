from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from .base import Base

class OwnerCache(Base):
    __tablename__ = "owner_cache"
    id = Column(Integer, primary_key=True)
    plate_number = Column(String(64), unique=True, index=True)
    owner_name = Column(String(256))
    vehicle_model = Column(String(256))
    registration_date = Column(String(64))
    raw_data = Column(Text)
    last_checked = Column(DateTime, server_default=func.now(), onupdate=func.now())
