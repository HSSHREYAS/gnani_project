# 🐟 MatsyaMitra — AI Marine Assistant for Coastal Fishermen

> *"ಮತ್ಸ್ಯಮಿತ್ರ" — Friend of the Fish, Guardian of the Fisherman*

![License](https://img.shields.io/badge/license-Proprietary%20%C2%A9%20H%20S%20Shreyas-red)
![Platform](https://img.shields.io/badge/platform-Android-green)
![Language](https://img.shields.io/badge/language-Kannada%20first-orange)

---

## The Problem

Over **4 million coastal fishermen** in Karnataka  go to sea daily with little reliable, real-time information about sea conditions, weather hazards, or optimal fishing grounds. Language barriers, low literacy, and no internet-first tools leave them dependent on word-of-mouth — costing lives and livelihoods.

---

## Our Solution

**MatsyaMitra** is a Kannada-first AI voice assistant and marine chartplotter built for fishermen — not for tech users.

| Capability | How it works |
|---|---|
| 🎙️ **Kannada Voice Q&A** | Fishermen speak or type a question in Kannada or English. Gnani STT transcribes it; a grounded intent engine answers from live marine data — no hallucination. |
| 🗣️ **Spoken Kannada Answers** | Gnani TTS (Timbre v2.5, Kavin voice) reads the answer aloud so even non-literate users get the information. |
| 🗺️ **Marine Chartplotter** | ECDIS-style map shows real-time Potential Fishing Zones (PFZs) from INCOIS + Open-Meteo, with Top-3 AI-ranked fishing grounds, sea-route planning, diesel estimates, and risk overlays. |
| ⚠️ **Safety Alerts** | Wind speed, wave height, and risk scores pulled from 25 canonical Karnataka coastal stations every refresh cycle. |
| 🌐 **Works Offline-First** | Cached state data and local intent routing keep the app useful even with poor connectivity at sea. |

---

## Technology Stack

- **Frontend:** React Native 0.84 (Android-first) · react-native-maps (Google Maps ECDIS style)
- **Voice:** Gnani.ai STT (Prisma v3.0, kn-IN/en-IN codemix) + TTS (Timbre v2.5)
- **Backend:** FastAPI (Python) · PostgreSQL · Open-Meteo marine API · INCOIS PFZ bulletins
- **AI/ML:** Deterministic intent routing (no LLM hallucination risk) · Scoring engine for PFZ ranking · Google Earth Engine (GEE) satellite SST & chlorophyll pipeline

---

## Impact

- Answers marine safety questions **in Kannada by voice** — first tool of its kind for Karnataka fishermen
- Reduces dangerous sea trips by surfacing INCOIS official advisories in plain Kannada
- PFZ recommendation engine reduces diesel waste by guiding boats to high-probability fishing grounds
- Built with and for the **fishing community** — Kannada UI, local coastal place names, offline-resilient

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Add your keys to android/local.properties
#    GOOGLE_MAPS_API_KEY=<your-key>

# 3. Add backend secrets to .env (see .env.example)

# 4. Start the backend
python run_api.py

# 5. Run on Android (with emulator or USB device online)
npm run android
```

---

*Built for the Gnani.ai Hackathon 2026 · Team MatsyaMitra*

**Team:** H S Shreyas · Chaithanya Nayaka T . Anirudh Vishnu . Adithya S</Replacement>
</invoke>
