# InsightXI AI service (FastAPI). Build context: apps/ai-service
#   docker build -t insightxi-ai apps/ai-service
FROM python:3.11-slim AS base
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1
WORKDIR /app

# Install runtime deps first for better layer caching.
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# App code. Trained model artifacts (models/*.joblib) are NOT baked in; the
# service falls back to the analytical blend until a training job populates
# MODELS_DIR (e.g. a mounted volume or an init job).
COPY app ./app

EXPOSE 8000
# Bind IPv6 (::) so the service is reachable over Railway's private network,
# which is IPv6-only — 0.0.0.0 (IPv4) is NOT reachable on *.railway.internal.
# Dual-stack also accepts IPv4, so local/compose still works. Shell form lets
# ${PORT} expand at runtime (platform-assigned), defaulting to 8000.
CMD uvicorn app.main:app --host :: --port ${PORT:-8000}
