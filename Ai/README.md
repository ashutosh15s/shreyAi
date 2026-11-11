# Shrey AI Service

Python FastAPI backend powering LLM orchestration, RAG, and computer tools.

## Setup & Running with UV

```bash
# Create and sync venv
uv venv --python 3.11
uv pip install -r requirements.txt

# Run the FastAPI server
uv run uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## Health Check
- `GET http://localhost:8000/`
- `GET http://localhost:8000/health`
- `GET http://localhost:8000/ai/status`

