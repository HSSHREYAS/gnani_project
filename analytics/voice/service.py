"""Grounded voice-answer composition over the existing MatsyaMitra read model."""

from __future__ import annotations

from typing import Any

from sqlalchemy.orm import Session

from analytics.current_state import CurrentLocationEnvironmentalState, get_current_environmental_state_for_location
from analytics.incois.repository import IncoisAdvisoryRepository
from analytics.scoring.config import DEFAULT_SCORING_CONFIG
from analytics.voice.intent import IntentResult, detect_intent, is_kannada_text, resolve_location_id


def _number(value: float | None, digits: int = 1) -> str:
    return "not available" if value is None else f"{value:.{digits}f}"


def _kmh(speed_mps: float | None) -> str:
    """Wind speed in km/h — the unit the app shows everywhere else."""
    return "not available" if speed_mps is None else f"{speed_mps * 3.6:.0f}"


# Kannada wording for the fixed category labels produced by the scoring engines.
_KN_CATEGORY = {
    "Safe": "ಸುರಕ್ಷಿತ",
    "Low Risk": "ಕಡಿಮೆ ಅಪಾಯ",
    "Moderate Risk": "ಮಧ್ಯಮ ಅಪಾಯ",
    "High Risk": "ಹೆಚ್ಚು ಅಪಾಯ",
    "Extreme Risk": "ತೀವ್ರ ಅಪಾಯ",
    "Highly Favourable": "ಅತ್ಯಂತ ಅನುಕೂಲಕರ",
    "Favourable": "ಅನುಕೂಲಕರ",
    "Moderate": "ಸಾಧಾರಣ",
    "Low": "ಕಡಿಮೆ",
    "Very Low": "ತುಂಬಾ ಕಡಿಮೆ",
    "Unknown": "ಮಾಹಿತಿ ಇಲ್ಲ",
}

# Kannada spellings of the canonical place names (same list the mobile app uses).
_KN_PLACE = {
    "Karwar": "ಕಾರವಾರ", "Kundapura": "ಕುಂದಾಪುರ", "Kumta": "ಕುಮಟಾ", "Ankola": "ಅಂಕೋಲಾ",
    "Someshwara": "ಸೋಮೇಶ್ವರ", "Bhatkal Deep Sea": "ಭಟ್ಕಳ ಆಳಸಮುದ್ರ", "Malpe Offshore": "ಮಲ್ಪೆ ಕಡಲಾಚೆ",
    "Maravanthe": "ಮರವಂತೆ", "Baindur": "ಬೈಂದೂರು", "Kundapura Coast": "ಕುಂದಾಪುರ ತೀರ",
    "Gangolli": "ಗಂಗೊಳ್ಳಿ", "Shiroor": "ಶಿರೂರು", "Gokarna": "ಗೋಕರ್ಣ",
    "Mangalore Deep Sea": "ಮಂಗಳೂರು ಆಳಸಮುದ್ರ", "Surathkal": "ಸುರತ್ಕಲ್", "Honnavar": "ಹೊನ್ನಾವರ",
    "Belekeri": "ಬೇಲೇಕೇರಿ", "Malpe": "ಮಲ್ಪೆ", "Bhatkal Offshore": "ಭಟ್ಕಳ ಕಡಲಾಚೆ",
    "Murudeshwar": "ಮುರುಡೇಶ್ವರ", "Netrani Deep Sea": "ನೇತ್ರಾಣಿ ಆಳಸಮುದ್ರ", "Kaup": "ಕಾಪು",
    "Ullal Offshore": "ಉಳ್ಳಾಲ ಕಡಲಾಚೆ", "Manki": "ಮಂಕಿ", "Mangalore": "ಮಂಗಳೂರು",
}


def _kn_category(category: str | None) -> str:
    return _KN_CATEGORY.get((category or "").strip(), category or "")


