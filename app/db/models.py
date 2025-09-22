from sqlalchemy import Integer
from sqlalchemy.ext.asyncio import AsyncAttrs
from sqlalchemy.orm import Mapped, DeclarativeBase, mapped_column


class Base(AsyncAttrs, DeclarativeBase):
    __abstract__ = True
    id: Mapped[int] = mapped_column(Integer, primary_key=True)

class User(Base):
    __tablename__ = "users"
    username: Mapped[str]
    status: Mapped[str]

class Audio(Base):
    __tablename__ = "audios"
    session_id: Mapped[int]
    message_id: Mapped[int]
    audio: Mapped[str]