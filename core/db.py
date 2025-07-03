from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from .config import settings

# Use database URL from settings, fallback to SQLite for development
DATABASE_URL = settings.database_url or "sqlite:///./simulation.db"

engine = create_engine(
    DATABASE_URL, 
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    """
    Dependency function to get a database session.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
