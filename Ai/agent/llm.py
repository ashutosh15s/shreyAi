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
        model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
        return ChatGroq(
            api_key=groq_key,
            model_name=model,
            temperature=0.7
        )

    # 2. OpenRouter (Using free models like meta-llama/llama-3.3-70b-instruct:free)
    openrouter_key = os.getenv("OPENROUTER_API_KEY")
    if (provider == "openrouter" or not provider) and openrouter_key:
        from langchain_openai import ChatOpenAI
        model = os.getenv("OPENROUTER_MODEL", "meta-llama/llama-3.3-70b-instruct:free")
        return ChatOpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=openrouter_key,
            model=model,
            temperature=0.7,
            timeout=30,
            max_retries=2
        )

    # 3. Gemini
    gemini_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if gemini_key:
        from langchain_google_genai import ChatGoogleGenerativeAI
        model = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
        return ChatGoogleGenerativeAI(
            google_api_key=gemini_key,
            model=model,
            temperature=0.7
        )

    # Fallback to OpenRouter if key is present
    if openrouter_key:
        from langchain_openai import ChatOpenAI
        return ChatOpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=openrouter_key,
            model=os.getenv("OPENROUTER_MODEL", "meta-llama/llama-3.3-70b-instruct:free"),
            temperature=0.7
        )

    raise ValueError("No LLM API keys found. Please set GROQ_API_KEY, OPENROUTER_API_KEY, or GEMINI_API_KEY in your .env file.")
