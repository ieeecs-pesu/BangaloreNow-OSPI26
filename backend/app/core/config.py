import secrets
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Literal, Annotated, Any
from pydantic import AnyUrl, BeforeValidator, computed_field, PostgresDsn
from pydantic_core import MultiHostUrl

def parse_cors(v:Any)->list[str]|str:
    if isinstance(v, str) and not v.startswith("["):
        return [i.strip() for i in v.split(",")]

    elif isinstance(v, list |str):
        return v
    raise ValueError(v)


from pathlib import Path

# Always load .env from repo root (three levels up from this file)
REPO_ROOT = Path(__file__).resolve().parents[3]
ROOT_ENV_FILE = REPO_ROOT / ".env"

class Settings(BaseSettings):
    model_config=SettingsConfigDict(
        env_file=str(ROOT_ENV_FILE),
        env_ignore_empty=True,
        extra="ignore",
        case_sensitive=False
    )
    
    
    API_V1_STR:str = "api/v1"
    FRONTEND_HOST:str
    ENVIRONMENT:Literal["local","production"]="local"
    
    BACKEND_CORS_ORIGINS:Annotated[list[AnyUrl] | str, BeforeValidator(parse_cors)]=[]
    
    @computed_field
    @property
    def all_cors_origins(self)->list[str]:
        return [str(origin).rstrip("/") for origin in self.BACKEND_CORS_ORIGINS] + [self.FRONTEND_HOST]
    
    POSTGRES_SERVER:str
    POSTGRES_PORT:int=5432
    POSTGRES_USER:str
    POSTGRES_PASSWORD:str=""
    POSTGRES_DB:str=""
    EVENT_DAYS_DELTA:int
    @computed_field # type : ignore[prop-decorator]
    @property
    def SQL_ALCHEMY_URI(self)->PostgresDsn: 
        return MultiHostUrl.build(              #type: ignore
            scheme="postgresql",
            username=self.POSTGRES_USER,
            password=self.POSTGRES_PASSWORD,
            host=self.POSTGRES_SERVER,
            port=self.POSTGRES_PORT,
            path=self.POSTGRES_DB
        )
        

settings=Settings() #type: ignore