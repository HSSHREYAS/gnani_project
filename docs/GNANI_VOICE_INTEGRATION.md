# MatsyaMitra Kannada Voice Assistant (Gnani)

## Architecture

`React Native microphone → FastAPI /api/v1/voice/query → Gnani Prisma v3 STT → deterministic intent router → existing MatsyaMitra PostgreSQL/current-state + INCOIS repository → grounded Kannada response → Gnani Timbre v2.5 → short-lived WAV endpoint → React Native playback`.

The voice feature is an interface over existing data. It does not duplicate PFZ/risk scoring or ask an LLM to invent marine measurements.

## Gnani configuration

1. Copy `.env.example` to `.env` and preserve the database connection already used by this project.
2. Put your Gnani key in `GNANI_API_KEY`. Keep it on the backend only. Never add it to React Native, `src/`, or a public repository.
3. Default STT configuration is Prisma v3.0, `language_code=kn-IN,en-IN`, and `format=codemix`. The topic/keyterms provide coastal place-name context; they are hints, not location authorization.
4. Kannada speech synthesis uses Timbre v2.5 voice `Kavin` (the official v2.5 catalog also lists `Saanvi` for Kannada). Change `GNANI_TTS_VOICE_KN` only to a voice confirmed in that model's catalog. English TTS is intentionally not enabled until an English voice is selected from the official catalog.
5. TTS speed is validated against the documented numeric range `0.85`–`1.15`. The audio configuration requests mono 24 kHz WAV, which is one of Gnani's supported sample rates.

## Endpoints

- `GET /api/v1/voice/health` — configuration status; does not make an external Gnani request.
- `POST /api/v1/voice/query` — multipart fields: `audio_file`, `location_id`, optional `include_audio=true`.
- `POST /api/v1/voice/text-query` — JSON fields: `text`, `location_id`, optional `include_audio`.
- `GET /api/v1/voice/audio/{audio_id}` — short-lived WAV response (10-minute TTL, in-process memory cache).

Audio clips are capped at 15 MB by the app backend and the mobile UI stops recording at 25 seconds (Gnani STT REST accepts short clips up to 30 seconds). Uploaded input audio is not written to a project folder. Synthesized WAV responses live in a bounded in-memory cache and expire after ten minutes. Run one API worker for this in-memory design; use shared object storage/Redis if deploying multiple workers.

## Start the backend

```bash
python -m venv .venv
# Windows PowerShell: .venv\\Scripts\\Activate.ps1
# macOS/Linux: source .venv/bin/activate
pip install -r analytics/requirements.txt
uvicorn analytics.api.main:app --host 0.0.0.0 --port 8000
```

The repository's `analytics.config` loads the root `.env`; the database variable is `MATSYAMITRA_DATABASE_URL`. Make sure PostgreSQL is running, migrations are applied, and the existing marine ingestion pipeline has populated the required current-state tables. The voice route reads through the existing `get_current_environmental_state_for_location` function and `IncoisAdvisoryRepository`.

## Mobile install

```bash
npm install
npx pod-install # macOS / iOS only
npm run android # or npm run ios
```

Audio capture uses `react-native-nitro-sound` and `react-native-nitro-modules`. Because the build container could not reach the npm registry, the checked-in `package-lock.json` could not be regenerated after adding these two dependencies. Run `npm install` (not `npm ci` on the untouched archive) once on a machine with registry access; it will resolve the new native packages and update the lockfile. Android requires runtime microphone permission (`RECORD_AUDIO`); iOS requires `NSMicrophoneUsageDescription` and deployment target 15.1+. Nitro Sound currently documents Xcode 26+ for reliable Swift 6 builds. The project minimum Android SDK is already 24. The mobile app sends audio to the configured API base URL; Android emulator defaults to `10.0.2.2:8000`. For a physical phone, set the API host to your computer's LAN IP and allow the port on the development network. For release builds, use HTTPS.

## Answer grounding and safety

- Weather/risk answers read the selected location's current-state view. Wind/wave values, score, source, timestamp and `CURRENT`/`STALE` status remain separate fields.
- Risk weights come from the existing configuration: wave 60%, wind 40%. The engine normalizes each input and redistributes weights if a measurement is missing; do not compute a raw linear formula from wind speed and wave height in the UI.
- Official PFZ questions use the repository's latest stored advisory per sampling location; when multiple same-day entries map to one location, the nearest matched record is selected. Satellite-derived GEE PFZ is a separate `model_pfz` intent and is labelled as an application estimate, not an official INCOIS recommendation.
- Missing observations are reported as unavailable. Stale values are labelled stale. Risk output is decision support only and must never be presented as proof that a vessel can safely sail.

## Smoke test

1. Start PostgreSQL and the FastAPI app.
2. Open `http://127.0.0.1:8000/api/v1/voice/health` and check `gnani_configured=true`.
3. Open `http://127.0.0.1:8000/docs` and try `POST /api/v1/voice/text-query` with a known `location_id` and a simple question such as `ಸಮುದ್ರದ ಅಪಾಯ ಎಷ್ಟು?`.
4. Install and open the mobile app, select a coastal location, and ask a short question in Kannada.
5. Verify the transcript, answer, source, observation time, freshness and spoken answer. Then test an old/missing-data case and an official-INCOIS request.

## Evaluation plan for the demonstration

Build a recorded set of 50–100 natural Kannada and code-mixed questions from speakers familiar with coastal terminology. Track intent accuracy, STT word error rate where reference transcripts exist, grounded-answer/source attribution, stale-data behaviour, median/p95 latency, and complete demo success rate. Do not claim these metrics until you run and record the evaluation. Test confusing location names and ambiguous PFZ questions, and make the UI's selected location visible in the recording.

## Official references checked

- [Gnani documentation index](https://docs.gnani.ai/llms.txt) — complete API and integration page index.
- [Prisma REST transcription](https://docs.gnani.ai/api/STT/speech-to-text) — `/stt/v3`, multipart `audio_file`, 30-second REST limit, `prisma-v3.0`, comma-separated language hints (1–4), `codemix`, `topic`, and `keyterms`.
- [Prisma v3.0 model guide](https://docs.gnani.ai/api/STT/models/prisma-v3) — multilingual/code-mixed recognition and contextual hints.
- [Timbre REST inference](https://docs.gnani.ai/api/TTS/tts-inference) — `/api/v1/tts/inference`, `X-API-Key-ID`, JSON request, supported WAV/audio parameters, speed range, and binary audio response.
- [Timbre voice catalog](https://docs.gnani.ai/api/TTS/available-voices) — Kannada v2.5 voices `Kavin` and `Saanvi`; model-specific voice validation.
- [Gnani error reference](https://docs.gnani.ai/api/introduction/errors) — authentication, request validation, service and rate-limit errors.
- [React Native Nitro Sound](https://github.com/hyochan/react-native-nitro-sound) — native recorder/player APIs, microphone permissions, platform requirements, and supported audio paths.

The backend currently follows the authentication model of the existing MatsyaMitra API; this feature does not introduce user authentication or per-user throttling. Before exposing the service on the public internet, put the API behind authenticated access, HTTPS, request-rate limits, and operational monitoring.
