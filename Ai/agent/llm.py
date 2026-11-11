import os
from dotenv import load_dotenv
from langchain_core.language_models.chat_models import BaseChatModel

load_dotenv()


def get_llm(provider: str = None) -> BaseChatModel:
    """
    Instantiate the chat LLM based on provider preference or available environment keys.
    Priority: Provider requested -> GROQ -> OPENROUTER -> GEMINI
    """
    provider = provider or os.getenv("DEFAULT_LLM_PROVIDER", "").lower()

    # 1. Groq (Default when key available)
    groq_key = os.getenv("GROQ_API_KEY")
    if (provider == "groq" or not provider) and groq_key:
        from langchain_groq import ChatGroq
        model = os.getenv("GROQ_MODEL", "qwen/qwen3.8-27b")
        return ChatGroq(
            api_key=groq_key,
            model_name=model,
            temperature=0.7
        )

    # 2. OpenRouter (Using dynamic free router openrouter/free)
    openrouter_key = os.getenv("OPENROUTER_API_KEY")
    if (provider == "openrouter" or not provider) and openrouter_key:
        from langchain_openai import ChatOpenAI
        model = os.getenv("OPENROUTER_MODEL", "openrouter/free")
        return ChatOpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=openrouter_key,
            model=model,
            temperature=0.7,
            timeout=30,
            max_retries=2
        )

    # 3. Gemini (Using fast, reliable gemini-3.5-flash-lite or gemini-3.8-flash)
    gemini_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if (provider == "gemini" or not provider) and gemini_key:
        from langchain_google_genai import ChatGoogleGenerativeAI
        model = os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite")
        return ChatGoogleGenerativeAI(
            google_api_key=gemini_key,
            model=model,
            temperature=0.7,
            timeout=90
        )

    # Fallback to OpenRouter if key is present
    if openrouter_key:
        from langchain_openai import ChatOpenAI
        return ChatOpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=openrouter_key,
            model=os.getenv("OPENROUTER_MODEL", "openrouter/free"),
            temperature=0.7
        )

    raise ValueError("No LLM API keys found. Please set GROQ_API_KEY, OPENROUTER_API_KEY, or GEMINI_API_KEY in your .env file.")
