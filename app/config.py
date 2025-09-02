import os.path
from pydantic_settings import SettingsConfigDict, BaseSettings
from loguru import logger


class Settings(BaseSettings):

    GEMINI_API_KEY: str
    GIGA_CHAT_API_KEY: str
    OPENROUTER_API_KEY: str
    OPENROUTER_API_KEY2: str
    OPENROUTER_API_KEY3: str
    BOT_TOKEN: str
    FORMAT_LOG: str = "{time:YYYY-MM-DD at HH:mm:ss} | {level} | {message}"
    LOG_ROTATION: str = "10 MB"
    ADMIN_ID: int
    BASE_URL: str

    @property
    def get_webhook(self) -> str:
        return f"{self.BASE_URL}/webhook"

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".env")
    )

settings = Settings()

log_file_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "log.txt")
logger.add(
    log_file_path,
    format=settings.FORMAT_LOG,
    level="INFO",
    rotation=settings.LOG_ROTATION
)
