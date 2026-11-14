"""Deterministic Kannada/English intent routing for marine questions.

This intentionally does not use an LLM to invent measurements. It only maps
recognized text to existing MatsyaMitra read models and repositories.
"""

from __future__ import annotations

import re
from dataclasses import dataclass

from analytics.config import CANONICAL_CITY_NAMES


@dataclass(frozen=True)
class IntentResult:
    intent: str
    confidence: float


_RULES: tuple[tuple[str, tuple[str, ...]], ...] = (
    (
        "risk_explanation",
        (
            "why risk", "explain risk", "risk score how", "risk calculation",
            "ಅಪಾಯ ಹೇಗೆ", "ಅಪಾಯದ ಲೆಕ್ಕ", "ಅಪಾಯ ಸ್ಕೋರ್ ಹೇಗೆ", "ಯಾಕೆ ಅಪಾಯ",
        ),
    ),
    # Explicit satellite/GEE wording takes precedence over the generic PFZ rule.
    (
        "model_pfz",
        (
            "satellite pfz", "gee pfz", "satellite suitability", "model pfz",
            "ಉಪಗ್ರಹ ಪಿಎಫ್‌ಝೆಡ್", "ಉಪಗ್ರಹ ಮಾಹಿತಿ", "ಸ್ಯಾಟಲೈಟ್",
        ),
    ),
    (
        "official_pfz",
        (
            "incois", "official pfz", "official fishing zone", "official advisory",
            "fishing zone", "fishing advisory", "pfz", "ಮೀನುಗಾರಿಕೆ ಸಲಹೆ",
            "ಮೀನುಗಾರಿಕೆ ವಲಯ", "ಮೀನುಗಾರಿಕೆ ಪ್ರದೇಶ", "ಅಧಿಕೃತ ಪಿಎಫ್‌ಝೆಡ್",
            "ಇನ್ಕಾಯ್ಸ್", "ಸರ್ಕಾರಿ ಸಲಹೆ", "ಮೀನು ಸಿಗುವ ಜಾಗ",
        ),
    ),
    (
        "marine_risk",
        (
            "risk", "danger", "rough sea", "safe", "wave risk", "wind risk",
            "can i sail", "can i go fishing", "sea safety", "ಅಪಾಯ", "ಸಮುದ್ರ ಅಪಾಯ",
            "ಅಲೆ ಅಪಾಯ", "ಗಾಳಿ ಅಪಾಯ", "ಸುರಕ್ಷಿತ", "ಸಮುದ್ರಕ್ಕೆ ಹೋಗಬಹುದಾ",
            "ಸಮುದ್ರಕ್ಕೆ ಹೋಗಬಹುದೇ", "ಹೊರಡಬಹುದಾ", "ದೋಣಿ ತೆಗೆದುಕೊಂಡು ಹೋಗಬಹುದಾ",
        ),
    ),
    (
        "marine_conditions",
        (
            "weather", "conditions", "condition", "wind", "wave", "sea condition", "wind speed",
            "what is the", "how is the sea", "sea status", "sea state",
            "ಹವಾಮಾನ", "ಗಾಳಿ", "ಅಲೆ", "ಸಮುದ್ರದ ಸ್ಥಿತಿ", "ಗಾಳಿಯ ವೇಗ", "ಅಲೆ ಎತ್ತರ",
            "ಸ್ಥಿತಿ ಏನು", "ಹೇಗಿದೆ", "ಸಮುದ್ರ ಹೇಗಿದೆ",
        ),
    ),
    (
        "summary",
        (
            "today", "today summary", "sea update", "marine update", "right now", "current",
            "now", "ನಮಸ್ಕಾರ",
            "ಇಂದಿನ ಮಾಹಿತಿ", "ಇಂದಿನ ಸ್ಥಿತಿ", "ಸಮುದ್ರದ ಮಾಹಿತಿ", "ಈಗ",
        ),
    ),
)


def detect_intent(text: str) -> IntentResult:
    """Map a transcript to a known intent without performing fuzzy guessing."""
    normalized = re.sub(r"\s+", " ", (text or "").strip().lower())
    if not normalized:
        return IntentResult("unknown", 0.0)

    for intent, phrases in _RULES:
        for phrase in phrases:
            if phrase in normalized:
                # Exact phrase match confidence is intentionally rule-based,
                # not a calibrated probability from a trained classifier.
                return IntentResult(intent, 0.92 if len(phrase) > 4 else 0.86)

    return IntentResult("unknown", 0.25)


def is_kannada_text(text: str) -> bool:
    """Return True when the transcript contains Kannada Unicode characters."""
    return any("\u0c80" <= character <= "\u0cff" for character in (text or ""))


_KANNADA_LOCATION_ALIASES = {
    "ಕಾರವಾರ": "KARN_001", "ಕುಂದಾಪುರ": "KARN_002", "ಕುಮಟಾ": "KARN_003",
    "ಅಂಕೋಲಾ": "KARN_004", "ಸೋಮೇಶ್ವರ": "KARN_005", "ಭಟ್ಕಳ": "KARN_006",
    "ಮಲ್ಪೆ": "KARN_018", "ಮರವಂತೆ": "KARN_008", "ಬೈಂದೂರು": "KARN_009",
    "ಗಂಗೊಳ್ಳಿ": "KARN_011", "ಶಿರೂರು": "KARN_012", "ಗೋಕರ್ಣ": "KARN_013",
    "ಮಂಗಳೂರು": "KARN_025", "ಸುರತ್ಕಲ್": "KARN_015", "ಹೊನ್ನಾವರ": "KARN_016",
    "ಬೇಲೇಕೇರಿ": "KARN_017", "ಮುರ್ಡೇಶ್ವರ": "KARN_020", "ನೇತ್ರಾಣಿ": "KARN_021",
    "ಕಾಪು": "KARN_022", "ಉಳ್ಳಾಲ": "KARN_023", "ಮಂಕಿ": "KARN_024",
}


def resolve_location_id(text: str, fallback_location_id: str) -> str:
    """Resolve an unambiguous city mentioned in a transcript; otherwise use selection.

    The UI-selected station remains the fallback. If the user mentions two distinct
    stations, the service does not guess between them.
    """
    normalized = re.sub(r"\s+", " ", (text or "").strip().lower())
    location_matches: list[tuple[int, int, str]] = []
    # Combine Kannada and English spans before deciding. This prevents a mixed
    # query such as "ಕಾರವಾರ weather at Malpe" from silently choosing one place.
    for location_id, city_name in CANONICAL_CITY_NAMES.items():
        name = city_name.lower()
        for match in re.finditer(r"(?<![a-z0-9])" + re.escape(name) + r"(?![a-z0-9])", normalized):
            location_matches.append((match.start(), match.end(), location_id))
    for alias, location_id in _KANNADA_LOCATION_ALIASES.items():
        for match in re.finditer(re.escape(alias), normalized):
            location_matches.append((match.start(), match.end(), location_id))

    if not location_matches:
        return fallback_location_id

    retained: list[tuple[int, int, str]] = []
    for candidate in location_matches:
        start, end, _ = candidate
        # Longer canonical compounds shadow shorter names only when they cover
        # the same span (e.g. "Mangalore Deep Sea" includes "Mangalore").
        shadowed = any(
            other_start <= start and end <= other_end
            and (other_start, other_end) != (start, end)
            for other_start, other_end, _ in location_matches
        )
        if not shadowed:
            retained.append(candidate)
    matched_ids = {location_id for _, _, location_id in retained}
    return next(iter(matched_ids)) if len(matched_ids) == 1 else fallback_location_id
