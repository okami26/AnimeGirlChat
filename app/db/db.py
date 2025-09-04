import asyncio

from langchain_community.chat_message_histories import SQLChatMessageHistory
from langchain_core.messages import HumanMessage
from sqlalchemy.ext.asyncio import create_async_engine

from app.config import settings

async_engine = create_async_engine(settings.DB_URL)

