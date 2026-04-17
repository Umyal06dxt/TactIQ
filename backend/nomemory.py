"""OpenAI-only generic-advice endpoint handler."""
import json
import os
from openai import OpenAI
from prompts import NOMEMORY_PROMPT
from models import NoMemoryResponse

_openai = OpenAI(api_key=os.environ.get("OPENAI_API_KEY", ""))
MODEL = os.environ.get("OPENAI_MODEL", "gpt-4o")


def build_nomemory(vendor_name: str) -> NoMemoryResponse:
    resp = _openai.chat.completions.create(
        model=MODEL,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": NOMEMORY_PROMPT},
            {"role": "user", "content": f"Vendor: {vendor_name}. Buyer role: procurement manager."},
        ],
        temperature=0.3,
    )
    parsed = json.loads(resp.choices[0].message.content)
    return NoMemoryResponse(vendor=vendor_name, tactics=parsed["tactics"])
