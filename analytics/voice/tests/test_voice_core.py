from __future__ import annotations

from datetime import datetime, timezone
from types import SimpleNamespace
from unittest.mock import patch

from analytics.voice.audio_store import AudioStore
from analytics.voice.gnani_client import GnaniConfigurationError, GnaniSpeechClient
from analytics.voice.intent import detect_intent, is_kannada_text, resolve_location_id
from analytics.voice.service import build_answer


class FakeResponse:
    def __init__(self, *, payload=None, content=b"", status_code=200, ok=True):
        self._payload = payload or {}
        self.content = content
        self.status_code = status_code
        self.ok = ok

    def json(self):
        return self._payload


def fake_state():
    risk = SimpleNamespace(
        score=5.3,
        category="Moderate Risk",
        confidence=0.87,
        observation_timestamp=datetime.now(timezone.utc),
        source="open-meteo",
        age_hours=0.4,
        status="CURRENT",
        wind_speed=6.2,
        wave_height=1.4,
    )
    return SimpleNamespace(
        sampling_location_id=18,
        location_id="KARN_018",
        city_name="Malpe",
        latitude=13.35,
        longitude=74.73,
        risk=risk,
        pfz=None,
    )


def test_kannada_and_english_intents_are_routed_deterministically():
    assert detect_intent("ಸಮುದ್ರದ ಅಪಾಯ ಎಷ್ಟು?").intent == "marine_risk"
    assert detect_intent("Explain risk score").intent == "risk_explanation"
    assert detect_intent("official INCOIS PFZ advisory").intent == "official_pfz"
    assert detect_intent("what is the sea condition?").intent == "marine_conditions"
    assert detect_intent("random unrelated sentence").intent == "unknown"
    assert is_kannada_text("ಮಲ್ಪೆಯಲ್ಲಿ ಗಾಳಿ ಹೇಗಿದೆ?")
    assert resolve_location_id("sea condition at Malpe", "KARN_001") == "KARN_018"
    assert resolve_location_id("conditions near Malpe Offshore", "KARN_001") == "KARN_007"
    assert resolve_location_id("Mangalore Deep Sea risk", "KARN_001") == "KARN_014"
    assert resolve_location_id("ಕಾರವಾರದಲ್ಲಿ ಅಲೆ ಹೇಗಿದೆ", "KARN_018") == "KARN_001"
    assert resolve_location_id("Karwar and Malpe", "KARN_002") == "KARN_002"
    assert resolve_location_id("ಕಾರವಾರ weather at Malpe", "KARN_002") == "KARN_002"
    assert detect_intent("satellite PFZ estimate").intent == "model_pfz"


def test_prisma_client_uses_multipart_and_code_mix_hints():
    client = GnaniSpeechClient(api_key="test-key")
    with patch("analytics.voice.gnani_client.requests.post", return_value=FakeResponse(
        payload={"transcript": "ಮಲ್ಪೆಯಲ್ಲಿ sea condition ಹೇಗಿದೆ?", "detected_language_code": "kn-IN", "model": "prisma-v3.0"}
    )) as post:
        result = client.transcribe(b"fake-audio", "sample.m4a", "audio/mp4")

    assert result.detected_language_code == "kn-IN"
    assert result.model == "prisma-v3.0"
    kwargs = post.call_args.kwargs
    assert kwargs["headers"]["X-API-Key-ID"] == "test-key"
    assert kwargs["files"]["audio_file"][0] == "sample.m4a"
    assert kwargs["data"]["format"] == "codemix"
    assert "kn-IN" in kwargs["data"]["language_code"]


def test_timbre_client_returns_raw_wav_and_uses_kannada_voice():
    client = GnaniSpeechClient(api_key="test-key")
    with patch("analytics.voice.gnani_client.requests.post", return_value=FakeResponse(content=b"RIFFfakeWAV")) as post:
        audio = client.synthesize_kannada("ನಮಸ್ಕಾರ")
    assert audio.startswith(b"RIFF")
    payload = post.call_args.kwargs["json"]
    assert payload["model"] == "timbre-v2.5"
    assert payload["voice"] == "Kavin"
    assert payload["language"] == "kn-IN"
    assert payload["audio_config"]["container"] == "wav"


