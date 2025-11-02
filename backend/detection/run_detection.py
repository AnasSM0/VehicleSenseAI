import cv2
import time
import requests
from detection.detector import PlateDetector, save_crop_image
from detection.ocr import ocr_image
from utils.config import settings
from utils.logger import get_logger
import numpy as np
import os

logger = get_logger()
API_BASE = os.getenv("API_BASE", "http://localhost:8000/api")
VIDEO_PATH = os.getenv("VIDEO_PATH", "")
CAMERA_INDEX = int(os.getenv("CAMERA_INDEX", "0"))
SAVE_IMAGES = True

def main():
    detector = PlateDetector()
    cap = cv2.VideoCapture(CAMERA_INDEX)
    if not cap.isOpened():
        logger.error("Camera not available")
        return
    last_send = 0
    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                time.sleep(0.1)
                continue
            dets = detector.detect_in_frame(frame)
            for d in dets:
                crop = d["crop"]
                ocr = ocr_image(crop)
                plate_text = ocr["text"]
                confidence = ocr["confidence"] * d.get("confidence", 0.6)
                # basic threshold to reduce noise
                if not plate_text or len(plate_text) < 3:
                    continue
                # save crop locally & call backend upload
                if SAVE_IMAGES:
                    path = save_crop_image(crop, plate_text, settings.STATIC_IMAGE_DIR)
                # upload via multipart
                files = {"file": open(path, "rb")}
                data = {"ocr_text": plate_text, "confidence": str(confidence), "camera_id":"cam0"}
                try:
                    r = requests.post(f"{API_BASE}/detections/upload", files=files, data=data, timeout=5)
                    logger.info("Upload response: %s", r.json())
                except Exception as e:
                    logger.error("Upload failed: %s", e)
            time.sleep(0.1)
    finally:
        cap.release()

if __name__ == "__main__":
    main()

if VIDEO_PATH:
    cap = cv2.VideoCapture(VIDEO_PATH)
else:
    cap = cv2.VideoCapture(CAMERA_INDEX)