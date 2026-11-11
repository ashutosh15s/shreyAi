import os
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

from pipeline.chat_pipeline import ChatPipeline, ChatPipelineRequest, ChatPipelineResponse
from pipeline.rag_pipeline import RagPipeline

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

# Initialize Pipelines
chat_pipeline = ChatPipeline()
rag_pipeline = RagPipeline()


# Models
class ChatRequest(BaseModel):
    message: str = Field(..., description="User prompt or transcript from voice/text input")
    thread_id: Optional[str] = Field("default", description="Conversation session ID for memory")
    provider: Optional[str] = Field(None, description="Preferred provider: groq, openrouter, or gemini")
    include_voice_script: bool = Field(True, description="Whether to include TTS-ready text")


class IngestRequest(BaseModel):
    text: str = Field(..., description="Text content to embed and store in ChromaDB")
    source: str = Field("custom_doc", description="Source identifier or filename")
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)


class QueryRagRequest(BaseModel):
    query: str = Field(..., description="Query to semantically search in knowledge base")
    top_k: int = Field(3, description="Number of results to return")


@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "Shrey AI Engine",
        "version": "1.0.0",
        "creators": ["Aryan", "Arpit", "Ashutosh"],
        "architecture": "Class-based ReAct Agent & Multi-Modal Pipeline"
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


@app.post("/ai/chat", response_model=ChatPipelineResponse)
def chat_endpoint(req: ChatRequest):
    """
    Primary chat endpoint for Shrey AI.
    Processes text input, executes ReAct agent loop, runs tools,
    and returns both a rich markdown response and a voice-ready script.
    """
    try:
        pipeline_req = ChatPipelineRequest(
            message=req.message,
            thread_id=req.thread_id or "default",
            provider=req.provider,
            include_voice_script=req.include_voice_script
        )
        return chat_pipeline.execute(pipeline_req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pipeline error: {str(e)}")


@app.post("/ai/rag/ingest")
def rag_ingest(req: IngestRequest):
    """
    Ingest text content into the local ChromaDB vector knowledge base.
    """
    try:
        chunks = rag_pipeline.ingest_text(
            text=req.text,
            source=req.source,
            metadata=req.metadata
        )
        return {"status": "success", "chunks_ingested": chunks, "source": req.source}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"RAG Ingestion error: {str(e)}")


@app.post("/ai/rag/query")
def rag_query(req: QueryRagRequest):
    """
    Query the local ChromaDB vector store for semantic matches.
    """
    try:
        matches = rag_pipeline.retrieve(query=req.query, top_k=req.top_k)
        return {"query": req.query, "matches": matches}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"RAG Query error: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
