from aiogram import Dispatcher, Bot
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from aiogram.fsm.storage.memory import MemoryStorage
from aiogram.types import BotCommand, BotCommandScopeDefault



from app.bot.handlers.start import router as user_router
from app.bot.utils.registration import registration_router
from app.config import settings


bot = Bot(token=settings.BOT_TOKEN, default=DefaultBotProperties(parse_mode=ParseMode.HTML))
dp = Dispatcher(storage=MemoryStorage())


async def set_commands():
    commands = [BotCommand(command='start', description='Старт')]
    await bot.set_my_commands(commands, BotCommandScopeDefault())

async def start_bot():
    await set_commands()

    dp.include_router(registration_router)
    dp.include_router(user_router)

    await bot.set_webhook(settings.get_webhook)
    await bot.send_message(settings.ADMIN_ID, text="Бот запущен!")

async def stop_bot():
    await bot.send_message(settings.ADMIN_ID, text="Бот остановлен!")
    await bot.delete_webhook(drop_pending_updates=True)
    await bot.session.close()

