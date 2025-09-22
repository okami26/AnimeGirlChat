from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from .bot.create_bot import dp, start_bot, bot, stop_bot
from app.config import settings
from aiogram.types import Update
from fastapi import FastAPI, Request
from loguru import logger

from app.api.router import router
from .db.create_db import create_users_table, create_audios_table


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Бот запущен...")
    await start_bot()
    await create_users_table()
    await create_audios_table()
    yield
    logger.info("Бот остановлен...")
    await stop_bot()

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

app.include_router(router=router)
@app.post("/webhook")
async def webhook(request: Request) -> None:
    logger.info("Получен запрос с вебхука.")
    try:
        update_data = await request.json()
        update = Update.model_validate(update_data, context={"bot": bot})
        await dp.feed_update(bot, update)
        logger.info("Обновление успешно обработано.")
    except Exception as e:
        logger.error(f"Ошибка при обработке обновления с вебхука: {e}")