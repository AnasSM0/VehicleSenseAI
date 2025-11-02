import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./vehiclesense.db"
    EXCISE_LOOKUP_BASE_URL: str = os.getenv("EXCISE_LOOKUP_BASE_URL", "")
    OCR_ENGINE: str = os.getenv("OCR_ENGINE", "easyocr")
    DETECTION_MODEL_PATH: str = os.getenv("DETECTION_MODEL_PATH", "")
    ACTIVE_SESSION_TIMEOUT_SECONDS: int = int(os.getenv("ACTIVE_SESSION_TIMEOUT_SECONDS", "300"))
    STATIC_IMAGE_DIR: str = os.getenv("STATIC_IMAGE_DIR", "/app/static/images")
    LOG_FILE: str = os.getenv("LOG_FILE", "/app/logs/vehicle_system.log")

settings = Settings()
