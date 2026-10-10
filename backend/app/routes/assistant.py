"""backend/app/routes/assistant.py

FastAPI router for the Student360 AI Assistant.
Provides:
- POST /assistant/chat — Authenticated conversational assistant endpoint.
- GET /assistant/status — Assistant status, provider mode, and role capabilities.
"""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from backend.app.core.security import AuthenticatedUser, get_current_user
from backend.app.services.assistant_service import assistant_service

router = APIRouter(prefix="/assistant", tags=["AI Assistant"])


class AssistantChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000, description="User prompt or speech query")
    conversation_history: Optional[List[Dict[str, str]]] = Field(default=[], description="Recent conversation turns")
    context_student_id: Optional[str] = Field(default=None, description="Optional active student context")


class AssistantChatResponse(BaseModel):
    reply: str
    provider: str
    provider_label: str
    authorized_context_used: List[str]
    suggested_actions: Optional[List[str]] = None
    timestamp: str


class AssistantStatusResponse(BaseModel):
    status: str
    provider: str
    provider_label: str
    role: str
    user_id: str
    voice_supported: bool = True


@router.post("/chat", response_model=AssistantChatResponse)
def assistant_chat(
    payload: AssistantChatRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> AssistantChatResponse:
    """
    Processes chat requests with strict RBAC access boundary checks.
    Uses live LLM if API key is configured, or transparent Institutional Knowledge Engine fallback.
    """
    res = assistant_service.chat(
        message=payload.message,
        current_user=current_user,
        conversation_history=payload.conversation_history,
        context_student_id=payload.context_student_id,
    )
    return AssistantChatResponse(**res)


@router.get("/status", response_model=AssistantStatusResponse)
def get_assistant_status(
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> AssistantStatusResponse:
    """Reports active assistant provider status and caller authorization context."""
    provider = assistant_service._detect_provider()
    labels = {
        "gemini": "Google Gemini (Live LLM)",
        "openai": "OpenAI (Live LLM)",
        "institutional_fallback": "Student360 Knowledge Engine (Offline Mode)",
    }
    return AssistantStatusResponse(
        status="ready",
        provider=provider,
        provider_label=labels.get(provider, "Student360 Knowledge Engine"),
        role=current_user.role.value,
        user_id=current_user.user_id,
        voice_supported=True,
    )
