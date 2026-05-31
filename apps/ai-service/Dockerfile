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

# App code.
COPY app ./app

# Bake the trained ensemble into the image so production serves the calibrated
# XGBoost + LogReg blend (model_backend: ensemble) rather than only the
# analytical fallback. Training is deterministic (synthetic seasons) so the
# artifacts are reproducible from the build. Pass --build-arg TRAIN_ON_BUILD=false
# to skip and serve the analytical blend instead.
ARG TRAIN_ON_BUILD=true
RUN if [ "$TRAIN_ON_BUILD" = "true" ]; then \
      python -m app.training.train --seasons 6 && \
      echo "Baked trained ensemble into image."; \
    else \
      echo "Skipping training; service will use the analytical blend."; \
    fi

EXPOSE 8000
# Bind IPv6 (::) so the service is reachable over Railway's private network,
# which is IPv6-only — 0.0.0.0 (IPv4) is NOT reachable on *.railway.internal.
# Dual-stack also accepts IPv4, so local/compose still works. Shell form lets
# ${PORT} expand at runtime (platform-assigned), defaulting to 8000.
CMD uvicorn app.main:app --host :: --port ${PORT:-8000}
