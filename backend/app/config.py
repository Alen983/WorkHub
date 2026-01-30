from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "sqlite:///./data/employee_portal.db"
    secret_key: str = "your-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440  # 24 hours
    # Wellness links (override via env for production)
    wellness_counselling_url: str = "https://www.betterhelp.com/"
    wellness_yoga_url: str = "https://www.youtube.com/results?search_query=yoga+for+beginners"
    wellness_exercises_url: str = "https://www.youtube.com/results?search_query=office+exercises+stretch"
    
    class Config:
        env_file = ".env"


settings = Settings()
