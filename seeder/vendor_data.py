"""Synthetic vendor interactions for LEVERAGE Hindsight banks.

NexaCloud: 23 interactions (3 contracts + 8 calls + 12 emails)
DataPipe: 4 interactions
SecureNet: 3 interactions
Total: 30

Hand-authored turning-point interactions support the 4 on-screen NexaCloud tactics:
- Mention AWS (0.87, 2/2)
- Fiscal Q3 pressure (0.74, 3/4)
- Multi-year commitment (0.50)
- Cancellation threat (0.12, anti-pattern, 0/3)
"""

NEXACLOUD = [
    # --- Contracts ---
    {"type": "contract", "date": "2022-12-31", "summary": "Initial NexaCloud contract signed. $320,000/yr, 1-year term. Negotiated by predecessor. No discount."},
    {"type": "contract", "date": "2023-12-31", "summary": "NexaCloud renewal. $350,000/yr. 2-year term negotiated by Priya. 3% discount after AWS mention (first evidence). Contact: Marcus Chen."},
    {"type": "contract", "date": "2024-12-31", "summary": "NexaCloud renewal. $380,000/yr. 3-year term would have saved 8% but not offered. Contact: Marcus Chen."},

    # --- Calls supporting AWS mention tactic (2 successful uses) ---
    {"type": "call", "date": "2023-09-15", "summary": "Pre-renewal call with Marcus. Priya mentioned exploring AWS for select workloads. Marcus offered 3% discount and $8k bundled support tier upgrade within 10 minutes. OUTCOME: Successful concession."},
    {"type": "call", "date": "2024-05-14", "summary": "Mid-contract call. Priya referenced AWS re:Invent announcements. Marcus proactively offered 3% discount extension and $8k support upgrade. OUTCOME: Successful concession."},

    # --- Calls supporting Fiscal Q3 pressure (3 of 4 successful) ---
    {"type": "call", "date": "2023-08-22", "summary": "Q3 close-of-quarter call. Priya anchored on end-of-fiscal timing. Marcus waived onboarding fee ($12k). OUTCOME: Successful concession."},
    {"type": "call", "date": "2024-08-30", "summary": "Q3 quarter-end. Priya referenced fiscal pressure. Marcus offered 2-year lock at current rate. OUTCOME: Successful concession."},
    {"type": "call", "date": "2024-09-05", "summary": "Follow-up call. Fiscal Q3 reference. Marcus countered with 'our quarter is already booked'. OUTCOME: No movement."},

    # --- Calls where multi-year was raised ---
    {"type": "call", "date": "2024-11-02", "summary": "Marcus unprompted mentioned '3-year roadmap access' during routine check-in. Priya did not commit. OUTCOME: Informational."},

    # --- Cancellation threat anti-pattern (3 failed uses) ---
    {"type": "call", "date": "2022-03-14", "summary": "Priya's predecessor threatened to cancel. Marcus escalated to NexaCloud legal. Relationship cooled for 6 months. OUTCOME: Escalated."},
    {"type": "call", "date": "2022-07-08", "summary": "Second cancellation threat. Marcus politely declined to negotiate. No movement. OUTCOME: No movement."},
    {"type": "call", "date": "2022-11-30", "summary": "Third cancellation threat on Q4 close. Marcus flagged with his manager. Priya had to walk it back. OUTCOME: No movement."},

    # --- Emails (filler + 2 roadmap hints) ---
    {"type": "email", "date": "2024-11-15", "summary": "Marcus forwarded Q1 2026 roadmap preview. Mentioned multi-year customers get early access."},
    {"type": "email", "date": "2024-10-02", "summary": "Marcus: 'Let us know if you want to talk about term extensions — we have flexibility.'"},
    {"type": "email", "date": "2024-09-20", "summary": "Standard check-in email. No negotiation content."},
    {"type": "email", "date": "2024-08-14", "summary": "Invoice reminder. Neutral tone."},
    {"type": "email", "date": "2024-07-30", "summary": "Product update announcement. CC'd Priya and 30 other accounts."},
    {"type": "email", "date": "2024-06-12", "summary": "Support ticket thread. Resolved in 2 days."},
    {"type": "email", "date": "2024-05-20", "summary": "Post-call follow-up confirming 3% discount and support tier upgrade."},
    {"type": "email", "date": "2024-04-01", "summary": "Quarterly business review invite."},
    {"type": "email", "date": "2024-02-18", "summary": "Feature request acknowledgement."},
    {"type": "email", "date": "2023-11-10", "summary": "Holiday card + renewal reminder."},
    {"type": "email", "date": "2023-06-25", "summary": "Mid-year usage report. Flags potential overage."},
    {"type": "email", "date": "2023-02-08", "summary": "Account review kickoff."},
]

DATAPIPE = [
    {"type": "contract", "date": "2023-03-15", "summary": "DataPipe initial contract. $110,000/yr. Contact: Ananya Rao."},
    {"type": "contract", "date": "2024-03-15", "summary": "DataPipe renewal. $120,000/yr. Volume commitment (500GB/month) secured 5% discount."},
    {"type": "call", "date": "2024-02-20", "summary": "Pre-renewal call. Priya committed to volume. Ananya offered 5% discount. OUTCOME: Successful concession."},
    {"type": "call", "date": "2024-01-10", "summary": "Priya mentioned considering Fivetran as alternative. Ananya was frosty, relationship chilled 2 weeks. OUTCOME: Escalated."},
]

SECURENET = [
    {"type": "contract", "date": "2023-07-01", "summary": "SecureNet contract. $80,000/yr. Contact: James Wu."},
    {"type": "call", "date": "2024-06-15", "summary": "Priya shared Okta and CrowdStrike quotes. James matched pricing to $85,000 with added MFA features. OUTCOME: Successful concession."},
    {"type": "call", "date": "2023-09-04", "summary": "Priya threatened cancellation over a SLA miss. James escalated. Relationship strained. OUTCOME: Escalated."},
]

VENDORS = {
    "nexacloud": {
        "name": "NexaCloud",
        "annual_value": 380000,
        "renewal_date": "2025-12-31",
        "contact": "Marcus Chen",
        "interactions": NEXACLOUD,
    },
    "datapipe": {
        "name": "DataPipe",
        "annual_value": 120000,
        "renewal_date": "2026-03-15",
        "contact": "Ananya Rao",
        "interactions": DATAPIPE,
    },
    "securenet": {
        "name": "SecureNet",
        "annual_value": 85000,
        "renewal_date": "2026-07-01",
        "contact": "James Wu",
        "interactions": SECURENET,
    },
}
