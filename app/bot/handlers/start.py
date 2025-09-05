from aiogram import Router, F
from aiogram.exceptions import TelegramBadRequest
from aiogram.filters import CommandStart, StateFilter
from aiogram.fsm.context import FSMContext
from aiogram.types import Message, CallbackQuery, ReplyKeyboardRemove

from app.ai.agent import agent
from app.bot.keyboards.all_kb import inline_how_to_use_kb, inline_data_kb, inline_gender_kb
from app.bot.texts.text import HOW_TO_USE_TEXT
from app.bot.utils.registration import Registration, registration_router, profiles

router = Router()

GENDER_LABELS = {"male": "Мужской", "female": "Женский"}

#Start command
@router.message(CommandStart())
async def cmd_start(message: Message):
    await message.answer("Привет, я Алиса, ищу себе новые знакомства", reply_markup=inline_how_to_use_kb())


@router.callback_query(F.data == "how_use")
async def how_to_use(call: CallbackQuery):
    await call.message.answer(HOW_TO_USE_TEXT, reply_markup=inline_data_kb())
    await call.answer()


@registration_router.callback_query(F.data == "input_data")
async def input_name(call: CallbackQuery, state: FSMContext):
    await call.answer()
    await state.set_state(Registration.name)
    await call.message.answer("Введите свое имя")


@registration_router.message(Registration.name, F.text.len() >= 1)
async def input_age(message: Message, state: FSMContext):
    await state.update_data(name=message.text.strip())
    await state.set_state(Registration.age)
    await message.answer("Записано, сколько тебе лет? (от 7 до 100)")


@registration_router.message(Registration.age)
async def validate_age(message: Message, state: FSMContext):
    text = (message.text or "").strip()
    if not text.isdigit():
        await message.answer("Возраст должен быть числом, поробуйте еще раз")
        return
    age = int(text)
    if not (7 <= age <= 100):
        await message.answer("Введите возраст от 7 до 100")
        return
    await state.update_data(age=age)
    await state.set_state(Registration.gender)
    await message.answer("Выберите пол (М/Ж)", reply_markup=inline_gender_kb())


@registration_router.callback_query(
    StateFilter(Registration.gender),
    F.data.startswith("gender_")
)

async def input_gender(call: CallbackQuery, state: FSMContext):
    await call.answer()

    gender = call.data.split("_", 1)[1]
    if gender not in {"male", "female"}:
        await call.message.answer("Неправильный выбор")
        return

    await state.update_data(gender=gender)
    data = await state.get_data()

    user_id = call.from_user.id

    profiles[user_id] = {
        "name": data["name"],
        "age": data["age"],
        "gender": gender,
        "ready": True,
    }

    await state.clear()
    await call.message.edit_reply_markup()

    await call.message.answer(
        f"Готово! Профиль сохранён:\n"
        f"Имя: {profiles[user_id]['name']}\n"
        f"Возраст: {profiles[user_id]['age']}\n"
         f"Пол: {GENDER_LABELS[gender]}\n\n"
        f"Все готово, начинай со мной общаться",
    )


@router.message()
async def say(message: Message):

    ai_message = await agent.classify(message.text, message.from_user.id)

    await message.answer(ai_message)

