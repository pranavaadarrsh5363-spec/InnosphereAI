import time
import uuid
import logging
from fastapi import FastAPI, Request, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import text

from app.config import settings
from app.database import engine, Base, SessionLocal
from app.models import *
from app.api import (
    auth, projects, ideas, resources, analysis, roadmaps,
    insights, assistant, mentor, analytics, system, hardware,
    intelligence, research, experiments, validation, showcase,
    skills, architecture, knowledge_graph, patents, resource_matchmaker
)

from app.utils.seed_data import seed_database
from app.utils.migrations import run_db_migrations

logging.basicConfig(
    level=logging.INFO if not settings.DEBUG else logging.DEBUG,
    format="%(asctime)s [%(levelname)s] [%(name)s]: %(message)s"
)
logger = logging.getLogger("inno_sphere")

# Validate critical production configuration
try:
    settings.validate_production_secrets()
except Exception as e:
    logger.critical(f"Production configuration validation failed: {e}")
    if settings.ENVIRONMENT == "production":
        raise

# Run safe schema migrations for vector search and metadata
run_db_migrations()

# Seed initial data
with SessionLocal() as db:
    try:
        seed_database(db)
    except Exception as e:
        logger.warning(f"Database seeding check: {e}")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    description="AI-Powered Student Innovation & Intelligent Resource Discovery Platform API",
    docs_url="/docs",
    redoc_url="/redoc"
)

# ------------------------------------------------------------------------------
# 1. Request ID & Logging Middleware
# ------------------------------------------------------------------------------
@app.middleware("http")
async def request_correlation_and_logging_middleware(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
    request.state.request_id = request_id
    start_time = time.time()

    response = await call_next(request)

    process_time_ms = round((time.time() - start_time) * 1000, 2)
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Process-Time-Ms"] = str(process_time_ms)

    # Safe structured logging (excluding sensitive headers/params)
    logger.info(
        f"REQ_ID={request_id} METHOD={request.method} PATH={request.url.path} "
        f"STATUS={response.status_code} LATENCY={process_time_ms}ms"
    )
    return response

# ------------------------------------------------------------------------------
# 2. HTTP Security Headers Middleware
# ------------------------------------------------------------------------------
@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    if settings.ENVIRONMENT == "production":
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response

# ------------------------------------------------------------------------------
# 3. CORS Configuration
# ------------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=settings.CORS_ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------------------------------------------------------
# 4. Standardized Global Exception Handlers
# ------------------------------------------------------------------------------
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    request_id = getattr(request.state, "request_id", "unknown")
    return JSONResponse(
        status_code=exc.status_code,
        headers=getattr(exc, "headers", None),
        content={
            "success": False,
            "error": {
                "code": f"HTTP_{exc.status_code}",
                "message": exc.detail,
                "request_id": request_id
            }
        }
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    request_id = getattr(request.state, "request_id", "unknown")
    errors = []
    for err in exc.errors():
        loc = " -> ".join(str(l) for l in err.get("loc", []))
        msg = err.get("msg", "Invalid value")
        errors.append(f"{loc}: {msg}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Request payload validation failed.",
                "details": errors,
                "request_id": request_id
            }
        }
    )

@app.exception_handler(SQLAlchemyError)
async def database_exception_handler(request: Request, exc: SQLAlchemyError):
    request_id = getattr(request.state, "request_id", "unknown")
    logger.error(f"Database error [REQ_ID={request_id}]: {exc}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error": {
                "code": "DATABASE_ERROR",
                "message": "A database operation failed. The transaction was rolled back.",
                "request_id": request_id
            }
        }
    )

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    request_id = getattr(request.state, "request_id", "unknown")
    logger.error(f"Unhandled exception [REQ_ID={request_id}]: {exc}", exc_info=settings.DEBUG)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected internal server error occurred." if not settings.DEBUG else str(exc),
                "request_id": request_id
            }
        }
    )

# ------------------------------------------------------------------------------
# 5. Register API Routers
# ------------------------------------------------------------------------------
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(projects.router, prefix=settings.API_V1_STR)
app.include_router(ideas.router, prefix=settings.API_V1_STR)
app.include_router(resources.router, prefix=settings.API_V1_STR)
app.include_router(analysis.router, prefix=settings.API_V1_STR)
app.include_router(roadmaps.router, prefix=settings.API_V1_STR)
app.include_router(insights.router, prefix=settings.API_V1_STR)
app.include_router(assistant.router, prefix=settings.API_V1_STR)
app.include_router(mentor.router, prefix=settings.API_V1_STR)
app.include_router(analytics.router, prefix=settings.API_V1_STR)
app.include_router(system.router, prefix=settings.API_V1_STR)
app.include_router(hardware.router, prefix=settings.API_V1_STR)
app.include_router(intelligence.router, prefix=settings.API_V1_STR)
app.include_router(research.router, prefix=settings.API_V1_STR)
app.include_router(experiments.router, prefix=settings.API_V1_STR)
app.include_router(validation.router, prefix=settings.API_V1_STR)
app.include_router(showcase.router, prefix=settings.API_V1_STR)
app.include_router(skills.router, prefix=settings.API_V1_STR)
app.include_router(architecture.router, prefix=settings.API_V1_STR)
app.include_router(knowledge_graph.router, prefix=settings.API_V1_STR)
app.include_router(patents.router, prefix=settings.API_V1_STR)
app.include_router(resource_matchmaker.router, prefix=settings.API_V1_STR)

# ------------------------------------------------------------------------------
# 6. Operational Liveness & Readiness Endpoints
# ------------------------------------------------------------------------------
@app.get("/")
def root():
    return {
        "name": settings.PROJECT_NAME,
        "version": settings.PROJECT_VERSION,
        "status": "online",
        "environment": settings.ENVIRONMENT,
        "api_v1": settings.API_V1_STR
    }

@app.get("/health")
@app.get("/healthz")
@app.get("/api/v1/health")
def healthcheck():
    """Simple operational liveness probe."""
    return {
        "status": "healthy",
        "version": settings.PROJECT_VERSION,
        "environment": settings.ENVIRONMENT
    }

@app.get("/health/live")
@app.get("/livez")
def liveness_probe():
    """Kubernetes / container liveness check."""
    return {"status": "alive"}

@app.get("/health/ready")
@app.get("/readyz")
def readiness_probe():
    """Readiness probe: verifies database connectivity and core subsystems."""
    try:
        with SessionLocal() as db:
            db.execute(text("SELECT 1"))
        return {
            "status": "ready",
            "database": "connected",
            "ai_engine": "ready",
            "timestamp": time.time()
        }
    except Exception as e:
        logger.error(f"Readiness check failed: {e}")
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"status": "unhealthy", "database": "disconnected", "error": "Database connectivity check failed."}
        )
