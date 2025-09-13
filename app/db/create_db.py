import aiosqlite
from app.config import settings


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