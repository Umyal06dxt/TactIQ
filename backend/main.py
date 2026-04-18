from fastapi import FastAPI, HTTPException, Query, WebSocket, UploadFile, File, Header, Body
from fastapi.responses import RedirectResponse
from openai import AsyncOpenAI
from fastapi.middleware.cors import CORSMiddleware
import os
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

from models import (
    VendorListResponse, Vendor, Briefing, NoMemoryResponse, IngestRequest, IngestResponse,
    SignupRequest, LoginRequest, AuthResponse, UserProfile,
    SaveCallRequest, CallRecord, VendorCreateRequest, VendorUpdateRequest,
)
from vendors_meta import VENDOR_META
from vendors_store import (
    list_vendors, get_vendor, create_vendor, update_vendor, delete_vendor,
    seed_vendors_if_empty,
)
from briefing import build_briefing, cached_briefing, invalidate_cache, _days_remaining
from nomemory import build_nomemory
from ingest import run_ingest
from pipeline import set_hindsight_client
from call_coach import run_call_coach
from database import init_db, close_db
from auth import create_user, get_user_by_email, verify_password, create_token, decode_token, get_user_by_id, create_or_get_google_user
from calls_store import save_call, get_calls, get_call
from gmail_store import get_auth_url, exchange_code, get_vendor_emails, get_google_login_url, exchange_google_login
from analytics_store import get_vendor_analytics, get_portfolio_analytics

app = FastAPI(title="TactIQ — Negotiation Intelligence")

origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    await init_db()
    await seed_vendors_if_empty()


@app.on_event("shutdown")
async def shutdown():
    await close_db()


# ---------------------------------------------------------------------------
# Auth helper
# ---------------------------------------------------------------------------

async def current_user_id(authorization: str = Header(default="")) -> Optional[str]:
    if not authorization.startswith("Bearer "):
        return None
    payload = decode_token(authorization[7:])
    return payload.get("sub") if payload else None


try:
    from hindsight_client import Hindsight
    _hindsight = Hindsight(
        api_key=os.environ.get("HINDSIGHT_API_KEY", ""),
        base_url=os.environ.get("HINDSIGHT_API_URL", "https://api.hindsight.vectorize.io"),
    )
    set_hindsight_client(_hindsight)
except Exception as e:
    print(f"WARNING: Hindsight client not initialized: {e}")
    _hindsight = None


@app.get("/health")
def health():
    return {"ok": True}


# ---------------------------------------------------------------------------
# Vendor routes (now fully dynamic)
# ---------------------------------------------------------------------------

@app.get("/api/vendors", response_model=VendorListResponse)
async def api_list_vendors():
    vendors_data = await list_vendors()
    result = []
    for v in vendors_data:
        meta = VENDOR_META.get(v["bank_id"], {})
        result.append(Vendor(
            bank_id=v["bank_id"],
            name=v["name"],
            annual_value=v["annual_value"],
            renewal_date=str(v["renewal_date"]),
            days_remaining=v.get("days_remaining", _days_remaining(str(v["renewal_date"]))),
            contact=v["contact"],
            contact_email=v.get("contact_email", ""),
            industry=v.get("industry", ""),
            risk_level=v.get("risk_level", "medium"),
            interaction_count=meta.get("interaction_count", v.get("interaction_count", 0)),
            tactic_count=meta.get("tactic_count", v.get("tactic_count", 0)),
        ))
    return VendorListResponse(vendors=result)


@app.post("/api/vendors", response_model=Vendor)
async def api_create_vendor(req: VendorCreateRequest):
    try:
        v = await create_vendor(
            name=req.name,
            annual_value=req.annual_value,
            renewal_date=req.renewal_date,
            contact=req.contact,
            contact_email=req.contact_email,
            notes=req.notes,
            industry=req.industry,
            risk_level=req.risk_level,
        )
    except Exception as e:
        raise HTTPException(400, str(e))
    return Vendor(
        bank_id=v["bank_id"],
        name=v["name"],
        annual_value=v["annual_value"],
        renewal_date=str(v["renewal_date"]),
        days_remaining=v.get("days_remaining", 0),
        contact=v["contact"],
        contact_email=v.get("contact_email", ""),
        industry=v.get("industry", ""),
        risk_level=v.get("risk_level", "medium"),
        interaction_count=0,
        tactic_count=0,
    )


