"""Small synchronous client for the documented Gnani Speech REST APIs."""

from __future__ import annotations

import json
import os
import struct
from dataclasses import dataclass
from typing import Any

import requests

STT_URL = "https://api.vachana.ai/stt/v3"
TTS_URL = "https://api.vachana.ai/api/v1/tts/inference"


def _finalize_wav_header(audio: bytes) -> bytes:
    """Write real chunk sizes into a streamed WAV.

    Timbre streams its WAV, so the RIFF and ``data`` chunk sizes arrive as the
    "unknown length" marker 0xFFFFFFFF. Desktop players tolerate that, but Android's
    MediaPlayer refuses to play such a file. The audio bytes are untouched; only the
    two size fields are corrected.
    """
    if len(audio) < 44 or audio[:4] != b"RIFF" or audio[8:12] != b"WAVE":
        return audio
    fixed = bytearray(audio)
    struct.pack_into("<I", fixed, 4, len(fixed) - 8)
    offset = 12
    while offset + 8 <= len(fixed):
        chunk_id = bytes(fixed[offset:offset + 4])
        (chunk_size,) = struct.unpack_from("<I", fixed, offset + 4)
        if chunk_id == b"data":
            struct.pack_into("<I", fixed, offset + 4, len(fixed) - (offset + 8))
            break
        if chunk_size == 0xFFFFFFFF:
            break
        offset += 8 + chunk_size + (chunk_size & 1)
    return bytes(fixed)


class GnaniConfigurationError(RuntimeError):
    pass


class GnaniAPIError(RuntimeError):
    def __init__(self, message: str, status_code: int | None = None) -> None:
        super().__init__(message)
        self.status_code = status_code


@dataclass(frozen=True)
class Transcription:
    transcript: str
    detected_language_code: str | None
    model: str | None
    raw: dict[str, Any]


class GnaniSpeechClient:
    """Gnani Prisma v3 STT and Timbre v2.5 TTS.

    The API key is read at call time and never returned to the mobile client.
    """

    def __init__(self, api_key: str | None = None, timeout: tuple[float, float] = (8, 45)) -> None:
        self.api_key = api_key or os.getenv("GNANI_API_KEY", "").strip()
        self.timeout = timeout

    def _headers(self) -> dict[str, str]:
        if not self.api_key:
            raise GnaniConfigurationError("GNANI_API_KEY is not configured on the backend.")
        return {"X-API-Key-ID": self.api_key}

    def transcribe(self, audio: bytes, filename: str, content_type: str) -> Transcription:
        if not audio:
            raise GnaniAPIError("Audio file is empty.")

        # Keyterms are context hints, not facts or a replacement for location selection.
        keyterms = [
            "Karwar", "Kundapura", "Kumta", "Ankola", "Someshwara", "Bhatkal",
            "Malpe", "Maravanthe", "Baindur", "Gangolli", "Shiroor", "Gokarna",
            "Mangalore", "Surathkal", "Honnavar", "Belekeri", "Murudeshwar",
            "Netrani", "Kaup", "Ullal", "Manki", "ಮಲ್ಪೆ", "ಕಾರವಾರ", "ಕುಂದಾಪುರ",
            "ಮಂಗಳೂರು", "ಗಾಳಿ", "ಅಲೆ", "ಮೀನುಗಾರಿಕೆ", "INCOIS", "PFZ",
        ]
        data = {
            "model": os.getenv("GNANI_STT_MODEL", "prisma-v3.0"),
            "language_code": os.getenv("GNANI_STT_LANGUAGES", "kn-IN,en-IN"),
            "format": os.getenv("GNANI_STT_FORMAT", "codemix"),
            "topic": (
                "Karnataka coastal fishing and marine conditions. Place names include "
                "Karwar, Honnavar, Bhatkal, Malpe, Kundapura and Mangalore. "
                "Terms include wind, wave height, marine risk, fishing advisory and PFZ."
            ),
            "keyterms": json.dumps(keyterms, ensure_ascii=False),
        }
        try:
            response = requests.post(
                STT_URL,
                headers=self._headers(),
                data=data,
                files={"audio_file": (filename, audio, content_type or "application/octet-stream")},
                timeout=self.timeout,
            )
        except requests.RequestException as exc:
            raise GnaniAPIError(f"Gnani speech recognition request failed: {exc}") from exc

        payload = self._parse_response(response)
        transcript = payload.get("transcript") or payload.get("text")
        if not isinstance(transcript, str) or not transcript.strip():
            raise GnaniAPIError("Gnani returned an empty transcript.", response.status_code)
        return Transcription(
            transcript=transcript.strip(),
            detected_language_code=payload.get("detected_language_code"),
            model=payload.get("model"),
            raw=payload,
        )

    def synthesize_kannada(self, text: str) -> bytes:
        if not text.strip():
            raise GnaniAPIError("TTS text cannot be empty.")
        voice = os.getenv("GNANI_TTS_VOICE_KN", "Kavin").strip()
        try:
            speed = float(os.getenv("GNANI_TTS_SPEED", "1.0"))
        except ValueError as exc:
            raise GnaniConfigurationError("GNANI_TTS_SPEED must be a number between 0.85 and 1.15.") from exc
        if not 0.85 <= speed <= 1.15:
            raise GnaniConfigurationError("GNANI_TTS_SPEED must be between 0.85 and 1.15.")
        payload = {
            "model": os.getenv("GNANI_TTS_MODEL", "timbre-v2.5"),
            "text": text,
            "voice": voice,
            "language": "kn-IN",
            "speed": speed,
            "audio_config": {
                "encoding": "linear_pcm",
                "container": "wav",
                "num_channels": 1,
                "sample_rate": 24000,
                "sample_width": 2,
            },
        }
        try:
            response = requests.post(
                TTS_URL,
                headers={**self._headers(), "Content-Type": "application/json", "Accept": "audio/wav"},
                json=payload,
                timeout=self.timeout,
            )
        except requests.RequestException as exc:
            raise GnaniAPIError(f"Gnani speech synthesis request failed: {exc}") from exc

        if not response.ok:
            message = self._error_message(response)
            raise GnaniAPIError(message, response.status_code)
        if not response.content:
            raise GnaniAPIError("Gnani TTS returned an empty audio response.", response.status_code)
        return _finalize_wav_header(response.content)

    @staticmethod
    def _parse_response(response: requests.Response) -> dict[str, Any]:
        if not response.ok:
            raise GnaniAPIError(GnaniSpeechClient._error_message(response), response.status_code)
        try:
            payload = response.json()
        except ValueError as exc:
            raise GnaniAPIError("Gnani STT returned an unexpected non-JSON response.", response.status_code) from exc
        if isinstance(payload, dict) and payload.get("success") is False:
            error = payload.get("error") or {}
            raise GnaniAPIError(str(error.get("message") or "Gnani STT request failed."), response.status_code)
        if not isinstance(payload, dict):
            raise GnaniAPIError("Gnani STT returned an unexpected response structure.", response.status_code)
        return payload

    @staticmethod
    def _error_message(response: requests.Response) -> str:
        try:
            payload = response.json()
            error = payload.get("error", payload) if isinstance(payload, dict) else {}
            if isinstance(error, dict):
                detail = error.get("detail")
                if isinstance(detail, dict) and detail.get("message"):
                    return str(detail["message"])
                return str(error.get("message") or error.get("detail") or f"Gnani API returned HTTP {response.status_code}.")
        except ValueError:
            pass
        return f"Gnani API returned HTTP {response.status_code}."
