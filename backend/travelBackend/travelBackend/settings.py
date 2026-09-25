import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "dev-only-change-me")

DEBUG = os.getenv("DJANGO_DEBUG", "True").lower() == "true"

ALLOWED_HOSTS = [
    h.strip()
    for h in os.getenv(
        "DJANGO_ALLOWED_HOSTS",
        "127.0.0.1,localhost"
    ).split(",")
    if h.strip()
]

# ---------------------------------------------------------
# CORS
# ---------------------------------------------------------

CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://travel-companion-1-sigma.vercel.app",
]

CORS_ALLOW_CREDENTIALS = True

# ---------------------------------------------------------
# CSRF
# ---------------------------------------------------------

CSRF_TRUSTED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://travel-companion-1-sigma.vercel.app",
]

# ---------------------------------------------------------
# Apps
# ---------------------------------------------------------

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    "corsheaders",
    "api",
]

# ---------------------------------------------------------
# Middleware
# ---------------------------------------------------------

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",

    # CORS must be before CommonMiddleware
    "corsheaders.middleware.CorsMiddleware",

    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

# ---------------------------------------------------------
# URLs / Templates
# ---------------------------------------------------------

ROOT_URLCONF = "travelBackend.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ]
        },
    }
]

WSGI_APPLICATION = "travelBackend.wsgi.application"

# ---------------------------------------------------------
# Database
# ---------------------------------------------------------

if os.getenv("DB_ENGINE", "mysql").lower() == "sqlite":

    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / os.getenv(
                "SQLITE_NAME",
                "db.sqlite3"
            ),
        }
    }

else:

    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.mysql",
            "NAME": os.getenv(
                "MYSQL_DATABASE",
                "travel_db"
            ),
            "USER": os.getenv(
                "MYSQL_USER",
                "root"
            ),
            "PASSWORD": os.getenv(
                "MYSQL_PASSWORD",
                "root"
            ),
            "HOST": os.getenv(
                "MYSQL_HOST",
                "127.0.0.1"
            ),
            "PORT": os.getenv(
                "MYSQL_PORT",
                "3306"
            ),
            "OPTIONS": {
                "ssl": {},
            },
        }
    }

# ---------------------------------------------------------
# Password validation
# ---------------------------------------------------------

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME":
        "django.contrib.auth.password_validation."
        "UserAttributeSimilarityValidator"
    },
    {
        "NAME":
        "django.contrib.auth.password_validation."
        "MinimumLengthValidator"
    },
    {
        "NAME":
        "django.contrib.auth.password_validation."
        "CommonPasswordValidator"
    },
    {
        "NAME":
        "django.contrib.auth.password_validation."
        "NumericPasswordValidator"
    },
]

# ---------------------------------------------------------
# Internationalization
# ---------------------------------------------------------

LANGUAGE_CODE = "en-us"

TIME_ZONE = "Asia/Kolkata"

USE_I18N = True

USE_TZ = True

# ---------------------------------------------------------
# Static / Media
# ---------------------------------------------------------

STATIC_URL = "static/"

MEDIA_URL = "/media/"

MEDIA_ROOT = BASE_DIR / "media"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ---------------------------------------------------------
# Authentication cookies
# ---------------------------------------------------------

# Local development:
#   DEBUG=True  -> normal HTTP cookies
#
# Production:
#   DEBUG=False -> Secure cross-site cookies

SESSION_COOKIE_SAMESITE = "None" if not DEBUG else "Lax"
SESSION_COOKIE_SECURE = not DEBUG

CSRF_COOKIE_SAMESITE = "None" if not DEBUG else "Lax"
CSRF_COOKIE_SECURE = not DEBUG