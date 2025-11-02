from sqlalchemy import Column, Integer, String, Text
from .base import Base

class Resident(Base):
    __tablename__ = "residents"
    id = Column(Integer, primary_key=True, index=True)
    plate_number = Column(String(64), unique=True, index=True, nullable=False)
    resident_name = Column(String(128))
    apartment_no = Column(String(64))
    phone = Column(String(32))
    notes = Column(Text)
