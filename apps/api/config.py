from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql://loanapp:loanapp@localhost:5432/loanapproval"
    supabase_url: str = ""
    supabase_service_key: str = ""
    llm_provider: str = "openai"
    openai_api_key: str = ""
    anthropic_api_key: str = ""
    secret_key: str = "dev-secret-change-in-prod"
    ml_model_path: str = "ml/model.pkl"

    class Config:
        env_file = ".env"


settings = Settings()
