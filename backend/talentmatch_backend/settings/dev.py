from .base import *

# Additional Dev settings

CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
]

# Simplify password validation for dev
AUTH_PASSWORD_VALIDATORS = []
