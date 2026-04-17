import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from ingest import compute_diffs

def test_diffs_empty_when_nothing_changes():
    old = [{"name": "A", "confidence": 0.5}]
    new = [{"name": "A", "confidence": 0.5}]
    assert compute_diffs(old, new) == {}

def test_diffs_below_threshold_omitted():
    old = [{"name": "A", "confidence": 0.500}]
    new = [{"name": "A", "confidence": 0.505}]
    assert compute_diffs(old, new) == {}

def test_diffs_up_direction():
    old = [{"name": "A", "confidence": 0.50}]
    new = [{"name": "A", "confidence": 0.68}]
    diffs = compute_diffs(old, new)
    assert "A" in diffs
    assert diffs["A"]["old"] == 0.50
    assert diffs["A"]["new"] == 0.68
    assert diffs["A"]["direction"] == "up"
    assert abs(diffs["A"]["delta"] - 0.18) < 0.001

def test_diffs_down_direction():
    old = [{"name": "AWS", "confidence": 0.87}]
    new = [{"name": "AWS", "confidence": 0.79}]
    diffs = compute_diffs(old, new)
    assert diffs["AWS"]["direction"] == "down"
    assert diffs["AWS"]["delta"] < 0

def test_diffs_new_tactic_treated_as_zero_baseline():
    old = []
    new = [{"name": "Multi-year", "confidence": 0.50}]
    diffs = compute_diffs(old, new)
    assert diffs["Multi-year"]["old"] == 0.0
    assert diffs["Multi-year"]["new"] == 0.50
    assert diffs["Multi-year"]["direction"] == "up"

def test_diffs_missing_new_tactic_omitted():
    old = [{"name": "Old thing", "confidence": 0.30}]
    new = []
    assert compute_diffs(old, new) == {}
