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
# Bind 0.0.0.0 (IPv4). Railway's healthcheck probes the service over IPv4, and a
# bare `::` bind comes up IPv6-only here, so the probe got "service unavailable"
# for the full timeout even though the app was healthy. 0.0.0.0 is what the
# public healthcheck and edge reach; revisit dual-stack only if/when the api→ai
# call moves onto the IPv6-only *.railway.internal private network. Shell form
# lets ${PORT} expand at runtime (platform-assigned), defaulting to 8000.
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
