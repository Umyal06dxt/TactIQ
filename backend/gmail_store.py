import os
import uuid
os.environ.setdefault("OAUTHLIB_RELAX_TOKEN_SCOPE", "1")
from typing import Optional
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
import database

SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"]
AUTH_SCOPES = [
    "openid",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/gmail.readonly",
]
CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "https://set-daring-tadpole.ngrok-free.app/api/gmail/callback")
AUTH_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "https://set-daring-tadpole.ngrok-free.app/api/gmail/callback")

# Keyed by state — holds the flow between auth-url and callback
_pending_flows: dict[str, Flow] = {}


def _make_flow() -> Flow:
    return Flow.from_client_config(
        {
            "web": {
                "client_id": CLIENT_ID,
                "client_secret": CLIENT_SECRET,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
            }
        },
        scopes=SCOPES,
        redirect_uri=REDIRECT_URI,
    )


def _make_auth_flow() -> Flow:
    return Flow.from_client_config(
        {
            "web": {
                "client_id": CLIENT_ID,
                "client_secret": CLIENT_SECRET,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
            }
        },
        scopes=AUTH_SCOPES,
        redirect_uri=AUTH_REDIRECT_URI,
    )


def get_google_login_url(state: str) -> str:
    flow = _make_auth_flow()
    prefixed = f"auth:{state}"
    url, _ = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        state=prefixed,
        prompt="consent",
    )
    _pending_flows[prefixed] = flow
    return url


async def exchange_google_login(code: str, state: str) -> dict:
    import requests as _req
    flow = _pending_flows.pop(state, None) or _make_auth_flow()
    flow.fetch_token(code=code)
    creds = flow.credentials
    info = _req.get(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        headers={"Authorization": f"Bearer {creds.token}"},
    ).json()
    return {
        "email": info.get("email", ""),
        "full_name": info.get("name", ""),
        "google_id": info.get("sub", ""),
        "access_token": creds.token,
        "refresh_token": creds.refresh_token,
        "token_expiry": creds.expiry,
    }


def get_auth_url(state: str = "") -> str:
    flow = _make_flow()
    url, _ = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        state=state,
        prompt="consent",
    )
    _pending_flows[state or "anonymous"] = flow
    return url


async def exchange_code(code: str, user_id: str) -> dict:
    key = user_id or "anonymous"
    flow = _pending_flows.pop(key, None) or _make_flow()
    flow.fetch_token(code=code)
    creds = flow.credentials
    try:
        uuid.UUID(user_id)
        valid_user = True
    except (ValueError, AttributeError):
        valid_user = False
    if database.pool and valid_user:
        await database.pool.execute(
            """INSERT INTO gmail_tokens (user_id, access_token, refresh_token, token_expiry)
               VALUES ($1,$2,$3,$4)
               ON CONFLICT (user_id) DO UPDATE SET access_token=$2, refresh_token=$3, token_expiry=$4""",
            user_id, creds.token, creds.refresh_token, creds.expiry,
        )
    return {"connected": True, "email": creds.quota_project_id}


async def get_vendor_emails(user_id: str, contact_email: str, max_results: int = 10) -> list[dict]:
    if not database.pool:
        return []
    row = await database.pool.fetchrow("SELECT * FROM gmail_tokens WHERE user_id=$1", user_id)
    if not row:
        return []
    creds = Credentials(
        token=row["access_token"],
        refresh_token=row["refresh_token"],
        token_uri="https://oauth2.googleapis.com/token",
        client_id=CLIENT_ID,
        client_secret=CLIENT_SECRET,
    )
    try:
        service = build("gmail", "v1", credentials=creds)
        results = (
            service.users()
            .messages()
            .list(
                userId="me",
                q=f'from:"{contact_email}" OR to:"{contact_email}"',
                maxResults=max_results,
            )
            .execute()
        )
        messages = results.get("messages", [])
        emails = []
        for m in messages[:5]:
            msg = (
                service.users()
                .messages()
                .get(
                    userId="me",
                    id=m["id"],
                    format="metadata",
                    metadataHeaders=["Subject", "From", "To", "Date"],
                )
                .execute()
            )
            headers = {h["name"]: h["value"] for h in msg["payload"]["headers"]}
            emails.append(
                {
                    "id": m["id"],
                    "subject": headers.get("Subject", ""),
                    "from": headers.get("From", ""),
                    "date": headers.get("Date", ""),
                    "snippet": msg.get("snippet", ""),
                }
            )
        return emails
    except Exception:
        return []
