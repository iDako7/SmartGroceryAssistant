"""
Async worker — consumes ai.jobs queue, calls the AI model, stores results in Redis.
Run independently alongside the API server:
  python worker.py
"""
import asyncio
import json
import logging

import aio_pika

from app.config import settings
from app.services.cache import cache_set
from app.services.claude import inspire_meals, suggest_items

logging.basicConfig(level=logging.INFO, format="%(asctime)s [worker] %(message)s")
log = logging.getLogger("worker")


async def process(message: aio_pika.IncomingMessage) -> None:
    async with message.process(requeue_on_error=False):
        try:
            body = json.loads(message.body)
            job_id: str = body["job_id"]
            job_type: str = body["type"]
            payload: dict = body["payload"]
            log.info("processing job=%s type=%s", job_id, job_type)

            if job_type == "suggest":
                result = await suggest_items(payload["sections"])
            elif job_type == "inspire":
                result = await inspire_meals(
                    payload["sections"], payload.get("preferences", "")
                )
            else:
                log.warning("unknown job type: %s — skipping", job_type)
                return

            await cache_set(f"ai:result:{job_id}", result, ttl=3600)
            log.info("job=%s done", job_id)
        except Exception:
            log.exception("job failed")


async def main() -> None:
    for attempt in range(1, 11):
        try:
            connection = await aio_pika.connect_robust(settings.rabbitmq_url)
            break
        except Exception as exc:
            log.warning("RabbitMQ not ready (attempt %d/10): %s", attempt, exc)
            if attempt == 10:
                raise
            await asyncio.sleep(3)
    async with connection:
        channel = await connection.channel()
        await channel.set_qos(prefetch_count=4)
        q = await channel.declare_queue("ai.jobs", durable=True, arguments={"x-message-ttl": 300000})
        await q.consume(process)
        log.info("worker ready — waiting for jobs")
        await asyncio.Future()  # run forever


if __name__ == "__main__":
    asyncio.run(main())
