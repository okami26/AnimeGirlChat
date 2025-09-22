from langchain_community.chat_message_histories import SQLChatMessageHistory
from langchain_redis import RedisChatMessageHistory
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update, text
from loguru import logger

from app.config import settings
from app.db.models import User, Audio


async_engine = create_async_engine(settings.DB_URL)
async_session_maker = async_sessionmaker(async_engine, class_=AsyncSession)

async def get_history(user_id: str):
    try:
        status = "premium"
        if status == "premium":
            history = SQLChatMessageHistory(session_id=user_id, async_mode=True, connection=async_engine)
            history_messages = []

            texts = [message.content for message in await history.aget_messages()]
            roles = [message.type for message in await history.aget_messages()]
            audio_history = [audio[0] for audio in await get_audio_history(int(user_id))]
            audio_index = 0
            for i in range(len(roles)):
                message = [texts[i], roles[i]]
                if roles[i] == "ai":
                    message.append(audio_history[audio_index])
                    audio_index+=1
                history_messages.append(message)

        else:
            history = RedisChatMessageHistory(session_id=user_id)

            texts = [message.content for message in await history.aget_messages()]
            roles = [message.type for message in await history.aget_messages()]

            history_messages = list(zip(texts, roles))
        logger.info(f"История пользователя {user_id} успешно получена")
        return history_messages
    except Exception as e:
        logger.error(f"Произршла ошибка при получении истории пользователя {user_id}: {e}")
        return None

async def get_last_message(session_id: int):
    try:
        async with async_session_maker() as session:
            sql = text("""
                       SELECT id, session_id
                       FROM message_store
                       WHERE session_id = :session_id
                       ORDER BY id DESC LIMIT 1
                       """)
            result = await session.execute(sql, {"session_id": session_id})
            row = result.first()
            logger.info(f"last_message пользователя {session_id} успешно получено")
            return row

    except Exception as e:
        logger.error(f"Ошибка получения last_message: {e}")
        return None

async def get_audio_history(user_id: int):
    try:
        async with async_session_maker() as session:

            query = select(Audio.audio).filter_by(session_id=user_id)
            result = await session.execute(query)
            records = result.all()
            logger.info(f"История аудио пользователя {user_id} успешно получена")
            return records

    except Exception as e:
        logger.error(f"Произршла ошибка при получении истории аудио пользователя {user_id}: {e}")

        return None


async def get_user(user_id: int):
    try:
        async with async_session_maker() as session:

            query = select(User).filter_by(id=user_id)
            result = await session.execute(query)
            record = result.scalar_one_or_none()
            logger.info(f"Пользователь {user_id} успешно получен")
            return record

    except Exception as e:
        logger.error(f"Произршла ошибка при получении пользователя {user_id}: {e}")
        return None

async def create_user(**fields):
    try:
        async with async_session_maker() as session:
            new_user = User(**fields)
            session.add(new_user)
            await session.commit()
            await session.refresh(new_user)
            logger.info(f"Пользователь {fields.get("id")} успешно создан")
            return new_user
    except Exception as e:
        logger.error(f"Произошла ошибка при создании пользователя {fields.get("id")}: {e}")
        return None

async def update_user(user_id: int, **values):
    try:
        async with async_session_maker() as session:
            query = (
                update(User)
                .where(User.id == user_id)
                .values(**values)
                .execution_options(synchronize_session="fetch")
            )
            result = await session.execute(query)
            await session.commit()
            logger.info(f"Пользователь {user_id} успешно обновлен")
            return result
    except Exception as e:
        logger.error(f"Произошла ошибка при обновлении пользователя {user_id}: {e}")
        return None

async def create_audio(**fields):
    try:
        async with async_session_maker() as session:
            new_audio = Audio(**fields)
            session.add(new_audio)
            await session.commit()
            await session.refresh(new_audio)
            logger.info(f"Голосовое сообщение {fields.get("message_id")} пользователя {fields.get("id")} успешно создано")
            return new_audio
    except Exception as e:
        logger.error(f"Произошла ошибка при создании голосового сообщения {fields.get("message_id")} пользователя {fields.get("id")}: {e}")
        return None