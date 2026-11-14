"""Voice endpoints: Gnani STT/TTS + existing MatsyaMitra read models."""

from __future__ import annotations

import logging
import os
import time
import uuid
from typing import Any

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from starlette.responses import Response

from analytics.api.routes import get_db_session
from analytics.voice.audio_store import AUDIO_STORE
from analytics.voice.gnani_client import (
    GnaniAPIError,
    GnaniConfigurationError,
    GnaniSpeechClient,
)
from analytics.voice.intent import is_kannada_text
from analytics.voice.service import build_answer

logger = logging.getLogger("matsyamitra_voice")
router = APIRouter(prefix="/api/v1/voice", tags=["voice-assistant"])
MAX_AUDIO_BYTES = int(os.getenv("GNANI_MAX_AUDIO_BYTES", str(15 * 1024 * 1024)))
ALLOWED_AUDIO_TYPES = {
    "audio/wav", "audio/x-wav", "audio/mpeg", "audio/mp3", "audio/ogg",
    "audio/flac", "audio/aac", "audio/mp4", "audio/m4a", "audio/x-m4a",
    "application/octet-stream",
}


class TextQueryIn(BaseModel):
    text: str = Field(min_length=1, max_length=1200)
    location_id: str = Field(min_length=1, max_length=40)
    include_audio: bool = True
    # Optional UI language hint: "kn-IN" forces Kannada answers even when the
    # typed question is in English (e.g., Kannada fisherman using transliteration).
    language_hint: str | None = None


def _maybe_synthesize(answer: dict[str, Any], include_audio: bool) -> tuple[str | None, str | None]:
    if not include_audio:
        return None, None
    # The default voice configured below is a Kannada voice. Do not synthesize
    # English text with a Kannada voice. An English voice can be configured later
    # when one is selected from the official catalog.
    if answer.get("language") != "kn-IN":
        return None, "Kannada TTS is enabled; English voice is not configured."
    try:
        audio = GnaniSpeechClient().synthesize_kannada(str(answer["answer"]))
        audio_id = AUDIO_STORE.put(audio)
        return f"/api/v1/voice/audio/{audio_id}", None
    except GnaniConfigurationError as exc:
        return None, str(exc)
    except GnaniAPIError as exc:
        logger.warning("Gnani TTS failed: %s", exc)
        return None, str(exc)


def _check_file(upload: UploadFile) -> bytes:
    content_type = (upload.content_type or "application/octet-stream").lower()
    if content_type not in ALLOWED_AUDIO_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported audio content type: {content_type}",
        )
    payload = upload.file.read(MAX_AUDIO_BYTES + 1)
    if not payload:
        raise HTTPException(status_code=400, detail="Audio recording is empty.")
    if len(payload) > MAX_AUDIO_BYTES:
        raise HTTPException(status_code=413, detail=f"Audio exceeds the {MAX_AUDIO_BYTES // (1024 * 1024)} MB upload limit.")
    return payload


def _run_text_query(session: Session, text: str, location_id: str, include_audio: bool, language_hint: str | None = None) -> dict[str, Any]:
    result = build_answer(session, location_id, text, language_hint=language_hint)
    audio_url, audio_error = _maybe_synthesize(result, include_audio)
    result.update({
        "transcript": text.strip(),
        "detected_language_code": result.get("language"),
        "audio_url": audio_url,
        "audio_error": audio_error,
        "request_id": uuid.uuid4().hex,
    })
    return result


@router.get("/health")
def voice_health() -> dict[str, Any]:
    return {
        "status": "ok",
        "stt_model": os.getenv("GNANI_STT_MODEL", "prisma-v3.0"),
        "tts_model": os.getenv("GNANI_TTS_MODEL", "timbre-v2.5"),
        "gnani_configured": bool(os.getenv("GNANI_API_KEY", "").strip()),
        "note": "Health does not make an external Gnani API request.",
    }


class SpeakIn(BaseModel):
    # Short Kannada text to read aloud (e.g. an alert shown in the app).
    text: str = Field(min_length=1, max_length=600)


@router.post("/speak")
def speak_kannada(payload: SpeakIn) -> dict[str, Any]:
    """Synthesize the given Kannada text with Gnani Timbre and return a short-lived audio URL."""
    audio_url, audio_error = _maybe_synthesize({"language": "kn-IN", "answer": payload.text.strip()}, True)
    return {"audio_url": audio_url, "audio_error": audio_error}


@router.post("/text-query")
def text_query(payload: TextQueryIn, session: Session = Depends(get_db_session)) -> dict[str, Any]:
    """Text-only endpoint for testing intent routing and grounded data answers."""
    return _run_text_query(session, payload.text, payload.location_id, payload.include_audio, payload.language_hint)


@router.post("/query")
def voice_query(
    audio_file: UploadFile = File(...),
    location_id: str = Form(...),
    include_audio: bool = Form(True),
    language_hint: str | None = Form(None),
    session: Session = Depends(get_db_session),
) -> dict[str, Any]:
    """Transcribe one short recording, query existing marine data and optionally speak back."""
    started = time.perf_counter()
    audio = _check_file(audio_file)
    client = GnaniSpeechClient()
    try:
        transcription = client.transcribe(
            audio=audio,
            filename=audio_file.filename or "matsyamitra-query.m4a",
            content_type=audio_file.content_type or "application/octet-stream",
        )
    except GnaniConfigurationError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except GnaniAPIError as exc:
        code = exc.status_code if exc.status_code and 400 <= exc.status_code < 500 else 502
        raise HTTPException(status_code=code, detail=str(exc)) from exc

    # Provider's language detection takes precedence when available; language_hint
    # from the app UI is used when STT returns no language tag.
    detected = transcription.detected_language_code or (
        "kn-IN" if is_kannada_text(transcription.transcript) else (language_hint or "en-IN")
    )
    result = build_answer(
        session,
        location_id,
        transcription.transcript,
        detected_language_code=detected,
        language_hint=language_hint,
    )
    # Promote to Kannada when STT signals Kannada but script detection missed it.
    if detected.startswith("kn") and result.get("language") != "kn-IN":
        result["language"] = "kn-IN"

    audio_url, audio_error = _maybe_synthesize(result, include_audio)
    elapsed_ms = round((time.perf_counter() - started) * 1000, 1)
    result.update({
        "transcript": transcription.transcript,
        "detected_language_code": detected,
        "stt_model": transcription.model,
        "audio_url": audio_url,
        "audio_error": audio_error,
        "processing_ms": elapsed_ms,
        "request_id": uuid.uuid4().hex,
    })
    return result


@router.get("/audio/{audio_id}")
def get_generated_audio(audio_id: str) -> Response:
    """Fetch an ephemeral WAV response generated by Timbre (10-minute TTL)."""
    audio = AUDIO_STORE.get(audio_id)
    if audio is None:
        raise HTTPException(status_code=404, detail="Audio expired or not found. Please ask again.")
    return Response(
        content=audio,
        media_type="audio/wav",
        headers={"Cache-Control": "no-store", "X-Content-Type-Options": "nosniff"},
    )
