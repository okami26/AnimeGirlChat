import asyncio
import io
from TTS.api import TTS
import soundfile as sf


tts = TTS(
            model_name="tts_models/multilingual/multi-dataset/xtts_v2",
            vocoder_name="vocoder_models/universal/libri-tts/fullband-melgan",
            progress_bar=True
        )

def generate_tts(message_ai):

    wav = tts.tts(text=message_ai, language="ru", speaker_wav=r"C:\Users\anton\PycharmProjects\AnimeGirl\app\api\У-меня-есть-к-тебе-просьба.wav")
    buf = io.BytesIO()
    sf.write(buf, wav, samplerate=22050, format='WAV')
    buf.seek(0)
    return buf.read()

def generate_tts_file(ai_message):

    tts.tts_to_file(
        text=ai_message,
        file_path="aaaaaaaaaaaaaaaaa.mp3",
        language="ru",
        speaker_wav=r"C:\Users\anton\PycharmProjects\AnimeGirl\app\api\У-меня-есть-к-тебе-просьба.wav")