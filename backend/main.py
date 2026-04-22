from dotenv import load_dotenv
load_dotenv()

import asyncio
import os
import signal
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from routes import experiences, search, generate, linkedin

limiter = Limiter(key_func=get_remote_address)

async def scheduled_restart():
    await asyncio.sleep(10 * 24 * 60 * 60)  # 10 days
    os.kill(os.getpid(), signal.SIGTERM)

@asynccontextmanager
async def lifespan(app: FastAPI):
    asyncio.create_task(scheduled_restart())
    yield

app = FastAPI(title="Resume Tailor API", lifespan=lifespan)
app.state.limiter = limiter

# ... rest stays exactly the same


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"detail": "Too many requests. Please wait a moment and try again."},
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://tailorcvai.vercel.app",
    ],
    allow_origin_regex=r"https://tailorcvai-[a-z0-9]+-bhavya-goels-projects\.vercel\.app",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "HEAD"],
    allow_headers=["Content-Type", "Authorization"],
)

# Mount routers
app.include_router(experiences.router)
app.include_router(search.router)
app.include_router(generate.router)
app.include_router(linkedin.router)


@app.get("/")
def root():
    return {"message : Resume Tailor API"}


@app.get("/health")
def health():
    return {"status": "healthy"}
