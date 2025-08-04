from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

from app.api import messages, recipients, schedules
from app.database import engine, Base

load_dotenv()

Base.metadata.create_all(bind=engine)

app = FastAPI(title="WhatsApp Scheduler API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(messages.router, prefix="/api/messages", tags=["messages"])
app.include_router(recipients.router, prefix="/api/recipients", tags=["recipients"])
app.include_router(schedules.router, prefix="/api/schedules", tags=["schedules"])

@app.get("/")
def read_root():
    return {"message": "WhatsApp Scheduler API"}