@app.put("/api/vendors/{bank_id}", response_model=Vendor)
async def api_update_vendor(bank_id: str, req: VendorUpdateRequest):
    v = await update_vendor(bank_id, req.model_dump(exclude_none=True))
    if not v:
        raise HTTPException(404, "Vendor not found")
    return Vendor(
        bank_id=v["bank_id"],
        name=v["name"],
        annual_value=v["annual_value"],
        renewal_date=str(v["renewal_date"]),
        days_remaining=v.get("days_remaining", 0),
        contact=v["contact"],
        contact_email=v.get("contact_email", ""),
        industry=v.get("industry", ""),
        risk_level=v.get("risk_level", "medium"),
        interaction_count=0,
        tactic_count=0,
    )


@app.delete("/api/vendors/{bank_id}")
async def api_delete_vendor(bank_id: str):
    ok = await delete_vendor(bank_id)
    if not ok:
        raise HTTPException(404, "Vendor not found")
    await invalidate_cache(bank_id)
    return {"deleted": True}


# ---------------------------------------------------------------------------
# Briefing routes
# ---------------------------------------------------------------------------

async def _resolve_vendor_meta(vendor: str) -> dict:
    """Get vendor meta from DB (preferred) or hardcoded fallback."""
    v = await get_vendor(vendor)
    if v:
        return {
            "name": v["name"],
            "annual_value": v["annual_value"],
            "renewal_date": str(v["renewal_date"]),
            "contact": v["contact"],
            "interaction_count": v.get("interaction_count", 0),
            "tactic_count": v.get("tactic_count", 0),
        }
    if vendor in VENDOR_META:
        return VENDOR_META[vendor]
    raise HTTPException(404, f"Unknown vendor {vendor}")


@app.get("/api/briefing", response_model=Briefing)
async def get_briefing(vendor: str = Query(...)):
    meta = await _resolve_vendor_meta(vendor)
    return await cached_briefing(vendor, meta)


@app.post("/api/briefing/nomemory", response_model=NoMemoryResponse)
async def get_nomemory(vendor: str = Query(...)):
    meta = await _resolve_vendor_meta(vendor)
    return build_nomemory(meta["name"])


@app.post("/api/ingest", response_model=IngestResponse)
async def post_ingest(req: IngestRequest):
    meta = await _resolve_vendor_meta(req.vendor)
    if _hindsight is None:
        raise HTTPException(503, "Hindsight client not available")
    result = await run_ingest(req, meta, _hindsight)
    await invalidate_cache(req.vendor)
    return result


_openai_async = AsyncOpenAI(api_key=os.environ.get("OPENAI_API_KEY", ""))


@app.post("/api/transcribe")
async def transcribe_audio(audio: UploadFile = File(...)):
    content = await audio.read()
    if not content:
        return {"text": ""}
    raw_ct = (audio.content_type or "audio/webm").split(";")[0].strip()
    ext = "ogg" if "ogg" in raw_ct else "webm"
    transcript = await _openai_async.audio.transcriptions.create(
        model="whisper-1",
        file=(f"audio.{ext}", content, raw_ct),
    )
    return {"text": transcript.text}


@app.websocket("/ws/call/{vendor}")
async def call_websocket(websocket: WebSocket, vendor: str):
    await websocket.accept()
    meta = None
    try:
        meta = await _resolve_vendor_meta(vendor)
    except HTTPException:
        await websocket.send_json({"type": "error", "message": "Unknown vendor"})
        await websocket.close()
        return
    try:
        await websocket.send_json({"type": "status", "message": "loading"})
        briefing = await cached_briefing(vendor, meta)
        await websocket.send_json({"type": "status", "message": "ready"})
    except Exception as e:
        await websocket.send_json({"type": "error", "message": str(e)})
        await websocket.close()
        return
    await run_call_coach(websocket, briefing)


# ---------------------------------------------------------------------------
# Analytics routes
# ---------------------------------------------------------------------------

@app.get("/api/analytics/portfolio")
async def portfolio_analytics():
    return await get_portfolio_analytics()


@app.get("/api/analytics/{vendor}")
async def vendor_analytics(vendor: str):
    return await get_vendor_analytics(vendor)


# ---------------------------------------------------------------------------
# Auth routes
# ---------------------------------------------------------------------------

@app.post("/api/auth/signup", response_model=AuthResponse)
async def signup(req: SignupRequest):
    try:
        user = await create_user(req.email, req.password, req.full_name)
    except Exception as e:
        raise HTTPException(400, f"Signup failed: {e}")
    token = create_token(str(user["id"]), user["email"])
    return AuthResponse(token=token, user_id=str(user["id"]), email=user["email"])


