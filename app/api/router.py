import asyncio
import base64
from concurrent.futures import ThreadPoolExecutor

import loguru
from fastapi import APIRouter
from fastapi.responses import FileResponse, StreamingResponse, JSONResponse

from app.ai.agent import agent
from app.ai.tts import tts, generate_tts
from app.api.entities import UserRequest
from app.db.db import get_history, get_user, create_user

router = APIRouter(prefix="/api")

tts_executor = ThreadPoolExecutor(max_workers=1)
tts_lock = asyncio.Lock()

@router.post("/messages/{user_id}")
async def test(user_id: str, message: str):

    user_status="premium"
    print(f"message: {message}")
    message_ai = await agent.classify(message, user_id, status=user_status)

    loop = asyncio.get_running_loop()

    async with tts_lock:
        audio_bytes = await loop.run_in_executor(
            tts_executor, generate_tts, message_ai
        )

    audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')

    return JSONResponse(content={
        "message": message_ai,
        "audio_base64": audio_base64
    })

@router.get("/messages/{user_id}")
async def get_user_history(user_id: str):

    history = await get_history(user_id)

    return history

@router.post("/users")
async def get_or_create_user(user_request: UserRequest):

    user = await get_user(int(user_request.id))

    if not user:

        user = await create_user(id=int(user_request.id), status="free", username="")

    return user

