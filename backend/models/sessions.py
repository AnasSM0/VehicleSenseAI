from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from .base import Base

class AccessSession(Base):
    __tablename__ = "access_sessions"
    id = Column(Integer, primary_key=True)
    plate_number = Column(String(64), index=True)
    entry_time = Column(DateTime, server_default=func.now())
    last_seen = Column(DateTime, server_default=func.now(), onupdate=func.now())
    exit_time = Column(DateTime, nullable=True)
    status = Column(String(32), default="active")  # active, exited
    owner_id = Column(Integer, ForeignKey("owner_cache.id"), nullable=True)
