import re
from utils.config import settings
import easyocr
import pytesseract
from PIL import Image
import numpy as np

# initialize easyocr reader lazy
_reader = None
def get_reader():
    global _reader
    if _reader is None:
        _reader = easyocr.Reader(['en'])
    return _reader

def ocr_image(image) -> dict:
    """
    image: numpy array (BGR) or PIL
    returns dict {text, confidence}
    """
    if settings.OCR_ENGINE == "easyocr":
        reader = get_reader()
        # convert to RGB
        if isinstance(image, (np.ndarray,)):
            image_rgb = image[:,:,::-1]
        else:
            image_rgb = image
        results = reader.readtext(image_rgb)
        if not results:
            return {"text": "", "confidence": 0.0}
        # choose highest confidence / concat text
        texts = [r[1] for r in results]
        confidences = [r[2] for r in results]
        text = " ".join(texts)
        conf = max(confidences)
        return {"text": normalize_plate(text), "confidence": float(conf)}
    else:
        if isinstance(image, np.ndarray):
            pil = Image.fromarray(image[:,:,::-1])
        else:
            pil = image
        raw = pytesseract.image_to_string(pil, config="--psm 7")
        return {"text": normalize_plate(raw), "confidence": 0.5}

def normalize_plate(raw_text: str) -> str:
    # basic normalization: remove non alnum and spaces, uppercase
    if not raw_text:
        return ""
    t = raw_text.strip().upper()
    # keep letters, numbers, and dash/space
    t = re.sub(r'[^A-Z0-9\- ]+', '', t)
    t = re.sub(r'\s+', ' ', t)
    return t
