import asyncio
from datetime import datetime

from langchain_community.chat_message_histories import SQLChatMessageHistory
from langchain_redis import RedisChatMessageHistory
from sqlalchemy import Integer, func
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession, AsyncAttrs
from sqlalchemy.future import select
from sqlalchemy import update
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

from app.config import settings
from app.db.models import User

async_engine = create_async_engine(settings.DB_URL)
async_session_maker = async_sessionmaker(async_engine, class_=AsyncSession)



async def get_history(user_id: str):
    status = "premium"
    if status == "premium":
        histoty = SQLChatMessageHistory(session_id=user_id, async_mode=True, connection=async_engine)

    else:
        histoty = RedisChatMessageHistory(session_id=user_id)

    texts = [message.content for message in await histoty.aget_messages()]
    roles = [message.type for message in await histoty.aget_messages()]

    history = list(zip(texts, roles))

    return history

async def get_user(user_id: int):
    try:
        async with async_session_maker() as session:

            query = select(User).filter_by(id=user_id)
            result = await session.execute(query)
            record = result.scalar_one_or_none()

            return record

    except Exception as e:
        print(e)

async def create_user(**fields):
    async with async_session_maker() as session:
        new_user = User(**fields)
        session.add(new_user)
        await session.commit()
        await session.refresh(new_user)
        return new_user

async def update_user(user_id: int, **values):
    async with async_session_maker() as session:
        query = (
            update(User)
            .where(User.id == user_id)
            .values(**values)
            .execution_options(synchronize_session="fetch")
        )
        result = await session.execute(query)
        await session.commit()

        return result