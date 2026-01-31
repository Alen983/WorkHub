from pydantic_settings import BaseSettings
import os


class Settings(BaseSettings):
    database_url: str = "sqlite:///./data/employee_portal.db"
    secret_key: str = "your-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440  # 24 hours
    # Wellness links (override via env for production)
    wellness_counselling_url: str = "https://www.betterhelp.com/"
    wellness_yoga_url: str = "https://www.youtube.com/results?search_query=yoga+for+beginners"
    wellness_exercises_url: str = "https://www.youtube.com/results?search_query=office+exercises+stretch"
    
    # AI: read from env API_KEY (server-side only, case-sensitive as specified)
    # Also supports api_key for backward compatibility
    api_key: str = ""

    class Config:
        env_file = ".env"
        # Allow reading from environment variables with different cases
        case_sensitive = False

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Check for API_KEY (case-sensitive) environment variable if api_key is not set
        if not self.api_key:
            self.api_key = os.getenv("API_KEY", "")


settings = Settings()