def build_answer(
    session: Session,
    location_id: str,
    transcript: str,
    detected_language_code: str | None = None,
    language_hint: str | None = None,
) -> dict[str, Any]:
    # Priority: explicit language_hint > provider's detected language > script detection.
    # language_hint allows the app UI language to override auto-detection so that a
    # Kannada-first user typing an English transliteration still gets a Kannada answer.
    if language_hint and language_hint.startswith("kn"):
        language = "kn-IN"
    elif language_hint and language_hint.startswith("en"):
        language = "en-IN"
    else:
        language = "kn-IN" if (detected_language_code or "").startswith("kn") or is_kannada_text(transcript) else "en-IN"
    resolved_location_id = resolve_location_id(transcript, location_id.strip())
    state: CurrentLocationEnvironmentalState | None = get_current_environmental_state_for_location(
        session, resolved_location_id
    )
    if state is None:
        answer = (
            "ಆ ಕರಾವಳಿ ಸ್ಥಳವನ್ನು ಹುಡುಕಲಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಆ್ಯಪ್ ಪಟ್ಟಿಯಿಂದ ಸ್ಥಳ ಆಯ್ಕೆಮಾಡಿ."
            if language == "kn-IN" else
            "I could not find that coastal location. Please choose a location from the app list."
        )
        return {
            "intent": detect_intent(transcript).intent,
            "answer": answer,
            "language": language,
            "location_id": resolved_location_id,
            "location_name": None,
            "source": None,
            "observed_at": None,
            "freshness": "MISSING",
            "data": None,
        }

    intent: IntentResult = detect_intent(transcript)
    city = state.city_name
    # Place name as spoken in the answer language; the response still reports `city`.
    place = _KN_PLACE.get(city, city) if language == "kn-IN" else city
    data: dict[str, Any] = {}
    source: str | None = None
    observed_at: str | None = None
    freshness = "MISSING"

    if intent.intent in ("marine_conditions", "summary"):
        risk = state.risk
        if risk is None:
            answer = (
                f"{place}: ಪ್ರಸ್ತುತ ಸಮುದ್ರದ ಗಾಳಿ ಮತ್ತು ಅಲೆಗಳ ಮಾಹಿತಿ ಲಭ್ಯವಿಲ್ಲ."
                if language == "kn-IN" else f"Current wind and wave observations are unavailable for {city}."
            )
        else:
            freshness = risk.status
            source = risk.source
            observed_at = risk.observation_timestamp.isoformat()
            data = {
                "wind_speed_mps": risk.wind_speed,
                "wave_height_m": risk.wave_height,
                "risk_score": risk.score,
                "risk_category": risk.category,
                "confidence": risk.confidence,
                "age_hours": risk.age_hours,
                "status": risk.status,
            }
            if language == "kn-IN":
                answer = (
                    f"{place} ಸಮುದ್ರದ ಮಾಹಿತಿ: ಗಾಳಿಯ ವೇಗ ಗಂಟೆಗೆ {_kmh(risk.wind_speed)} ಕಿಲೋಮೀಟರ್, "
                    f"ಅಲೆಗಳ ಎತ್ತರ {_number(risk.wave_height)} ಮೀಟರ್. ಅಪಾಯ ವರ್ಗ: {_kn_category(risk.category)}. "
                    f"ಮಾಹಿತಿಯ ಸ್ಥಿತಿ: {'ಹಳೆಯ ಮಾಹಿತಿ' if risk.status == 'STALE' else 'ಪ್ರಸ್ತುತ ಓದು'}. "
                    "ಇದು ನಿರ್ಧಾರಕ್ಕೆ ಸಹಾಯಕ ಮಾಹಿತಿ ಮಾತ್ರ; ಹೊರಡುವ ಮೊದಲು ಅಧಿಕೃತ ಹವಾಮಾನ ಮತ್ತು ಕರಾವಳಿ ಎಚ್ಚರಿಕೆ ಪರಿಶೀಲಿಸಿ."
                )
            else:
                answer = (
                    f"{city}: wind {_kmh(risk.wind_speed)} km/h; significant wave height "
                    f"{_number(risk.wave_height)} m. Observation freshness: {risk.status.lower()}. "
                    "This is decision support, not a sailing clearance. Check official marine warnings before departure."
                )
            if intent.intent == "unknown":
                answer += " Please ask about sea conditions, marine risk, or an official INCOIS fishing advisory." if language == "en-IN" else " ಸಮುದ್ರದ ಸ್ಥಿತಿ, ಅಪಾಯ ಅಥವಾ ಅಧಿಕೃತ INCOIS ಮೀನುಗಾರಿಕೆ ಸಲಹೆ ಬಗ್ಗೆ ಕೇಳಬಹುದು."

    elif intent.intent == "marine_risk":
        risk = state.risk
        if risk is None:
            answer = f"{place}: ಅಪಾಯದ ಅಂಕ ಲೆಕ್ಕಿಸಲು ಪ್ರಸ್ತುತ ಮಾಹಿತಿ ಲಭ್ಯವಿಲ್ಲ." if language == "kn-IN" else f"Current observations are unavailable to report a marine risk score for {city}."
        else:
            freshness, source = risk.status, risk.source
            observed_at = risk.observation_timestamp.isoformat()
            data = {
                "risk_score": risk.score,
                "risk_category": risk.category,
                "wind_speed_mps": risk.wind_speed,
                "wave_height_m": risk.wave_height,
                "confidence": risk.confidence,
                "age_hours": risk.age_hours,
                "status": risk.status,
            }
            if risk.status == "STALE":
                freshness_notice_kn = " ಈ ಅಂಕದ ಮಾಹಿತಿ ಹಳೆಯದಾಗಿದೆ; ಇದನ್ನು ಇಂದಿನ ಪರಿಸ್ಥಿತಿಯೆಂದು ಪರಿಗಣಿಸಬೇಡಿ."
                freshness_notice_en = " The observation is stale; do not treat it as a live sea condition."
            else:
                freshness_notice_kn = freshness_notice_en = ""
            if language == "kn-IN":
                answer = f"{place}: ಸಮುದ್ರದ ಅಪಾಯದ ಅಂಕ ಹತ್ತರಲ್ಲಿ {_number(risk.score)}; ವರ್ಗ {_kn_category(risk.category)}.{freshness_notice_kn} ಇದು ಸುರಕ್ಷಿತವಾಗಿ ಹೊರಡಲು ಅನುಮತಿ ಅಲ್ಲ. ಅಧಿಕೃತ ಎಚ್ಚರಿಕೆಗಳನ್ನು ಪರಿಶೀಲಿಸಿ."
            else:
                answer = f"{city} marine-risk score: {_number(risk.score)}/10 ({risk.category}).{freshness_notice_en} This score is not a guarantee that it is safe to sail. Check official warnings."

    elif intent.intent == "risk_explanation":
        wave_weight = DEFAULT_SCORING_CONFIG.risk_weights.get("wave", 0.60)
        wind_weight = DEFAULT_SCORING_CONFIG.risk_weights.get("wind", 0.40)
        risk = state.risk
        if risk:
            freshness, source = risk.status, risk.source
            observed_at = risk.observation_timestamp.isoformat()
            data = {
                "risk_score": risk.score,
                "risk_category": risk.category,
                "wind_speed_mps": risk.wind_speed,
                "wave_height_m": risk.wave_height,
                "wave_weight": wave_weight,
                "wind_weight": wind_weight,
                "status": risk.status,
            }
        if language == "kn-IN":
            answer = (
                f"ಮತ್ಸ್ಯಮಿತ್ರದ ಅಪಾಯ ಮಾದರಿಯಲ್ಲಿ ಅಲೆಗಳಿಗೆ {wave_weight:.0%} ಮತ್ತು ಗಾಳಿಗೆ {wind_weight:.0%} ತೂಕ ನೀಡಲಾಗಿದೆ. "
                "ಮೊದಲು ಪ್ರತಿಯೊಂದು ಅಂಶವನ್ನು ಅದರ ಮಾದರಿ ಮಿತಿಗಳ ಪ್ರಕಾರ ಸಾಮಾನ್ಯೀಕರಿಸಿ ನಂತರ ಒಟ್ಟುಗೂಡಿಸಲಾಗುತ್ತದೆ. "
                "ಯಾವುದಾದರೂ ಅಳತೆ ಇಲ್ಲದಿದ್ದರೆ ಲಭ್ಯವಿರುವ ಅಂಶಗಳ ತೂಕ ಮರುಹೊಂದಿಸಲಾಗುತ್ತದೆ. ಇದು ಹಡಗು-ನಿರ್ದಿಷ್ಟ ಸುರಕ್ಷತಾ ಪ್ರಮಾಣೀಕರಣವಲ್ಲ."
            )
        else:
            answer = (
                f"The existing MatsyaMitra model weights waves at {wave_weight:.0%} and wind at {wind_weight:.0%}. "
                "It normalizes each input using the configured model ranges before combining them; if a measurement is missing, "
                "the available weights are redistributed. These are app model settings, not vessel-specific validated safety limits."
            )

    elif intent.intent == "official_pfz":
        repository = IncoisAdvisoryRepository(session)
        # Ask for the latest stored bulletin per sampling location rather than
        # only the globally latest date; a newer bulletin may not cover every coast.
        matching = [
            row for row in repository.get_latest_advisory_per_location()
            if row.nearest_sampling_location_id == state.sampling_location_id
        ]
        if not matching:
            answer = (
                f"{place}: ಅಧಿಕೃತ INCOIS ಮೀನುಗಾರಿಕೆ ವಲಯದ ಸಲಹೆ ಇತ್ತೀಚಿನ ಬುಲೆಟಿನ್‌ನಲ್ಲಿ ಸಿಗಲಿಲ್ಲ. "
                "ಉಪಗ್ರಹ ಆಧಾರಿತ ಅಂದಾಜನ್ನು ಅಧಿಕೃತ INCOIS ಸಲಹೆಯೆಂದು ಪರಿಗಣಿಸಬೇಡಿ."
                if language == "kn-IN" else
                f"No location-matched official INCOIS PFZ advisory was found for {city} in the latest stored bulletin. "
                "A satellite-derived estimate must not be treated as an official INCOIS advisory."
            )
        else:
            # If several bulletin rows map to this location on the same date,
            # present the geographically closest match first.
            newest_date = max(row.advisory_date for row in matching)
            same_day = [row for row in matching if row.advisory_date == newest_date]
            latest = min(
                same_day,
                key=lambda row: row.distance_to_nearest_km if row.distance_to_nearest_km is not None else float("inf"),
            )
            source, observed_at, freshness = "INCOIS", latest.advisory_date.isoformat(), "BULLETIN_DATE"
            data = {
                "official": True,
                "advisory_date": latest.advisory_date.isoformat(),
                "landing_center": latest.landing_center,
                "bearing_degrees": latest.bearing_degrees,
                "distance_km": latest.distance_km,
                "depth_m": latest.depth_m,
                "latitude": latest.latitude,
                "longitude": latest.longitude,
                "raw_text": latest.raw_text,
            }
            if language == "kn-IN":
                answer = (
                    f"{place}: ಅಧಿಕೃತ INCOIS ಬುಲೆಟಿನ್ ದಿನಾಂಕ {observed_at}. "
                    f"ಲ್ಯಾಂಡಿಂಗ್ ಕೇಂದ್ರ: {_KN_PLACE.get(latest.landing_center, latest.landing_center)}. ದೂರ: {_number(latest.distance_km)} ಕಿಲೋಮೀಟರ್; "
                    f"ದಿಕ್ಕು: {_number(latest.bearing_degrees, 0)} ಡಿಗ್ರಿ; ಆಳ: {_number(latest.depth_m)} ಮೀಟರ್. "
                    "ಹೊರಡುವ ಮೊದಲು ಬುಲೆಟಿನ್‌ನ ಮಾನ್ಯತೆಯನ್ನು ಪರಿಶೀಲಿಸಿ."
                )
            else:
                answer = (
                    f"Latest stored official INCOIS advisory matched to {city} is dated {observed_at}. "
                    f"Landing centre: {latest.landing_center}; distance: {_number(latest.distance_km)} km; "
                    f"bearing: {_number(latest.bearing_degrees, 0)} degrees; depth: {_number(latest.depth_m)} m. "
                    "Check the bulletin's validity before departure."
                )

    elif intent.intent == "model_pfz":
        pfz = state.pfz
        if pfz is None:
            answer = f"{place}: ಉಪಗ್ರಹ ಆಧಾರಿತ ಮೀನು ವಲಯದ ಅಂದಾಜು ಲಭ್ಯವಿಲ್ಲ." if language == "kn-IN" else f"No satellite-derived PFZ estimate is available for {city}."
        else:
            source, observed_at, freshness = pfz.source, pfz.observation_date.isoformat(), pfz.status
            data = {
                "official": False,
                "score": pfz.score,
                "category": pfz.category,
                "sst_c": pfz.sst,
                "chlorophyll_mg_m3": pfz.chlorophyll,
                "confidence": pfz.confidence,
                "age_hours": pfz.age_hours,
                "status": pfz.status,
            }
            if language == "kn-IN":
                answer = f"{place} ಉಪಗ್ರಹ ಆಧಾರಿತ ಅಂದಾಜು: {_kn_category(pfz.category)}, ಅಂಕ ಹತ್ತರಲ್ಲಿ {_number(pfz.score)}. ಮೂಲ: {pfz.source}; ದಿನಾಂಕ {observed_at}. ಇದು ಮತ್ಸ್ಯಮಿತ್ರದ ಮಾದರಿ ಅಂದಾಜು ಮಾತ್ರ, ಅಧಿಕೃತ INCOIS ಸಲಹೆ ಅಲ್ಲ."
            else:
                answer = f"{city} satellite-derived suitability estimate: {pfz.category} ({_number(pfz.score)}/10), dated {observed_at}, source {pfz.source}. This is a MatsyaMitra model estimate, not an official INCOIS advisory."

    else:
        answer = (
            "ದಯವಿಟ್ಟು ಗಾಳಿ, ಅಲೆಗಳ ಎತ್ತರ, ಸಮುದ್ರದ ಅಪಾಯ, ಅಧಿಕೃತ INCOIS PFZ ಅಥವಾ ಅಪಾಯದ ಲೆಕ್ಕಾಚಾರ ಬಗ್ಗೆ ಕೇಳಿ."
            if language == "kn-IN" else
            "You can ask about wind, wave height, marine risk, the official INCOIS PFZ bulletin, or how the risk score is calculated."
        )

    return {
        "intent": intent.intent,
        "intent_confidence": intent.confidence,
        "answer": answer,
        "language": language,
        "location_id": state.location_id,
        "location_name": city,
        "source": source,
        "observed_at": observed_at,
        "freshness": freshness,
        "data": data,
    }
