from langchain_gigachat import GigaChat
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_openai import ChatOpenAI

from app.config import settings


def get_gemini_llm(model="gemini-2.5-flash", api_key=settings.GEMINI_API_KEY):
    return ChatGoogleGenerativeAI(
        model=model,
        api_key=api_key
    )

def get_giga_chat_llm(api_key=settings.GIGA_CHAT_API_KEY):
    return GigaChat(
        credentials=api_key,
        verify_ssl_certs=False,
    )

def get_openrouter_llm(model="google/gemini-2.5-flash-image-preview:free", api_key=settings.OPENROUTER_API_KEY3):
    return ChatOpenAI(
        model=model,
        api_key=api_key,
        base_url="https://openrouter.ai/api/v1",
        temperature=0
    )
