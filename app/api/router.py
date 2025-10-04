from loguru import logger
from fastapi import APIRouter, HTTPException, UploadFile
from fastapi.responses import JSONResponse

from app.ai.agent import agent
from app.api.utils import tts_request, stt_request
from app.db.db import get_history, get_user, create_user, update_user, get_last_message, create_audio

router = APIRouter(prefix="/api")

@router.post("/messages/{user_id}")
async def generate_message(user_id: str, message: str):
    try:
        user_status="premium"
        message_ai = await agent.generate_response(message, user_id, status=user_status)
        last = await get_last_message(int(user_id))

        audio_base64 = await tts_request(message_ai)
        await create_audio(message_id=last[0], session_id=int(last[1]), audio=audio_base64)

        logger.info(f"Успешный ответ пользователю {user_id}")
        return JSONResponse(content={
            "message": message_ai,
            "audio_base64": audio_base64
        })
    except Exception as e:
        logger.error(f"Произошла ошибка при ответе пользователю {user_id}: {e}")
        return None

@router.get("/messages/{user_id}")
async def get_user_history(user_id: str):

    try:
        history = await get_history(user_id)
        logger.info(f"Успешно получена история пользователя {user_id}")
        return history
    except Exception as e:
        logger.error(f"Произошла ошибка при получении истории пользователя {user_id}: {e}")
        return None

@router.post("/users/{user_id}")
async def get_or_create_user(user_id: int):
    try:
        user = await get_user(user_id)
        if not user:

            user = await create_user(id=user_id, status="free", username="")
        logger.info(f"Пользователь {user_id} успешно получен")
        return user

    except Exception as e:
        logger.error(f"Проищошла ошибка при получении пользоваетеля {user_id}: {e}")
        return None


@router.post("/users/status/{user_id}")
async def update_user_status(user_id: int):
    try:
        user = await get_user(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="Пользователь не найден")

        if user.status == "free":
            await update_user(user_id=user_id, status="premium")
            logger.info(f"Пользователь {user_id} успешно обновлен до premium")
            return {"status": "updated", "new_status": "premium"}
        else:
            await update_user(user_id=user_id, status="free")
            logger.info(f"Пользователь {user_id} успешно обновлен до free")
            return {"status": "updated", "new_status": "free"}
    except Exception as e:
        logger.error(f"Произошла ошибка при изменении статуса пользователя {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Внутренняя ошибка сервера")


@router.post("/users/username/{user_id}")
async def update_user_username(user_id: int, username: str):
    try:
        user = await get_user(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="Пользователь не найден")

        await update_user(user_id=user_id, username=username)
        logger.info(f"Имя пользователя {user_id} успешно обновлено на {username}")

        return {"status": "updated", "user_id": user_id, "new_username": username}
    except Exception as e:
        logger.error(f"Произошла ошибка при обновлении имени пользователя {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Внутренняя ошибка сервера")


@router.post("/audio")
async def generate_message(file: UploadFile):
    try:
        text = await stt_request(file)

        logger.info(f"Успешный ответ пользователю")
        return text
    except Exception as e:
        logger.error(f"Произошла ошибка при ответе пользователю: {e}")
        raise HTTPException(status_code=500, detail="Ошибка получения текста")