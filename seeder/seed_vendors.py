"""Seed Hindsight banks with synthetic vendor interactions.

Run once, ideally at hour -3 of pre-hackathon prep so Hindsight has time to synthesize.
Re-run the night before for redundancy.
"""
import os
import sys
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

def main():
    api_key = os.environ.get("HINDSIGHT_API_KEY")
    base_url = os.environ.get("HINDSIGHT_API_URL", "https://api.hindsight.vectorize.io")
    if not api_key:
        print("ERROR: HINDSIGHT_API_KEY not set", file=sys.stderr)
        sys.exit(1)

    try:
        from hindsight_client import Hindsight

    except ImportError:
        print("ERROR: hindsight-client not installed. Run: pip install hindsight-client", file=sys.stderr)
        sys.exit(1)

    from vendor_data import VENDORS

    client = Hindsight(api_key=api_key, base_url=base_url)

    total = 0
    for bank_id, v in VENDORS.items():
        print(f"\n=== Seeding {v['name']} ({bank_id}) — {len(v['interactions'])} interactions ===")
        client.retain(
            bank_id=bank_id,
            content=f"Vendor {v['name']}. Annual contract value ${v['annual_value']:,}. Renewal date {v['renewal_date']}. Primary contact {v['contact']}.",
            metadata={"type": "world_fact"},
        )
        for i, interaction in enumerate(v["interactions"], 1):
            client.retain(
                bank_id=bank_id,
                content=interaction["summary"],
                metadata={
                    "type": interaction["type"],
                    "date": interaction["date"],
                },
            )
            print(f"  [{i}/{len(v['interactions'])}] {interaction['date']} {interaction['type']}")
            total += 1

    print(f"\nSeeded {total} interactions across {len(VENDORS)} banks.")
    print("Wait at least 6 hours for Hindsight Observations synthesis before demo.")

if __name__ == "__main__":
    main()
