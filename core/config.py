from pydantic_settings import BaseSettings
from typing import Optional
from pydantic import Field
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
    
    # Google API
    google_api_key: Optional[str] = Field(None, alias="GOOGLE_API_KEY")
    gemini_model: str = Field("gemini-1.5-flash", alias="GEMINI_MODEL")
    
    # Anthropic Claude
    anthropic_api_key: Optional[str] = None
    claude_model: str = "claude-3-sonnet-20240229"
    
    # Azure OpenAI
    azure_openai_key: Optional[str] = None
    azure_openai_endpoint: Optional[str] = None
    azure_openai_version: str = "2024-02-15-preview"
    azure_openai_deployment: str = "gpt-4"
    
    # Hugging Face
    huggingface_api_key: Optional[str] = None
    huggingface_model: str = "microsoft/DialoGPT-large"
    
    # Local/Ollama
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "llama2"
    
    # Custom Model Configuration (AWS-hosted model)
    custom_model_api_url: Optional[str] = None
    custom_model_api_key: Optional[str] = None
    custom_model_name: str = "custom-model"
    custom_model_max_tokens: int = 500
    custom_model_temperature: float = 0.7
    custom_model_payload_format: str = "openai"  # openai, anthropic, generic, custom
    custom_model_auth_method: str = "bearer"  # bearer, api-key, custom
    custom_model_auth_header: str = "Authorization"  # custom auth header name
    
    # CORS - Remove wildcard for production security
    cors_origins: list = ["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001"]  # Removed "*" wildcard
    
    model_config = {"env_file": ".env", "case_sensitive": False, "extra": "allow", "populate_by_name": True}


settings = Settings()