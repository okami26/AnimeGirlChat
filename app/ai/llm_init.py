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

def get_openrouter_llm(model="openrouter/sonoma-dusk-alpha", api_key=settings.OPENROUTER_API_KEY4):
    return ChatOpenAI(
        model=model,
        api_key=api_key,
        base_url="https://openrouter.ai/api/v1",
        temperature=0
    )

def get_lm_studio():
    return ChatOpenAI(
        base_url="http://localhost:1234/v1",
        model="google/gemma-3-4b",
        api_key="a"
    )
