"""Turns a raw exercise-quality prediction (from the LSTM model or the
heuristic RepCounter) into a human-readable corrective feedback message.

Kept separate from ai/inference on purpose, mirroring the PPT's system
architecture (slide 7): "AI Processing" produces a performance score,
then a distinct "Feedback" step turns that score into guidance a patient
can act on. This also means feedback copy can be improved independently
of the scoring model.
"""

from dataclasses import dataclass
from typing import Optional


@dataclass
class RepFeedback:
    label: str
    message: str
    severity: str  # "positive" | "info" | "warning"


_CORRECT_MESSAGES = [
    "Nice rep! Full range of motion.",
    "Great form -- keep that pace.",
    "That's a clean rep, well controlled.",
]

_INCORRECT_MESSAGES_BY_AREA = {
    "elbow": "Try to fully extend and fully curl on each rep.",
    "shoulder": "Raise a little higher before lowering back down.",
    "hip": "Hinge further at the hip to complete the movement.",
    "knee": "Bend a little deeper before returning to standing.",
    "default": "Try to complete the full range of motion on this rep.",
}


def _area_key(target_area: Optional[str]) -> str:
    if not target_area:
        return "default"

    lowered = target_area.lower()

    for key in _INCORRECT_MESSAGES_BY_AREA:
        if key in lowered:
            return key

    return "default"


def generate_feedback(
    label: str,
    confidence: Optional[float] = None,
    target_area: Optional[str] = None,
    rep_index: Optional[int] = None,
) -> RepFeedback:
    """Build a single rep's feedback. `label` is "correct" or "incorrect",
    as produced by either ai.inference.lstm_predictor.predict or the
    frontend's real-time heuristic."""

    if label == "correct":
        message = _CORRECT_MESSAGES[(rep_index or 0) % len(_CORRECT_MESSAGES)]
        severity = "positive"
    else:
        message = _INCORRECT_MESSAGES_BY_AREA[_area_key(target_area)]
        severity = "warning"

    if confidence is not None and confidence < 0.6:
        message += " (Low confidence -- make sure your full body is visible to the camera.)"
        severity = "info"

    return RepFeedback(label=label, message=message, severity=severity)


def generate_session_summary(
    total_reps: int,
    correct_reps: int,
    target_area: Optional[str] = None,
) -> str:
    """Build an end-of-session summary sentence, used as a fallback when
    no richer summary is supplied by the frontend."""

    if total_reps == 0:
        return "No repetitions were detected during this session."

    accuracy = round((correct_reps / total_reps) * 100)

    if accuracy >= 85:
        tone = "Excellent session overall."
    elif accuracy >= 60:
        tone = "Good session, with room to tighten up form."
    else:
        tone = "Focus on range of motion next session."

    area_note = f" for {target_area}" if target_area else ""

    return (
        f"Completed {total_reps} reps{area_note} with {accuracy}% form accuracy. "
        f"{tone}"
    )
