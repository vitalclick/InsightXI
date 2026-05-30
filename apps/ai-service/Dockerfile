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
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
