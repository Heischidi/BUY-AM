from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # App
    APP_NAME: str = "Buy Am API"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    BACKEND_HOST: str = "0.0.0.0"
    BACKEND_PORT: int = 8000

    # Database
    DATABASE_URL: str = "postgresql://postgres:password@localhost:5432/buyam"

    # JWT
    JWT_SECRET: str = "change-me-in-production"
    JWT_REFRESH_SECRET: str = "change-me-refresh-in-production"
    JWT_ACCESS_EXPIRE_MINUTES: int = 30
    JWT_REFRESH_EXPIRE_DAYS: int = 7

    # CORS
    FRONTEND_URL: str = "http://localhost:3000"
    ALLOWED_ORIGINS: str = "http://localhost:3000"

    @property
    def cors_origins(self) -> List[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",")]

    # Paystack
    PAYSTACK_SECRET_KEY: str = ""
    PAYSTACK_PUBLIC_KEY: str = ""
    PAYSTACK_WEBHOOK_SECRET: str = ""

    # AI
    AI_PROVIDER: str = "gemini"
    AI_API_KEY: str = ""
    AI_MODEL: str = "gemini-1.5-flash"

    # Cloudinary
    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
