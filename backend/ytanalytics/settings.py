"""
Django settings for ytanalytics (SocialPulse) project.
Database: Supabase PostgreSQL (falls back to SQLite for local dev without DB_URL set)
"""
from pathlib import Path
import os
import dj_database_url

# Load .env file automatically
try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).resolve().parent.parent / ".env")
except ImportError:
    pass

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "dev-secret-key-change-in-production")
DEBUG      = os.environ.get("DEBUG", "True") == "True"
ALLOWED_HOSTS = ["*"]

INSTALLED_APPS = [
    "django.contrib.contenttypes",
    "django.contrib.auth",
    "django.contrib.staticfiles",
    "corsheaders",
    "rest_framework",
    "api",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.middleware.common.CommonMiddleware",
]

ROOT_URLCONF      = "ytanalytics.urls"
WSGI_APPLICATION  = "ytanalytics.wsgi.application"

# Silence models.W042 — use BigAutoField as default PK for all models
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ── Database ──────────────────────────────────────────────────────────────────
# Priority:
#   1. DATABASE_URL env var  → Supabase / any PostgreSQL (production)
#   2. Individual PG vars    → manual Postgres config
#   3. SQLite fallback       → local dev without DB set up
#
# Supabase connection string format:
#   postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
#   (use the "Transaction" pooler URL from Supabase dashboard → Settings → Database)

_db_url = os.environ.get("DATABASE_URL", "")

if _db_url:
    DATABASES = {"default": dj_database_url.parse(_db_url, conn_max_age=600)}
else:
    _pg_host = os.environ.get("PGHOST", "")
    if _pg_host:
        DATABASES = {
            "default": {
                "ENGINE":   "django.db.backends.postgresql",
                "NAME":     os.environ.get("PGDATABASE", "postgres"),
                "USER":     os.environ.get("PGUSER",     "postgres"),
                "PASSWORD": os.environ.get("PGPASSWORD", ""),
                "HOST":     _pg_host,
                "PORT":     os.environ.get("PGPORT", "5432"),
            }
        }
    else:
        # SQLite fallback for pure local dev
        DATABASES = {
            "default": {
                "ENGINE": "django.db.backends.sqlite3",
                "NAME":   BASE_DIR / "db.sqlite3",
            }
        }

STATIC_URL = "/static/"

# CORS
CORS_ALLOW_ALL_ORIGINS = True

# REST Framework
REST_FRAMEWORK = {
    "DEFAULT_RENDERER_CLASSES":       ["rest_framework.renderers.JSONRenderer"],
    "DEFAULT_PERMISSION_CLASSES":     ["rest_framework.permissions.AllowAny"],
    "DEFAULT_AUTHENTICATION_CLASSES": [],
    "UNAUTHENTICATED_USER":           None,
}

# In-memory cache for non-DB fast lookups (supplement to DB cache)
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "TIMEOUT": 3600,
    }
}

# YouTube Data API v3
YOUTUBE_API_KEY  = os.environ.get("YOUTUBE_API_KEY", "")
YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3"

# DB cache TTL (seconds) — re-fetch from YouTube API after this time
ANALYTICS_CACHE_TTL = int(os.environ.get("ANALYTICS_CACHE_TTL", 3600))
