import aiohttp
from fastapi import UploadFile


async def tts_request(text: str):
    async with aiohttp.ClientSession() as session:
        async with session.post(
            url="http://localhost:8010/api/text",
            params={"text": text}
        ) as response:
            if response.status == 200:
                data = await response.json()
                return data.get("audio_base64")
            else:
                print(f"Ошибка запроса: {response.status}")
                return None


async def stt_request(file: UploadFile):
    # Читаем байты файла из UploadFile
    file_bytes = await file.read()

    # Формируем форму с файлом (multipart/form-data)
    form_data = aiohttp.FormData()
    form_data.add_field('file', file_bytes, filename=file.filename, content_type=file.content_type)

    async with aiohttp.ClientSession() as session:
        async with session.post(
                url="http://localhost:8020/api/audio",
                data=form_data
        ) as response:
            if response.status == 200:
                data = await response.json()
                return data["text"]
            else:
                print(f"Ошибка запроса: {response.status}")
                return None