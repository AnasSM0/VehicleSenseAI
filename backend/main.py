import os
from fastapi import FastAPI
from api.routes import router as api_router
from utils.config import settings
from utils.logger import get_logger
from models.base import Base, engine, SessionLocal
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

logger = get_logger()
app = FastAPI(title="VehicleSenseAI")

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8080",  # Add this - your frontend port
    "http://127.0.0.1:8080",  # Add this
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# create tables
Base.metadata.create_all(bind=engine)

app.include_router(api_router, prefix="/api")

@app.get("/health")
def health():
    return {"status": "ok", "version": "1.0.0"}

@app.on_event("startup")
def startup():
    logger.info("VehicleSenseAI starting up")

app.mount("/static", StaticFiles(directory="static"), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
