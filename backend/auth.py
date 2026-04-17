import os
from datetime import datetime, timedelta, timezone
from typing import Optional
import bcrypt
from jose import jwt, JWTError
import database

SECRET = os.getenv("JWT_SECRET", "dev-secret-change-in-prod")
ALGO = "HS256"
TTL_HOURS = 72


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode()[:72], bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode()[:72], hashed.encode())


def create_token(user_id: str, email: str) -> str:
    exp = datetime.now(timezone.utc) + timedelta(hours=TTL_HOURS)
    return jwt.encode({"sub": user_id, "email": email, "exp": exp}, SECRET, algorithm=ALGO)


def decode_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, SECRET, algorithms=[ALGO])
    except JWTError:
        return None


async def create_user(email: str, password: str, full_name: str = "") -> dict:
    if not database.pool:
        raise RuntimeError("Database not available")
    hashed = hash_password(password)
    row = await database.pool.fetchrow(
        "INSERT INTO users (email, hashed_password, full_name) VALUES ($1,$2,$3) RETURNING id, email, full_name, created_at",
        email, hashed, full_name
    )
    return dict(row)


async def get_user_by_email(email: str) -> Optional[dict]:
    if not database.pool:
        return None
    row = await database.pool.fetchrow("SELECT * FROM users WHERE email=$1", email)
    return dict(row) if row else None


async def create_or_get_google_user(email: str, full_name: str, google_id: str) -> dict:
    if not database.pool:
        raise RuntimeError("Database not available")
    row = await database.pool.fetchrow(
        """INSERT INTO users (email, full_name, google_id)
           VALUES ($1, $2, $3)
           ON CONFLICT (email) DO UPDATE
             SET google_id = EXCLUDED.google_id,
                 full_name = COALESCE(EXCLUDED.full_name, users.full_name)
           RETURNING id, email, full_name""",
        email, full_name, google_id,
    )
    return dict(row)


async def get_user_by_id(user_id: str) -> Optional[dict]:
    if not database.pool:
        return None
    row = await database.pool.fetchrow("SELECT id, email, full_name, created_at FROM users WHERE id=$1", user_id)
    return dict(row) if row else None