def test_marine_risk_answer_is_grounded_in_existing_read_model():
    with patch("analytics.voice.service.get_current_environmental_state_for_location", return_value=fake_state()):
        result = build_answer(None, "KARN_018", "ಸಮುದ್ರದ ಅಪಾಯ ಎಷ್ಟು?", "kn-IN")
    assert result["intent"] == "marine_risk"
    assert result["data"]["risk_score"] == 5.3
    assert result["source"] == "open-meteo"
    assert result["freshness"] == "CURRENT"
    assert "5.3" in result["answer"]


def test_risk_explanation_uses_existing_model_weights_not_raw_formula():
    with patch("analytics.voice.service.get_current_environmental_state_for_location", return_value=fake_state()):
        result = build_answer(None, "KARN_018", "Explain risk score", "en-IN")
    assert result["intent"] == "risk_explanation"
    assert result["data"]["wave_weight"] == 0.60
    assert result["data"]["wind_weight"] == 0.40
    assert "normalizes" in result["answer"]


def test_audio_store_returns_bytes_and_expires_entries():
    store = AudioStore(ttl_seconds=60, max_items=2)
    key = store.put(b"wav")
    assert store.get(key) == b"wav"
    store._items[key] = SimpleNamespace(content=b"wav", expires_at=0)
    assert store.get(key) is None


def test_tts_rejects_speed_outside_documented_range():
    client = GnaniSpeechClient(api_key="test-key")
    with patch.dict("os.environ", {"GNANI_TTS_SPEED": "1.5"}):
        try:
            client.synthesize_kannada("ನಮಸ್ಕಾರ")
        except GnaniConfigurationError as exc:
            assert "between 0.85 and 1.15" in str(exc)
        else:
            raise AssertionError("Out-of-range TTS speed should be rejected before the API call")


def test_official_pfz_uses_latest_advisory_for_location_and_closest_match():
    from datetime import date

    rows = [
        SimpleNamespace(
            nearest_sampling_location_id=18,
            advisory_date=date(2026, 11, 10),
            distance_to_nearest_km=18.0,
            landing_center="Far landing",
            bearing_degrees=110.0,
            distance_km=12.0,
            depth_m=35.0,
            latitude=13.3,
            longitude=74.7,
            raw_text="official bulletin row",
        ),
        SimpleNamespace(
            nearest_sampling_location_id=18,
            advisory_date=date(2026, 11, 10),
            distance_to_nearest_km=2.0,
            landing_center="Near landing",
            bearing_degrees=90.0,
            distance_km=8.0,
            depth_m=28.0,
            latitude=13.35,
            longitude=74.73,
            raw_text="closest official bulletin row",
        ),
        SimpleNamespace(
            nearest_sampling_location_id=1,
            advisory_date=date(2026, 11, 11),
            distance_to_nearest_km=0.0,
            landing_center="Other coast",
            bearing_degrees=0.0,
            distance_km=1.0,
            depth_m=10.0,
            latitude=14.0,
            longitude=74.0,
            raw_text="newer bulletin for another location",
        ),
    ]
    repository = SimpleNamespace(get_latest_advisory_per_location=lambda: rows)
    with patch("analytics.voice.service.get_current_environmental_state_for_location", return_value=fake_state()), \
         patch("analytics.voice.service.IncoisAdvisoryRepository", return_value=repository):
        result = build_answer(None, "KARN_018", "official INCOIS PFZ", "en-IN")
    assert result["source"] == "INCOIS"
    assert result["data"]["landing_center"] == "Near landing"
    assert result["observed_at"] == "2026-11-10"


def test_streamed_wav_header_is_finalized_for_android_playback():
    """Timbre streams WAV with 0xFFFFFFFF sizes; Android needs the real sizes."""
    import io
    import struct
    import wave

    from analytics.voice.gnani_client import _finalize_wav_header

    pcm = b"\x01\x02" * 2400  # 0.1 s of 24 kHz mono 16-bit audio
    header = (
        b"RIFF" + struct.pack("<I", 0xFFFFFFFF) + b"WAVE"
        + b"fmt " + struct.pack("<IHHIIHH", 16, 1, 1, 24000, 48000, 2, 16)
        + b"data" + struct.pack("<I", 0xFFFFFFFF)
    )
    fixed = _finalize_wav_header(header + pcm)

    assert len(fixed) == len(header) + len(pcm)
    assert struct.unpack_from("<I", fixed, 4)[0] == len(fixed) - 8
    assert struct.unpack_from("<I", fixed, 40)[0] == len(pcm)
    with wave.open(io.BytesIO(fixed)) as reader:
        assert reader.getnframes() == 2400
    # Anything that is not a WAV is passed through untouched.
    assert _finalize_wav_header(b"not audio") == b"not audio"
