FROM python:3.12-slim

WORKDIR /locust

COPY pyproject.toml .
RUN pip install --no-cache-dir uv && uv pip install --system --no-cache -r pyproject.toml

COPY . .

EXPOSE 8089 5557

ENTRYPOINT ["locust"]
