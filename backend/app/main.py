from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.router import api_router
from app.core.init_db import init_db
import logging

logger = logging.getLogger("buyam.app")

app = FastAPI(
    title="Buy Am API",
    description="Production-ready backend for Buy Am — Nigeria's marketplace",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    redirect_slashes=False,
)

# CORS
cors_origins = [o.strip() for o in settings.cors_origins if o.strip()]
for default_origin in ["https://buy-am-tvbs.vercel.app", "https://buy-am-three.vercel.app", "http://localhost:3000"]:
    if default_origin not in cors_origins:
        cors_origins.append(default_origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=r"https://.*\.vercel\.app|http://localhost(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(api_router)


@app.on_event("startup")
def on_startup():
    try:
        init_db()
    except Exception as e:
        logger.error(f"Startup init_db error: {e}")


@app.get("/health")
@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "Buy Am API"}


@app.get("/setup-db")
@app.get("/api/setup-db")
def trigger_setup_db():
    report = init_db()
    return {"status": "ok", "report": report}


# Module-level attempt for serverless environments (like Vercel) where startup event may not trigger
try:
    init_db()
except Exception as e:
    logger.warning(f"Module load init_db deferred/skipped: {e}")

