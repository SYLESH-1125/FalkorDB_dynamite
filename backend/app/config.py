from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://bhumi:bhumi_dev_pw@localhost:55432/bhumi"
    s3_endpoint_url: str = "http://localhost:9000"
    s3_access_key: str = "bhumi_minio"
    s3_secret_key: str = "bhumi_minio_pw"
    s3_bucket: str = "bhumi-documents"
    neo4j_uri: str = "bolt://localhost:7687"
    neo4j_user: str = "neo4j"
    neo4j_password: str = "bhumi_dev_pw"
    cors_origins: str = "http://localhost:3000"
    openrouter_api_key: str = ""
    openrouter_model: str = "anthropic/claude-sonnet-4.5"
    embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
