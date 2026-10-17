from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from pydantic import field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://bhumi:bhumi_dev_pw@localhost:55432/bhumi"
    s3_endpoint_url: str = "http://localhost:9000"
    s3_access_key: str = "bhumi_minio"
    s3_secret_key: str = "bhumi_minio_pw"
    s3_bucket: str = "bhumi-documents"
    falkordb_host: str = "localhost"
    falkordb_port: int = 6379
    falkordb_password: str = ""
    falkordb_graph: str = "bhumi_company_brain"
    embeddings_enabled: bool = True
    database_ssl: bool = False
    database_ssl_insecure: bool = False
    database_pgbouncer: bool = False
    cors_origins: str = "http://localhost:3000"
    openrouter_api_key: str = ""
    openrouter_model: str = "anthropic/claude-sonnet-4.5"
    sarvam_api_key: str = ""
    embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2"
    jwt_secret: str
    jwt_algorithm: str = "HS256"
    jwt_expires_minutes: int = 480
    bootstrap_admin_employee_id: str = ""
    bootstrap_admin_password: str = ""
    demo_parliamentary_employee_id: str = ""
    demo_parliamentary_password: str = ""
    demo_ministry_employee_id: str = ""
    demo_ministry_password: str = ""
    demo_domain_officer_employee_id: str = ""
    demo_domain_officer_password: str = ""
    demo_admin_employee_id: str = ""
    demo_admin_password: str = ""
    allow_public_signup: bool = True

    @field_validator("database_url")
    @classmethod
    def _use_asyncpg_driver(cls, v: str) -> str:
        # managed hosts (Render, Heroku, …) hand out postgres:// URLs; the async engine needs
        # the asyncpg driver and rejects libpq's sslmode query param
        for prefix in ("postgresql://", "postgres://"):
            if v.startswith(prefix):
                v = "postgresql+asyncpg://" + v[len(prefix):]
                break
        parts = urlsplit(v)
        if "sslmode" in parts.query:
            kept = [(k, val) for k, val in parse_qsl(parts.query) if k != "sslmode"]
            v = urlunsplit(parts._replace(query=urlencode(kept)))
        return v

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