@app.post("/api/auth/login", response_model=AuthResponse)
async def login(req: LoginRequest):
    user = await get_user_by_email(req.email)
    if not user or not verify_password(req.password, user.get("hashed_password", "")):
        raise HTTPException(401, "Invalid credentials")
    token = create_token(str(user["id"]), user["email"])
    return AuthResponse(token=token, user_id=str(user["id"]), email=user["email"])


@app.get("/api/auth/me", response_model=UserProfile)
async def me(authorization: str = Header(default="")):
    if not authorization.startswith("Bearer "):
        raise HTTPException(401, "Not authenticated")
    payload = decode_token(authorization[7:])
    if not payload:
        raise HTTPException(401, "Invalid token")
    user = await get_user_by_id(payload["sub"])
    if not user:
        raise HTTPException(404, "User not found")
    return UserProfile(id=str(user["id"]), email=user["email"], full_name=user.get("full_name"))


@app.get("/api/auth/google")
async def google_login():
    import secrets
    state = secrets.token_urlsafe(16)
    url = get_google_login_url(state)
    return {"url": url}


# ---------------------------------------------------------------------------
# Call routes
# ---------------------------------------------------------------------------

@app.post("/api/calls")
async def create_call(req: SaveCallRequest, authorization: str = Header(default="")):
    from datetime import datetime
    payload = decode_token(authorization[7:]) if authorization.startswith("Bearer ") else None
    user_id = payload.get("sub") if payload else None
    started = datetime.fromisoformat(req.started_at.replace("Z", "+00:00"))
    ended = datetime.fromisoformat(req.ended_at.replace("Z", "+00:00"))

    # Estimate savings for won calls
    from analytics_store import estimate_savings
    meta = VENDOR_META.get(req.vendor, {})
    contract_value = meta.get("annual_value", 0)
    try:
        v = await get_vendor(req.vendor)
        if v:
            contract_value = v.get("annual_value", contract_value)
    except Exception:
        pass
    savings = await estimate_savings(req.vendor, contract_value, req.outcome)

    call = await save_call(
        vendor=req.vendor,
        started_at=started,
        ended_at=ended,
        duration_secs=req.duration_secs,
        transcript=req.transcript,
        coaching_shown=req.coaching_shown,
        outcome=req.outcome,
        user_id=user_id,
        briefing_context=req.briefing_context,
        savings_achieved=savings,
    )
    if _hindsight:
        import asyncio
        asyncio.create_task(_auto_ingest(req, call))
    return {"id": str(call["id"])}


async def _auto_ingest(req: SaveCallRequest, call: dict) -> None:
    import asyncio
    try:
        narrative = call.get("narrative") or ""
        tactics = call.get("tactics_used") or []
        adherence = call.get("adherence_score") or 0.0
        deal_score = call.get("deal_score") or 0
        notes = (
            f"Call outcome: {req.outcome or 'unknown'} | Duration: {req.duration_secs}s | "
            f"Adherence: {adherence:.0%} | Deal Score: {deal_score}/100\n\n"
            f"Summary: {narrative}\n\n"
            f"Tactics used: {', '.join(tactics) if tactics else 'none'}\n\n"
            f"Transcript (last 15 turns):\n"
            + "\n".join(f"- {t}" for t in req.transcript[-15:])
        )
        metadata = {
            "outcome": req.outcome or "unknown",
            "type": "call_record",
            "adherence_score": str(round(adherence, 2)),
            "deal_score": str(deal_score),
            "tactics_used": ", ".join(tactics),
        }
        await asyncio.get_event_loop().run_in_executor(
            None,
            lambda: _hindsight.retain(bank_id=req.vendor, content=notes, metadata=metadata),
        )
        await invalidate_cache(req.vendor)
    except Exception as e:
        print(f"Auto-ingest failed for {req.vendor}: {e}")


@app.get("/api/calls/{vendor}")
async def list_calls(vendor: str, limit: int = 20):
    calls = await get_calls(vendor, limit)
    return {
        "calls": [
            {
                **c,
                "id": str(c["id"]),
                "user_id": str(c.get("user_id") or ""),
                "started_at": c["started_at"].isoformat() if c.get("started_at") else None,
                "ended_at": c["ended_at"].isoformat() if c.get("ended_at") else None,
                "created_at": c["created_at"].isoformat() if c.get("created_at") else None,
                "coaching_shown": c.get("coaching_shown") if isinstance(c.get("coaching_shown"), list) else [],
                "key_moments": c.get("key_moments") if isinstance(c.get("key_moments"), list) else [],
            }
            for c in calls
        ]
    }


