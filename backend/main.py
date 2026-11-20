import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from database.database import engine, Base
from database import models

from routers import (
    auth,
    admin,
    student,
    parent,
    attendance,
    reports,
    principal,
    chat,
    teacher,
)

load_dotenv()

# ==========================================
# APPLICATION
# ==========================================

app = FastAPI(
    title="Campus IQ",
    description="AI-powered Student Attendance Management System",
    version="1.0.0",
)

# ==========================================
# CORS CONFIGURATION
# ==========================================

origins = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173",
).split(",")

origins = [origin.strip() for origin in origins if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# DATABASE INITIALIZATION
# ==========================================

Base.metadata.create_all(bind=engine)

# ==========================================
# HOME ROUTE
# ==========================================

@app.get("/")
def home():
    return {
        "message": "Campus IQ Backend is running!",
        "status": "success",
    }

# ==========================================
# REGISTER ROUTERS
# ==========================================

app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(student.router)
app.include_router(parent.router)
app.include_router(attendance.router)
app.include_router(reports.router)
app.include_router(principal.router)
app.include_router(chat.router)
app.include_router(teacher.router)

# ==========================================
# HEALTH CHECK
# ==========================================

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "message": "Backend is working propey",
    }