from fastapi import FastAPI, HTTPException, Query, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

load_dotenv()

from models import VendorListResponse, Vendor, Briefing, NoMemoryResponse, IngestRequest, IngestResponse
from vendors_meta import VENDOR_META
from briefing import build_briefing, _days_remaining
from nomemory import build_nomemory
from ingest import run_ingest
from pipeline import set_hindsight_client
from call_coach import run_call_coach

app = FastAPI(title="LEVERAGE")

origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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


@app.get("/api/vendors", response_model=VendorListResponse)
def list_vendors():
    vendors = []
    for bank_id, meta in VENDOR_META.items():
        vendors.append(Vendor(
            bank_id=bank_id,
            name=meta["name"],
            annual_value=meta["annual_value"],
            renewal_date=meta["renewal_date"],
            days_remaining=_days_remaining(meta["renewal_date"]),
            contact=meta["contact"],
            interaction_count=meta["interaction_count"],
            tactic_count=meta["tactic_count"],
        ))
    return VendorListResponse(vendors=vendors)


@app.get("/api/briefing", response_model=Briefing)
async def get_briefing(vendor: str = Query(...)):
    if vendor not in VENDOR_META:
        raise HTTPException(404, f"Unknown vendor {vendor}")
    return await build_briefing(vendor, VENDOR_META[vendor])


@app.post("/api/briefing/nomemory", response_model=NoMemoryResponse)
def get_nomemory(vendor: str = Query(...)):
    if vendor not in VENDOR_META:
        raise HTTPException(404, f"Unknown vendor {vendor}")
    return build_nomemory(VENDOR_META[vendor]["name"])


@app.post("/api/ingest", response_model=IngestResponse)
async def post_ingest(req: IngestRequest):
    if req.vendor not in VENDOR_META:
        raise HTTPException(404, f"Unknown vendor {req.vendor}")
    if _hindsight is None:
        raise HTTPException(503, "Hindsight client not available")
    return await run_ingest(req, VENDOR_META[req.vendor], _hindsight)


@app.websocket("/ws/call/{vendor}")
async def call_websocket(websocket: WebSocket, vendor: str):
    if vendor not in VENDOR_META:
        await websocket.close(code=4004)
        return
    briefing = await build_briefing(vendor, VENDOR_META[vendor])
    await run_call_coach(websocket, briefing)
