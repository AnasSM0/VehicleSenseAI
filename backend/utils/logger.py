import logging
from logging.handlers import RotatingFileHandler
from .config import settings
import os

def get_logger():
    logger = logging.getLogger("vehicle_system")
    logger.setLevel(logging.INFO)
    if not logger.handlers:
        os.makedirs(os.path.dirname(settings.LOG_FILE), exist_ok=True)
        handler = RotatingFileHandler(settings.LOG_FILE, maxBytes=2_000_000, backupCount=3)
        fmt = logging.Formatter("%(asctime)s - %(levelname)s - %(message)s")
        handler.setFormatter(fmt)
        logger.addHandler(handler)
    return logger
