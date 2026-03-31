FROM python:3.12-slim

WORKDIR /locust

COPY pyproject.toml .
RUN pip install --no-cache-dir uv && uv pip install --system --no-cache -r pyproject.toml

COPY locustfile.py .

EXPOSE 8089 5557

ENTRYPOINT ["locust", "-f", "locustfile.py"]
