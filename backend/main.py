from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn

from routes import simulation, agents, artifacts
from core.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("🚀 Starting Work Simulation Platform...")
    yield
    # Shutdown
    print("🛑 Shutting down Work Simulation Platform...")


app = FastAPI(
    title="Work Simulation Platform API",
    description="AI-powered workplace simulation platform",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://your-frontend-domain.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(simulation.router, prefix="/api/simulation", tags=["simulation"])
app.include_router(agents.router, prefix="/api/agents", tags=["agents"])
app.include_router(artifacts.router, prefix="/api/artifacts", tags=["artifacts"])


@app.get("/")
async def root():
    return {"message": "Work Simulation Platform API", "status": "running"}


@app.get("/ping")
async def ping():
    return {"status": "ok", "message": "pong"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 