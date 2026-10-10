from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

# Configure engine
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

try:
    engine = create_engine(settings.DATABASE_URL, connect_args=connect_args)
    # Test connection
    with engine.connect() as conn:
        pass
except Exception as e:
    if settings.APP_ENV.lower() == "production":
        raise RuntimeError(
            f"[FATAL] Failed to connect to production database '{settings.DATABASE_URL}': {e}. "
            "Silent fallback to SQLite is prohibited in production."
        ) from e
    print(f"[Database] Notice: Could not connect to {settings.DATABASE_URL}: {e}")
    print("[Database] Using local SQLite database for development: sqlite:///./back2u.db")
    engine = create_engine("sqlite:///./back2u.db", connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
