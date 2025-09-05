from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup


def inline_how_to_use_kb():
    inline_kb_list = [
        [InlineKeyboardButton(text="Как пользоваться", callback_data="how_use")]
    ]
    return InlineKeyboardMarkup(inline_keyboard=inline_kb_list)

def inline_data_kb():
    inline_kb_list = [
        [InlineKeyboardButton(text="Ввести свои данные", callback_data="input_data")]
    ]
    return  InlineKeyboardMarkup(inline_keyboard=inline_kb_list)

def inline_gender_kb():
    inline_kb_list = [
        [InlineKeyboardButton(text="Мужской", callback_data="gender_male")],
        [InlineKeyboardButton(text="Женский", callback_data="gender_female")]
    ]
    return InlineKeyboardMarkup(inline_keyboard=inline_kb_list)