@app.post("/api/calls/{vendor}/{call_id}/follow-up")
async def generate_follow_up(vendor: str, call_id: str):
    import json as _json
    from prompts import FOLLOW_UP_EMAIL_PROMPT
    call = await get_call(call_id)
    if not call or call["vendor"] != vendor:
        raise HTTPException(404, "Call not found")

    meta = await _resolve_vendor_meta(vendor)
    content = (
        f"Vendor: {meta['name']}\n"
        f"Contact: {meta.get('contact', 'the vendor contact')}\n"
        f"Outcome: {call.get('outcome', 'unknown')}\n"
        f"Deal score: {call.get('deal_score', 'N/A')}/100\n"
        f"Narrative: {call.get('narrative', '')}\n"
        f"Savings achieved: ${call.get('savings_achieved', 0):,}\n"
        f"Concessions made: {call.get('concessions_made', 0)}\n"
        f"Tactics used: {', '.join(call.get('tactics_used', []) or [])}\n"
    )
    try:
        resp = await _openai_async.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": FOLLOW_UP_EMAIL_PROMPT},
                {"role": "user", "content": content},
            ],
            response_format={"type": "json_object"},
            max_tokens=600,
            temperature=0.4,
        )
        data = _json.loads(resp.choices[0].message.content or "{}")
        return {"subject": data.get("subject", ""), "body": data.get("body", "")}
    except Exception as e:
        raise HTTPException(500, f"Email generation failed: {e}")


@app.get("/api/calls/{vendor}/{call_id}")
async def get_call_detail(vendor: str, call_id: str):
    import json as _json
    call = await get_call(call_id)
    if not call or call["vendor"] != vendor:
        raise HTTPException(404, "Call not found")

    def _parse(v):
        if isinstance(v, str):
            try: return _json.loads(v)
            except Exception: return v
        return v

    return {
        **call,
        "id": str(call["id"]),
        "started_at": call["started_at"].isoformat() if call.get("started_at") else None,
        "ended_at": call["ended_at"].isoformat() if call.get("ended_at") else None,
        "created_at": call["created_at"].isoformat() if call.get("created_at") else None,
        "key_moments": _parse(call.get("key_moments", [])),
        "coaching_shown": _parse(call.get("coaching_shown", [])),
    }


# ---------------------------------------------------------------------------
# Gmail routes
# ---------------------------------------------------------------------------

@app.get("/api/gmail/auth-url")
async def gmail_auth_url(authorization: str = Header(default="")):
    payload = decode_token(authorization[7:]) if authorization.startswith("Bearer ") else None
    user_id = payload.get("sub") if payload else "anonymous"
    url = get_auth_url(state=user_id)
    return {"url": url}


@app.get("/api/gmail/callback")
async def gmail_callback(code: str, state: str = ""):
    frontend = os.getenv("FRONTEND_URL", "http://localhost:3000")
    if state.startswith("auth:"):
        from database import pool as db_pool
        data = await exchange_google_login(code, state)
        user = await create_or_get_google_user(data["email"], data["full_name"], data["google_id"])
        token = create_token(str(user["id"]), user["email"])
        if db_pool and data.get("access_token"):
            await db_pool.execute(
                """INSERT INTO gmail_tokens (user_id, access_token, refresh_token, token_expiry)
                   VALUES ($1,$2,$3,$4)
                   ON CONFLICT (user_id) DO UPDATE
                     SET access_token=$2, refresh_token=$3, token_expiry=$4""",
                str(user["id"]), data["access_token"], data["refresh_token"], data["token_expiry"],
            )
        return RedirectResponse(f"{frontend}/auth/callback?token={token}")
    await exchange_code(code, state)
    return RedirectResponse(f"{frontend}/gmail-connected")


@app.get("/api/gmail/emails/{vendor}")
async def vendor_emails(vendor: str, contact_email: str = Query(...), authorization: str = Header(default="")):
    payload = decode_token(authorization[7:]) if authorization.startswith("Bearer ") else None
    user_id = payload.get("sub") if payload else None
    if not user_id:
        return {"emails": []}
    emails = await get_vendor_emails(user_id, contact_email)
    return {"emails": emails}
