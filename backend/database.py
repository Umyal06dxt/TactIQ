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

CREATE TABLE IF NOT EXISTS vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bank_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    annual_value INT NOT NULL DEFAULT 0,
    renewal_date DATE NOT NULL,
    contact TEXT NOT NULL DEFAULT '',
    contact_email TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    industry TEXT DEFAULT '',
    risk_level TEXT DEFAULT 'medium' CHECK (risk_level IN ('low','medium','high')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS vendors_bank_id_idx ON vendors(bank_id);

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
    deal_score INT,
    win_probability FLOAT,
    concessions_made INT DEFAULT 0,
    savings_achieved INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS calls_vendor_idx ON calls(vendor, created_at DESC);
CREATE INDEX IF NOT EXISTS calls_user_idx ON calls(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS calls_outcome_idx ON calls(vendor, outcome);

CREATE TABLE IF NOT EXISTS briefings (
    vendor TEXT PRIMARY KEY,
    data JSONB NOT NULL,
    generated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS deal_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor TEXT NOT NULL,
    call_id UUID REFERENCES calls(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    description TEXT,
    value_impact INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS deal_events_vendor_idx ON deal_events(vendor, created_at DESC);
"""

MIGRATIONS = [
    "ALTER TABLE calls ADD COLUMN IF NOT EXISTS deal_score INT",
    "ALTER TABLE calls ADD COLUMN IF NOT EXISTS win_probability FLOAT",
    "ALTER TABLE calls ADD COLUMN IF NOT EXISTS concessions_made INT DEFAULT 0",
    "ALTER TABLE calls ADD COLUMN IF NOT EXISTS savings_achieved INT DEFAULT 0",
    "ALTER TABLE vendors ADD COLUMN IF NOT EXISTS contact_email TEXT DEFAULT ''",
    "ALTER TABLE vendors ADD COLUMN IF NOT EXISTS industry TEXT DEFAULT ''",
    "ALTER TABLE vendors ADD COLUMN IF NOT EXISTS risk_level TEXT DEFAULT 'medium'",
]


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
            for migration in MIGRATIONS:
                try:
                    await conn.execute(migration)
                except Exception:
                    pass
        logger.info("Database ready")
    except Exception as e:
        logger.error(f"Database init failed: {e}")
        pool = None


async def close_db():
    global pool
    if pool:
        await pool.close()
        pool = None
