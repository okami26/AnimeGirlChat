import asyncio
import io
from TTS.api import TTS
import soundfile as sf
from loguru import logger

class TTSGenerator:
    def __init__(self, model_name, vocoder_name, speaker_wav):
        self.tts = TTS(model_name=model_name, vocoder_name=vocoder_name, progress_bar=True)
        self.speaker_wav = speaker_wav

    def generate_tts(self, text):
        try:
            wav = self.tts.tts(text=text, language="ru", speaker_wav=self.speaker_wav)
            buf = io.BytesIO()
            sf.write(buf, wav, samplerate=22050, format='WAV')
            buf.seek(0)
            logger.info(f"Голосовое сообщение готово: {text}")
            return buf.read()
        except Exception as e:
            logger.error(f"Произошла ошибка при генерации голосового сообщения: {e}")
            return None

    def generate_tts_file(self, text, file_path):
        try:
            self.tts.tts_to_file(text=text, file_path=file_path, language="ru", speaker_wav=self.speaker_wav)
            logger.info(f"Голосовой файл сохранён: {file_path}")
        except Exception as e:
            logger.error(f"Ошибка при сохранении голосового файла: {e}")

tts_generator = TTSGenerator(model_name="tts_models/multilingual/multi-dataset/xtts_v2",
                             vocoder_name="vocoder_models/universal/libri-tts/fullband-melgan",
                             speaker_wav=r"C:\Users\anton\PycharmProjects\AnimeGirl\app\api\У-меня-есть-к-тебе-просьба.wav"
                             )