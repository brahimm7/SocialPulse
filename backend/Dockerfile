# backend/Dockerfile
# Multi-stage build — keeps the final image lean

# ── Stage 1: dependency install ───────────────────────────────────────────────
FROM python:3.12-slim AS deps

WORKDIR /app

# System deps needed to build psycopg2
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc libpq-dev && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# ── Stage 2: runtime ──────────────────────────────────────────────────────────
FROM python:3.12-slim

WORKDIR /app

# Runtime lib only (no gcc)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 && \
    rm -rf /var/lib/apt/lists/*

# Copy installed packages from deps stage
COPY --from=deps /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=deps /usr/local/bin /usr/local/bin

# Copy project source
COPY . .

# Create non-root user for security
RUN useradd -m -u 1001 appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

# Run migrations then start gunicorn
CMD ["sh", "-c", "python manage.py migrate --noinput && \
     gunicorn ytanalytics.wsgi:application \
       --bind 0.0.0.0:${PORT:-8000} \
       --workers 3 \
       --timeout 120 \
       --access-logfile - \
       --error-logfile -"]
