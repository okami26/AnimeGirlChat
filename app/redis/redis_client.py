from redis import Redis

redis_client = Redis(
    host="ai-chat-antonfedorov8765.db-msk0.amvera.tech",
    port=6379,  # Стандартный порт Redis
    password="ai-chat-987654321@",
    ssl=True,
    ssl_cert_reqs=None
)