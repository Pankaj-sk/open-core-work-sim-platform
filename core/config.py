from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    # API Settings
    api_v1_str: str = "/api/v1"
    project_name: str = "Work Simulation Platform"
    
    # Security
    secret_key: str = "your-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # Database
    database_url: Optional[str] = None
    
    # Redis
    redis_url: str = "redis://localhost:6379"
    
    # AWS
    aws_access_key_id: Optional[str] = None
    aws_secret_access_key: Optional[str] = None
    aws_region: str = "us-east-1"
    s3_bucket: Optional[str] = None
    
    # OpenAI
    openai_api_key: Optional[str] = None
    
    # Custom Model Configuration
    custom_model_api_url: Optional[str] = None
    custom_model_api_key: Optional[str] = None
    custom_model_name: str = "custom-model"
    custom_model_max_tokens: int = 150
    custom_model_temperature: float = 0.7
    
    # CORS
    cors_origins: list = ["http://localhost:3000"]
    
    model_config = {"env_file": ".env", "case_sensitive": True}


settings = Settings() 