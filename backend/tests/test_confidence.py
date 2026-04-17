import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from briefing import confidence

def test_confidence_zero_uses_returns_zero():
    assert confidence(successes=0, total_uses=0, months_since_last_use=0) == 0.0

def test_confidence_two_of_two_recent():
    assert confidence(successes=2, total_uses=2, months_since_last_use=0) == 1.0

def test_confidence_decay_after_twelve_months():
    # 0.9^12 ≈ 0.2824 which is below the 0.3 floor, so result floors at 0.3
    result = confidence(successes=2, total_uses=2, months_since_last_use=12)
    assert result == 0.3

def test_confidence_floors_at_0_3_factor():
    assert confidence(successes=10, total_uses=10, months_since_last_use=100) == 0.3

def test_confidence_anti_pattern_low_success_rate():
    result = confidence(successes=0, total_uses=3, months_since_last_use=24)
    assert result == 0.0

def test_confidence_rounds_to_two_decimals():
    result = confidence(successes=2, total_uses=3, months_since_last_use=6)
    assert result == round(result, 2)
