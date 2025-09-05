from aiogram import Router
from aiogram.fsm.state import StatesGroup, State

profiles: dict[int, dict] = {}

class Registration(StatesGroup):
    name = State()
    age = State()
    gender = State()

registration_router = Router()
#chat_router = Router()

