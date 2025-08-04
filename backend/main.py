from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from dotenv import load_dotenv
import os

from app.api import messages, recipients, schedules, debug
from app.database import Base

load_dotenv()

# Tables are created by Alembic migrations, not here
# Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="WhatsApp Scheduler API",
    openapi_url="/api/openapi.json",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# Add middleware to handle proxy headers
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    # Log the incoming request
    print(f"Incoming request: {request.method} {request.url}")
    print(f"Headers: {dict(request.headers)}")
    
    response = await call_next(request)
    return response

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for now
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(messages.router, prefix="/api/messages", tags=["messages"])
app.include_router(recipients.router, prefix="/api/recipients", tags=["recipients"])
app.include_router(schedules.router, prefix="/api/schedules", tags=["schedules"])
app.include_router(debug.router, prefix="/api/debug", tags=["debug"])

@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    return FileResponse("favicon.ico")

@app.get("/")
def read_root():
    return {"message": "WhatsApp Scheduler API"}