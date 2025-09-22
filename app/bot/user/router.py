from aiogram import Router, F
from aiogram.exceptions import TelegramBadRequest
from aiogram.filters import CommandStart
from aiogram.fsm.context import FSMContext
from aiogram.types import Message, CallbackQuery

from app.ai.agent import agent

router = Router()

#Start command
@router.message(CommandStart())
async def cmd_start(message: Message):
    await message.answer("Начнем")

@router.message()
async def say(message: Message):

    ai_message = await agent.generate_response(message.text, str(message.from_user.id), )

    await message.answer(ai_message)

