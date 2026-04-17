import asyncpg, os, logging
from typing import Optional

pool: Optional[asyncpg.Pool] = None
logger = logging.getLogger(__name__)

SCHEMA = """
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    hashed_password TEXT,
    full_name TEXT,
    google_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS gmail_tokens (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    token_expiry TIMESTAMPTZ,
    gmail_address TEXT
);

CREATE TABLE IF NOT EXISTS calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    vendor TEXT NOT NULL,
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    duration_secs INT,
    transcript TEXT[],
    coaching_shown JSONB DEFAULT '[]',
    outcome TEXT CHECK (outcome IN ('won','lost','pending','escalated')),
    narrative TEXT,
    adherence_score FLOAT,
    tactics_used TEXT[],
    key_moments JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS calls_vendor_idx ON calls(vendor, created_at DESC);
CREATE INDEX IF NOT EXISTS calls_user_idx ON calls(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS briefings (
    vendor TEXT PRIMARY KEY,
    data JSONB NOT NULL,
    generated_at TIMESTAMPTZ DEFAULT now()
);
"""


async def init_db():
    global pool
    url = os.getenv("DATABASE_URL")
    if not url:
        logger.warning("DATABASE_URL not set — persistence disabled")
        return
    try:
        pool = await asyncpg.create_pool(url, min_size=2, max_size=10)
        async with pool.acquire() as conn:
            await conn.execute(SCHEMA)
        logger.info("Database ready")
    except Exception as e:
        logger.error(f"Database init failed: {e}")
        pool = None


async def close_db():
    global pool
    if pool:
        await pool.close()
        pool = None
