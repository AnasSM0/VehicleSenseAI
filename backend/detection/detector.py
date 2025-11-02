import cv2
import time
import os
from utils.config import settings
from .ocr import ocr_image
from pathlib import Path
import numpy as np
from utils.logger import get_logger

logger = get_logger()

# Simple plate detector using Haar cascade xml if YOLO model missing
CASCADE_PATH = cv2.data.haarcascades + "haarcascade_russian_plate_number.xml"

class PlateDetector:
    def __init__(self, model_path=None):
        self.model_path = model_path or settings.DETECTION_MODEL_PATH
        self.use_yolo = False
        self.net = None
        if self.model_path and os.path.exists(self.model_path):
            try:
                # try ultralytics YOLO model
                from ultralytics import YOLO
                self.model = YOLO(self.model_path)
                self.use_yolo = True
                logger.info("Using YOLO model for plate detection")
            except Exception as e:
                logger.warning("YOLO load failed, falling back to cascade: %s", e)
                self.cascade = cv2.CascadeClassifier(CASCADE_PATH)
        else:
            self.cascade = cv2.CascadeClassifier(CASCADE_PATH)
            logger.info("Using Haar cascade for plate detection")

    def detect_in_frame(self, frame):
        """
        frame: BGR numpy array
        returns list of dicts: {bbox, confidence, crop}
        """
        out = []
        if self.use_yolo:
            results = self.model(frame)
            for r in results:
                boxes = r.boxes
                for box in boxes:
                    x1,y1,x2,y2 = map(int, box.xyxy[0].tolist())
                    conf = float(box.conf[0])
                    crop = frame[y1:y2, x1:x2]
                    out.append({"bbox": (x1,y1,x2,y2), "confidence": conf, "crop": crop})
        else:
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            plates = self.cascade.detectMultiScale(gray, 1.1, 4)
            for (x,y,w,h) in plates:
                x1,y1,x2,y2 = x,y,x+w,y+h
                crop = frame[y1:y2, x1:x2]
                out.append({"bbox": (x1,y1,x2,y2), "confidence": 0.6, "crop": crop})
        return out

# Helper to save cropped plate image
def save_crop_image(crop, plate_text, static_dir, camera_id="cam0"):
    Path(static_dir).mkdir(parents=True, exist_ok=True)
    ts = int(time.time()*1000)
    filename = f"{camera_id}_{plate_text or 'unknown'}_{ts}.jpg"
    path = os.path.join(static_dir, filename)
    cv2.imwrite(path, crop)
    return path
