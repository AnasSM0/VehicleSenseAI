from fastapi import APIRouter, Depends, UploadFile, File, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, List
from models.residents import Resident
from models.owner_cache import OwnerCache
from models.sessions import AccessSession
from models.detections import Detection
from models.base import SessionLocal
from detection.detector import PlateDetector
from detection.ocr import ocr_image
from detection.session_manager import process_detection, sweep_sessions
from utils.logger import get_logger
from utils.config import settings
from fastapi.responses import FileResponse

router = APIRouter()
logger = get_logger()

# Dependency simple session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class DetectionPayload(BaseModel):
    ocr_text: str
    confidence: float
    camera_id: Optional[str] = "cam0"

class ResidentIn(BaseModel):
    plate_number: str
    resident_name: Optional[str] = None
    apartment_no: Optional[str] = None
    phone: Optional[str] = None
    notes: Optional[str] = None

# start / stop detection (naive)
detector = PlateDetector()

@router.post("/start_detection")
def start_detection():
    # In a container environment, detection runs as a separate process or a CLI.
    return {"status":"started", "note":"Start the detection client separately (see README)."}

@router.post("/stop_detection")
def stop_detection():
    return {"status":"stopped"}

@router.get("/sessions")
def list_sessions(active_only: Optional[bool] = False, db=Depends(get_db)):
    q = db.query(AccessSession)
    if active_only:
        q = q.filter(AccessSession.status == "active")
    sessions = q.order_by(AccessSession.last_seen.desc()).limit(500).all()
    return [{"id":s.id, "plate":s.plate_number, "entry_time":s.entry_time, "last_seen":s.last_seen, "exit_time":s.exit_time, "status":s.status} for s in sessions]

@router.get("/detections")
def list_detections(limit: int = 100, db=Depends(get_db)):
    dets = db.query(Detection).order_by(Detection.timestamp.desc()).limit(limit).all()
    return [{"id":d.id, "session_id": d.session_id, "timestamp": d.timestamp, "ocr_text": d.ocr_text, "confidence": d.detection_confidence, "image_path": d.image_path} for d in dets]

@router.post("/detections")
async def receive_detection(payload: DetectionPayload):
    """
    Receive detection events from the detection client.
    This endpoint expects that the detection client posts an image file or that it has saved the crop locally.
    For simplicity we expect detection client to provide image as multipart file optionally.
    """
    # This simple POST receives JSON (ocr_text, confidence, camera_id), but detection client should call
    # the session manager with the cropped image saved locally. For now we add minimal behavior:
    sweep_sessions()  # update sessions
    # If the detection client also posts image file: support that via another endpoint (below)
    return {"status":"ok", "received": payload.dict()}

@router.post("/detections/upload")
async def upload_detection(file: UploadFile = File(...), ocr_text: str = "", confidence: float = 0.6, camera_id: str = "cam0"):
    # save uploaded file
    path_dir = settings.STATIC_IMAGE_DIR
    import os, time
    os.makedirs(path_dir, exist_ok=True)
    filename = f"{camera_id}_{ocr_text}_{int(time.time()*1000)}.jpg"
    path = os.path.join(path_dir, filename)
    with open(path, "wb") as f:
        f.write(await file.read())

    # call session manager with the saved image path -> open image and process
    from PIL import Image
    img = Image.open(path)
    import numpy as np
    arr = np.array(img)[:,:,::-1]  # to BGR
    res = process_detection(ocr_text, arr, confidence, camera_id=camera_id)
    return {"status":"ok", "result": res}

@router.post("/residents")
def add_resident(r: ResidentIn, db=Depends(get_db)):
    existing = db.query(Resident).filter(Resident.plate_number == r.plate_number).first()
    if existing:
        return {"status":"exists"}
    new = Resident(plate_number=r.plate_number, resident_name=r.resident_name, apartment_no=r.apartment_no, phone=r.phone, notes=r.notes)
    db.add(new)
    db.commit()
    return {"status":"ok", "id": new.id}

@router.get("/residents")
def list_residents(db=Depends(get_db)):
    arr = db.query(Resident).all()
    return [{"id":r.id,"plate_number":r.plate_number,"resident_name":r.resident_name,"apartment_no":r.apartment_no,"phone":r.phone} for r in arr]

@router.post("/manual_lookup")
def manual_lookup(plate: str):
    from detection.excise_lookup import lookup_plate
    res = lookup_plate(plate)
    return {"plate": plate, "owner": res}

@router.get("/status")
def status():
    sweep_sessions()
    return {"status":"ok"}

# Map residents to vehicles (since plate_number = vehicle)
@router.get("/vehicles")
def list_vehicles(db=Depends(get_db)):
    return list_residents(db)

# Map residents to owners (since resident_name = owner)
@router.get("/owners")
def list_owners(db=Depends(get_db)):
    return list_residents(db)

# Verifications can return sessions with status
@router.get("/verifications")
def list_verifications(db=Depends(get_db)):
    return list_sessions(active_only=False, db=db)

# Simple mock auth (add proper JWT later)
@router.post("/auth/login")
def login(credentials: dict):
    # Mock: accept any credentials for now
    return {"session": {"access_token": "mock-token", "user": {"email": credentials.get("email")}}}

@router.post("/auth/register")
def register(credentials: dict):
    return {"user": {"email": credentials.get("email"), "id": "1"}}

@router.post("/auth/logout")
def logout():
    return {"status": "ok"}