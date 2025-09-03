from redis import Redis

from app.config import settings

redis_client = Redis(
    host=settings.REDIS_HOST,
    port=settings.REDIS_PORT,
    password=settings.REDIS_PASS,
    ssl=True,
    ssl_cert_reqs=None
)