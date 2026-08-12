import os
import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional

from app.model import llama_model_instance

class TriageRequest(BaseModel):
    symptoms: str = Field(..., min_length=2, description="Patient symptoms description")

class TriageResponse(BaseModel):
    level: str
    title: str
    summary: str
    explanation: List[str]
    recommendedActions: List[str]
    seekImmediateCare: bool
    disclaimer: str
    timestamp: str

class HealthResponse(BaseModel):
    status: str
    model_id: str
    device: str
    gpu_name: str
    is_quantized: bool
    vram_allocated_mb: float
    loaded: bool
    is_loading: bool
    loading_error: Optional[str] = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("[ArogyaX AI Service] Initializing FastAPI service with local Llama model...")
    llama_model_instance.start_background_load()
    yield
    print("[ArogyaX AI Service] Service shutting down.")

app = FastAPI(
    title="ArogyaX Local Llama-3.2 AI Service",
    description="FastAPI Service providing local clinical triage using meta-llama/Llama-3.2-3B-Instruct on RTX 3050 GPU",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health", response_model=HealthResponse)
async def health_check():
    info = llama_model_instance.get_status()
    if info["loaded"]:
        st = "healthy"
    elif info["is_loading"]:
        st = "loading_model"
    elif info["loading_error"]:
        st = "error"
    else:
        st = "not_loaded"

    return HealthResponse(
        status=st,
        model_id=info["model_id"],
        device=info["device"],
        gpu_name=info["gpu_name"],
        is_quantized=info["is_quantized"],
        vram_allocated_mb=info["vram_allocated_mb"],
        loaded=info["loaded"],
        is_loading=info["is_loading"],
        loading_error=info["loading_error"]
    )

class ChatMessage(BaseModel):
    role: str
    content: str

class PatientContext(BaseModel):
    age: Optional[int] = None
    sex: Optional[str] = None
    known_conditions: Optional[List[str]] = []
    medications: Optional[List[str]] = []

class ChatRequest(BaseModel):
    conversation: List[ChatMessage]
    patient_context: Optional[PatientContext] = None

class PossibleCondition(BaseModel):
    name: str
    reason: str

class ChatResponse(BaseModel):
    message: str
    stage: str = "collecting_information"
    needs_more_information: bool = True
    follow_up_question: Optional[str] = None
    risk_level: str = "LOW"
    possible_conditions: List[PossibleCondition] = []
    red_flags: List[str] = []
    self_care_guidance: List[str] = []
    recommended_action: str = ""
    doctor_contact_recommended: bool = False
    emergency: bool = False
    disclaimer: str = ""
    timestamp: str = ""

@app.post("/api/v1/triage", response_model=TriageResponse)
async def perform_triage(request: TriageRequest):
    if not request.symptoms.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Symptoms string cannot be empty."
        )

    try:
        result = llama_model_instance.analyze_symptoms(request.symptoms)
        return TriageResponse(**result)
    except RuntimeError as rerr:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(rerr)
        )
    except Exception as e:
        print(f"[ArogyaX AI Service] Error performing triage: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Local model inference error: {str(e)}"
        )

@app.post("/api/v1/chat", response_model=ChatResponse)
async def perform_chat_triage(request: ChatRequest):
    if not request.conversation:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Conversation cannot be empty."
        )

    try:
        conv_dicts = [{"role": m.role, "content": m.content} for m in request.conversation]
        ctx_dict = request.patient_context.model_dump() if request.patient_context else {}
        result = llama_model_instance.chat_symptoms(conv_dicts, ctx_dict)
        return ChatResponse(**result)
    except RuntimeError as rerr:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(rerr)
        )
    except Exception as e:
        print(f"[ArogyaX AI Service] Error performing chat triage: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Local model inference chat error: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
