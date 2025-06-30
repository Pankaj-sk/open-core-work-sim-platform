from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from .config import settings

# Use a SQLite database for simplicity in this example.
# For production, you would use the DATABASE_URL from your settings.
DATABASE_URL = "sqlite:///./simulation.db"

engine = create_engine(
    DATABASE_URL, 
    connect_args={"check_same_thread": False} # Needed for SQLite
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
