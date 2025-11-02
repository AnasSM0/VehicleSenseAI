from models.sessions import AccessSession
from models.detections import Detection
from models.owner_cache import OwnerCache
from models.base import SessionLocal
from utils.config import settings
from detection.excise_lookup import lookup_plate
from detection.detector import save_crop_image
from datetime import datetime, timedelta
from utils.logger import get_logger

logger = get_logger()

ACTIVE_TIMEOUT = settings.ACTIVE_SESSION_TIMEOUT_SECONDS

def process_detection(plate_text, crop_image, confidence, camera_id="cam0"):
    """
    - Check for an active session with same plate (not exited)
    - If none, create AccessSession (entry_time)
    - Add Detection record
    - Lookup owner (cache)
    - Return session info
    """
    db = SessionLocal()
    try:
        # basic text normalization in case upper/lower
        plate = (plate_text or "").upper().strip()
        now = datetime.utcnow()

        # find active non-exited session
        session = db.query(AccessSession).filter(AccessSession.plate_number == plate, AccessSession.status == "active").first()
        if session:
            session.last_seen = now
            db.add(session)
            db.commit()
        else:
            session = AccessSession(plate_number=plate, entry_time=now, last_seen=now, status="active")
            db.add(session)
            db.commit()
            db.refresh(session)

        # save image
        image_path = save_crop_image(crop_image, plate, settings.STATIC_IMAGE_DIR, camera_id=camera_id)

        # owner lookup (cache)
        owner_data = lookup_plate(plate)
        # find owner cache id
        owner = db.query(OwnerCache).filter(OwnerCache.plate_number == plate).first()
        if owner:
            session.owner_id = owner.id
            db.add(session)
            db.commit()

        # create Detection record
        det = Detection(session_id=session.id, ocr_text=plate, detection_confidence=float(confidence), image_path=image_path, camera_id=camera_id)
        db.add(det)
        db.commit()

        logger.info("Processed detection %s, session=%s", plate, session.id)
        return {
            "session_id": session.id,
            "plate": plate,
            "owner": owner_data
        }
    finally:
        db.close()

def sweep_sessions():
    """Mark sessions as exited if last_seen older than timeout"""
    db = SessionLocal()
    try:
        threshold = datetime.utcnow() - timedelta(seconds=ACTIVE_TIMEOUT)
        active_sessions = db.query(AccessSession).filter(AccessSession.status == "active").all()
        for s in active_sessions:
            if s.last_seen < threshold:
                s.exit_time = datetime.utcnow()
                s.status = "exited"
                db.add(s)
        db.commit()
    finally:
        db.close()
