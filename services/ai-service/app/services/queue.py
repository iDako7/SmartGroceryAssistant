import asyncio
import json
import logging
import uuid

import aio_pika
import aio_pika.abc

from app.config import settings

logger = logging.getLogger(__name__)

_connection: aio_pika.abc.AbstractRobustConnection | None = None
_channel: aio_pika.abc.AbstractChannel | None = None
_exchange: aio_pika.abc.AbstractExchange | None = None


async def connect() -> None:
    global _connection, _channel, _exchange
    for attempt in range(1, 11):
        try:
            _connection = await aio_pika.connect_robust(
                settings.rabbitmq_url, timeout=10
            )
            _channel = await _connection.channel()
            _exchange = await _channel.declare_exchange(
                "ai", aio_pika.ExchangeType.DIRECT, durable=True
            )
            logger.info("Connected to RabbitMQ")
            return
        except Exception as exc:
            logger.warning("RabbitMQ not ready (attempt %d/10): %s", attempt, exc)
            if attempt == 10:
                raise
            await asyncio.sleep(3)


async def publish_job(job_type: str, payload: dict) -> str:
    if _exchange is None:
        raise RuntimeError("queue not connected")
    job_id = str(uuid.uuid4())
    body = json.dumps({"job_id": job_id, "type": job_type, "payload": payload})
    await _exchange.publish(
        aio_pika.Message(
            body=body.encode(),
            delivery_mode=aio_pika.DeliveryMode.PERSISTENT,
        ),
        routing_key="jobs",
    )
    return job_id


async def close_queue() -> None:
    global _connection, _channel, _exchange
    _exchange = None
    if _channel:
        await _channel.close()
    if _connection:
        await _connection.close()
    _channel = None
    _connection = None
