from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

kwargs = {}
if settings.DATABASE_URL.startswith("sqlite"):
    kwargs["connect_args"] = {"check_same_thread": False}
else:
    kwargs["pool_pre_ping"] = True
    kwargs["pool_size"] = 10
    kwargs["max_overflow"] = 20

engine = create_engine(
    settings.DATABASE_URL,
    **kwargs
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
