from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.router import api_router
from app.config import get_settings

settings = get_settings()

app = FastAPI(
    title="HRMS Modern API",
    version="1.0.0",
    description="Human Resource Management System - Modern UI Edition",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost", "http://frontend:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.get("/health")
def health():
    return {"status": "healthy", "app": settings.app_name}


@app.get("/")
def root():
    return {"message": "HRMS Modern API", "docs": "/docs"}
