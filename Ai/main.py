import os
from typing import Optional, List
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

from agent.graph import chat_with_shrey
from agent.prompts import SHREY_SYSTEM_PROMPT

# Load environment configuration
load_dotenv()

app = FastAPI(
    title="Shrey AI Service",
    description="Python FastAPI backend powering Groq LLM, Gemini STT/TTS, OpenRouter fallback, RAG, and Agentic Tools for Shrey AI",
    version="1.0.0"
)

# Configure CORS for local development, Electron, and Spring Boot communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    message: str = Field(..., description="User prompt or transcript from voice/text input")
    thread_id: Optional[str] = Field("default", description="Conversation session ID for conversational memory")
    provider: Optional[str] = Field(None, description="Preferred provider: groq, openrouter, or gemini")


class ChatResponse(BaseModel):
    response: str
    tools_used: List[str]
    thread_id: str
    provider: str


@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "Shrey AI Engine",
        "version": "1.0.0",
        "creators": ["Aryan", "Arpit", "Ashutosh"],
        "message": "Shrey AI backend is operational and ready."
    }


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "shrey-ai-service"
    }


@app.get("/ai/status")
def ai_status():
    return {
        "status": "ready",
        "name": "Shrey AI",
        "creators": ["Aryan", "Arpit", "Ashutosh"],
        "default_provider": os.getenv("DEFAULT_LLM_PROVIDER", "groq"),
        "providers_configured": {
            "groq": bool(os.getenv("GROQ_API_KEY")),
            "gemini": bool(os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")),
            "openrouter": bool(os.getenv("OPENROUTER_API_KEY")),
            "tavily": bool(os.getenv("TAVILY_API_KEY")),
        },
        "voice": {
            "stt": "gemini",
            "tts": "gemini",
            "text_reply_enabled": True
        },
        "workflow": "active"
    }


@app.post("/ai/chat", response_model=ChatResponse)
def chat_endpoint(req: ChatRequest):
    """
    Primary chat endpoint for Shrey AI.
    Processes user input, executes tools (Tavily search, system info, clipboard, etc.),
    and returns a clean response suitable for both voice TTS and markdown display.
    """
    try:
        result = chat_with_shrey(
            message=req.message,
            thread_id=req.thread_id or "default",
            provider=req.provider
        )
        return ChatResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent error: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
