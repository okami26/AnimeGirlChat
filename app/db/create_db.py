import aiosqlite
from app.config import settings
from loguru import logger

async def create_users_table():
    async with aiosqlite.connect(settings.DB_PATH) as db:
        await db.execute(
            """
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY,
            username TEXT,
            status TEXT
        );
        """
        )
        await db.commit()
        logger.info("БД пользователей успешно создана")


async def create_audios_table():
    async with aiosqlite.connect(settings.DB_PATH) as db:
        await db.execute(
            """
        CREATE TABLE IF NOT EXISTS audios (
            id INTEGER PRIMARY KEY,
            session_id INTEGER,
            message_id INTEGER,
            audio TEXT
        );
        """
        )
        await db.commit()
        logger.info("БД аудио успешно создана")