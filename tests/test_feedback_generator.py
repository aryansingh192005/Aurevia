import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from ai.feedback.feedback_generator import generate_feedback, generate_session_summary


def test_correct_rep_feedback_is_positive():
    feedback = generate_feedback("correct", confidence=0.9)

    assert feedback.severity == "positive"
    assert feedback.label == "correct"


def test_incorrect_rep_feedback_mentions_target_area():
    feedback = generate_feedback("incorrect", confidence=0.9, target_area="Knee")

    assert feedback.severity == "warning"
    assert "deeper" in feedback.message or "movement" in feedback.message


def test_low_confidence_downgrades_severity():
    feedback = generate_feedback("correct", confidence=0.3)

    assert feedback.severity == "info"
    assert "camera" in feedback.message


def test_session_summary_with_no_reps():
    assert generate_session_summary(0, 0) == "No repetitions were detected during this session."


def test_session_summary_reports_accuracy():
    summary = generate_session_summary(10, 9, target_area="elbow")

    assert "90%" in summary
    assert "elbow" in summary
