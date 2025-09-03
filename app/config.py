import os.path

from pydantic_settings import SettingsConfigDict, BaseSettings

class Settings(BaseSettings):

    GEMINI_API_KEY: str
    GIGA_CHAT_API_KEY: str
    OPENROUTER_API_KEY: str
    OPENROUTER_API_KEY2: str
    OPENROUTER_API_KEY3: str

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".env")
    )

settings = Settings()

