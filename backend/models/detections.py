from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey
from sqlalchemy.sql import func
from .base import Base

class Detection(Base):
    __tablename__ = "detections"
    id = Column(Integer, primary_key=True)
    session_id = Column(Integer, ForeignKey("access_sessions.id"), nullable=True)
    timestamp = Column(DateTime, server_default=func.now())
    ocr_text = Column(String(128))
    detection_confidence = Column(Float)
    image_path = Column(String(512))
    camera_id = Column(String(128), default="cam0")
