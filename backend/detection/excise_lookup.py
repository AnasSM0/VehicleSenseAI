import requests
import json
from utils.config import settings
from models.owner_cache import OwnerCache
from models.base import SessionLocal
from utils.logger import get_logger
from datetime import datetime

logger = get_logger()

def lookup_plate(plate_number: str) -> dict:
    """
    Lookup owner details from owner_cache or Sindh excise.
    Returns dict with owner_name, vehicle_model, registration_date, raw_data.
    """
    db = SessionLocal()
    try:
        # check cache
        cache = db.query(OwnerCache).filter(OwnerCache.plate_number == plate_number).first()
        if cache:
            logger.info("Cache hit for %s", plate_number)
            return {
                "owner_name": cache.owner_name,
                "vehicle_model": cache.vehicle_model,
                "registration_date": cache.registration_date,
                "raw_data": cache.raw_data
            }
        # attempt to query excise
        if settings.EXCISE_LOOKUP_BASE_URL:
            try:
                # This is a placeholder call — update to actual excise endpoint and parsing.
                resp = requests.get(f"{settings.EXCISE_LOOKUP_BASE_URL}/search?plate={plate_number}", timeout=8)
                if resp.status_code == 200:
                    data = resp.text
                    # parse actual html / json accordingly; below is mock parsing
                    parsed = {"owner_name": "Parsed Owner", "vehicle_model": "Parsed Model", "registration_date": str(datetime.utcnow().date()), "raw_data": data}
                else:
                    logger.warning("Excise site returned %s", resp.status_code)
                    parsed = _mock_owner(plate_number)
            except Exception as e:
                logger.error("Excise lookup failed: %s", e)
                parsed = _mock_owner(plate_number)
        else:
            parsed = _mock_owner(plate_number)

        # cache results
        new_cache = OwnerCache(
            plate_number=plate_number,
            owner_name=parsed.get("owner_name"),
            vehicle_model=parsed.get("vehicle_model"),
            registration_date=parsed.get("registration_date"),
            raw_data=json.dumps(parsed.get("raw_data") or {})
        )
        db.add(new_cache)
        db.commit()
        return parsed
    finally:
        db.close()

def _mock_owner(plate):
    return {
        "owner_name": f"Owner of {plate}",
        "vehicle_model": "Unknown Model",
        "registration_date": None,
        "raw_data": {"source":"mock"}
    }
