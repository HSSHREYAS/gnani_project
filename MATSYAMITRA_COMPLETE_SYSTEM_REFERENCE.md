# 🐟 MatsyaMitra (ಮತ್ಸ್ಯಮಿತ್ರ): Complete Technical Master Reference & Research Dossier

> **Document Type:** Comprehensive Technical Architecture, Decision History & Scientific Reference  
> **Target Audience:** Major Project Final Report Reviewers, International Conference Referees (IEEE/ACM), Systems Engineers  
> **Intellectual Property:** Proprietary © 2026 H S Shreyas. All Rights Reserved.  
> **Authors:** H S Shreyas , Chaithanya Nayaka T , Anirudh Vishnu . Adithya S
> **Location:** Coastal Karnataka littoral sector (Karwar to Mangalore), India

---

## 📑 Complete Table of Contents

1. [Executive Overview & Scientific Motivation](#1-executive-overview--scientific-motivation)
2. [Chronological Project Journey & Decision History](#2-chronological-project-journey--decision-history)
   - 2.1 [Idea Selection & Problem Conception](#21-idea-selection--problem-conception)
   - 2.2 [Architectural Decoupling: Separation of PFZ and Risk Engines](#22-architectural-decoupling-separation-of-pfz-and-risk-engines)
   - 2.3 [The "No-Fabrication" Audit of November 2026](#23-the-no-fabrication-audit-of-november-2026)
   - 2.4 [Cartographic Evolution: Transitioning from Google Maps to Leaflet/Esri](#24-cartographic-evolution-transitioning-from-google-maps-to-leafletesri)
   - 2.5 [The Binary Audio Repair Discovery (Android Stagefright RIFF Fix)](#25-the-binary-audio-repair-discovery-android-stagefright-riff-fix)
3. [Final System Architecture & Distributed Topography](#3-final-system-architecture--distributed-topography)
4. [Complete Technology Stack](#4-complete-technology-stack)
5. [Data Ingestion Pipelines & Engineering](#5-data-ingestion-pipelines--engineering)
   - 5.1 [Satellite Remote Sensing (Google Earth Engine)](#51-satellite-remote-sensing-google-earth-engine)
   - 5.2 [Hydrodynamic & Atmospheric Forecasting (Open-Meteo)](#52-hydrodynamic--atmospheric-forecasting-open-meteo)
   - 5.3 [Government Bulletin Ingestion (INCOIS Scraping & Geocoding)](#53-government-bulletin-ingestion-incois-scraping--geocoding)
   - 5.4 [The 25 Canonical Coastal Reference Stations](#54-the-25-canonical-coastal-reference-stations)
6. [Mathematical Formulations & Scoring Models](#6-mathematical-formulations--scoring-models)
   - 6.1 [PFZ Bio-Optical Suitability Engine](#61-pfz-bio-optical-suitability-engine)
   - 6.2 [Marine Risk & Sea-State Hazard Index](#62-marine-risk--sea-state-hazard-index)
   - 6.3 [Temporal Confidence Decay Function](#63-temporal-confidence-decay-function)
   - 6.4 [Multi-Criteria Per-Port Recommendation Algorithm](#64-multi-criteria-per-port-recommendation-algorithm)
   - 6.5 [Nautical Waypoint Navigation & Fuel Consumption Model](#65-nautical-waypoint-navigation--fuel-consumption-model)
7. [Grounded Voice Assistant (Gnani.ai Neural Integration)](#7-grounded-voice-assistant-gnanai-neural-integration)
   - 7.1 [Acoustic Processing & Prisma v3.0 STT](#71-acoustic-processing--prisma-v30-stt)
   - 7.2 [Deterministic Spatial-Intent Parser (Zero-LLM Safety)](#72-deterministic-spatial-intent-parser-zero-llm-safety)
   - 7.3 [Grounded Response Compilation](#73-grounded-response-compilation)
   - 7.4 [Neural Synthesis (Timbre v2.5) & WAV Reassembly](#74-neural-synthesis-timbre-v25--wav-reassembly)
8. [Mobile Client & Human-Computer Interaction (React Native)](#8-mobile-client--human-computer-interaction-react-native)
   - 8.1 [Linguistic Accessibility & Vernacular Kannada Localization](#81-linguistic-accessibility--vernacular-kannada-localization)
   - 8.2 [Living Environmental Canvas (Sky & Dynamic Waves)](#82-living-environmental-canvas-sky--dynamic-waves)
   - 8.3 [Emergency Distress Protocol (SOS Dispatch)](#83-emergency-distress-protocol-sos-dispatch)
9. [Complete Database Schema (PostgreSQL)](#9-complete-database-schema-postgresql)
10. [RESTful API Endpoint Contract](#10-restful-api-endpoint-contract)
11. [Academic Research Framework (IEEE / ACM Guidance)](#11-academic-research-framework-ieee--acm-guidance)
    - 11.1 [Formal Research Questions](#111-formal-research-questions)
    - 11.2 [Comparative Benchmark with State-of-the-Art](#112-comparative-benchmark-with-state-of-the-art)
    - 11.3 [Systemic Limitations & Scientific Boundaries](#113-systemic-limitations--scientific-boundaries)
12. [Deployment, Environment Setup & Operational Run Guide](#12-deployment-environment-setup--operational-run-guide)

---

## 1. Executive Overview & Scientific Motivation

Artisanal and small-scale fishers along the 320 km coastline of Karnataka, India (Sector SEC004) face extreme operational hazards:
1. **Blind Searching & Fuel Depletion:** Locating pelagic shoals (*Rastrelliger kanagurta*—Indian mackerel; *Sardinella longiceps*—oil sardine) requires visual searching, consuming up to 60–70% of voyage expenditure in diesel.
2. **Marine Safety Hazards:** Sudden monsoonal squalls and wave chop ($H_s > 2.0\,\text{m}$) cause frequent capsizing of motorized canoes and non-mechanized crafts.
3. **Information Disconnect:** Official Potential Fishing Zone (PFZ) advisories and oceanographic data provided by the Indian National Centre for Ocean Information Services (INCOIS) exist primarily as desktop Web-GIS portals, English PDF bulletins, or aggregated statewide SMS alerts that lack local coastal context and are inaccessible to fishers with limited literacy.

**MatsyaMitra** solves this by providing a localized, Kannada-first mobile decision-support system that fuses satellite remote sensing, high-resolution hydrodynamic modeling, and official bulletins into an intuitive mobile interface and grounded voice assistant.

---

## 2. Chronological Project Journey & Decision History

### 2.1 Idea Selection & Problem Conception
* **Initial Concept:** Early project iterations evaluated general marine weather portals. However, weather alone does not help fishermen locate productive fish stocks. Conversely, raw satellite chlorophyll maps are too complex for non-specialists.
* **Refined Focus:** The project converged on combining **habitat suitability** (SST + Chlorophyll-a) with **maritime safety** (Wind + Wave height) anchored to fixed Karnataka landing centres.
* **Platform Selection:** Android was chosen due to near-universal penetration among coastal communities in India. React Native was selected for cross-platform efficiency and fast native UI execution.

---

### 2.2 Architectural Decoupling: Separation of PFZ and Risk Engines
In the legacy prototype (Phase 1), a unified scoring model attempted to process SST, Chlorophyll, Wind Speed, and Wave Height simultaneously into a single composite score stored in `analytics_results`.

**Critical Flaw Discovered:**
* Satellite data (Google Earth Engine) updates on a **daily to weekly** timescale (NOAA OISST daily; Copernicus CHL-a subject to satellite revisit and cloud cover).
* Marine weather (Open-Meteo) changes on an **hourly** timescale.
* Coupling them meant hourly weather updates were blocked if satellite passes were delayed, or satellite timestamps corrupted the temporal validity of live wave forecasts.

**Architectural Decision (Module 1–6 Refactor):**
1. **PFZ Engine (`analytics/scoring/pfz_engine.py`):** Strictly computes biological suitability using **SST and Chlorophyll-a ONLY**. Wind was purged from the fish habitat model.
2. **Marine Risk Engine (`analytics/scoring/risk_engine.py`):** Strictly computes physical navigational risk using **Wave Height and Wind Speed ONLY**. SST and Chlorophyll were purged from the safety model.
3. **Current-State Aggregation Read Model (`analytics/current_state.py`):** Operates as an asynchronous read-only view that joins the latest valid PFZ and Risk results per station, maintaining independent timestamps and explicit status flags (`CURRENT`, `STALE`, `MISSING`).

---

### 2.3 The "No-Fabrication" Audit of November 2026
During early development, standard hackathon shortcuts had introduced synthetic mock data. In November 2026, an exhaustive system audit eliminated all fabricated telemetry:

| Module / Screen | Fabricated Legacy Implementation | Verified Grounded Production Implementation |
|---|---|---|
| **Weather Telemetry** | Fixed relative humidity (78%), synthetic air temperature. | Live Open-Meteo API hourly wind speed (m/s) and wave height (m); returns null (`—`) on failure. |
| **Data Freshness** | All values implicitly assumed live. | Explicit `CURRENT` (<2h for weather, <96h for satellite), `STALE`, or `MISSING` state tracking with hour-stamps. |
| **INCOIS Advisories** | Hardcoded mock advisory ("near Honnavar, 79.5 km"). | Dynamic web scraper of INCOIS Sector SEC004 daily bulletin tables with nearest-station spatial joins. |
| **PFZ Suitability** | Random "Catch Probability" generated between 75%–98%. | Mathematical trapezoidal suitability score ($0.0 \dots 10.0$) computed over satellite SST and Chlorophyll-a. |
| **Fleet Crowding** | Fake vessel counts (e.g., "14 boats") hashed from coordinates. | Entirely removed from active ranking; replaced with transparent spatial distance decay until live AIS/transponder feeds exist. |
| **GPS Guidance** | Hardcoded offshore target coordinate used as user location. | Real hardware-level device GPS fix via `@react-native-community/geolocation` with accuracy bounds. |
| **SOS Emergency** | Static text display without positioning. | Real-time SMS dispatch populating exact GPS coordinates, heading, and direct one-touch dialing to Coast Guard (`1554`). |

---

### 2.4 Cartographic Evolution: Transitioning from Google Maps to Leaflet/Esri
* **Google Maps SDK Obstacle:** Early builds used `react-native-maps` with Google Maps Mobile SDK. In testing, map views frequently failed to render (blank beige screen) due to API key billing restrictions, SHA-1 fingerprint mismatch in debug keystores, and absence of nautical depth soundings.
* **Leaflet & Esri Solution:** The primary chartplotter was transitioned to a native-accelerated WebView running **Leaflet 1.9.4** bundled locally. It streams **Esri World Ocean Basemap** featuring high-definition nautical bathymetric contours (depth in meters) without requiring API keys or billing infrastructure.

---

### 2.5 The Binary Audio Repair Discovery (Android Stagefright RIFF Fix)
During real-device testing on Samsung Galaxy hardware (Android 15), synthesized speech from the backend caused a fatal crash: `MediaPlayer error: what=1, extra=-2147483648` (`MEDIA_ERROR_SYSTEM`).

**Root Cause:** Gnani Timbre TTS streams audio in HTTP chunks, leaving the master `RIFF` chunk length (bytes 4–7) and the `data` subchunk size (bytes 40–43) populated with placeholder values (`0xFFFFFFFF`). While VLC and desktop OS media frameworks tolerate unfinalized lengths, Android's native `Stagefright` framework strictly rejects them as malformed.

**The Fix (`analytics/voice/gnani_client.py`):**
An in-memory binary patch inspects the downloaded byte buffer, calculates true payload size $N$, and reconstructs the standard 44-byte WAV header:
```python
payload_len = len(raw_bytes)
riff_size = payload_len - 8
data_size = payload_len - 44
fixed_bytes = (
    raw_bytes[:4] +
    struct.pack("<I", riff_size) +
    raw_bytes[8:40] +
    struct.pack("<I", data_size) +
    raw_bytes[44:]
)
```

---

## 3. Final System Architecture & Distributed Topography

The system runs across four synchronized tiers:

```
┌────────────────────────────────────────────────────────────────────────┐
│                      1. EXTERNAL INGESTION LAYER                       │
│  [Google Earth Engine]       [Open-Meteo Marine]       [INCOIS Portal] │
│  (NOAA SST, Copernicus CHL)  (10m Wind, Wave Height)   (Sector SEC004) │
└───────────────────┬───────────────────┬───────────────────┬────────────┘
                    │                   │                   │
                    ▼                   ▼                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   2. ASYNCHRONOUS SCHEDULER & ETL                      │
│        analytics/sampler.py | live_open_meteo_pipeline.py | scraper.py │
│        Validation • Quality Flagging • Spatial Matching • Upserts      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      3. DATABASE PERSISTENCE TIER                      │
│                           (PostgreSQL 15+)                             │
│  sampling_locations • environmental_obs • marine_obs • incois_advisories│
│  pfz_results • risk_results • Current-State Aggregation Read Model     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     4. ANALYTICS & VOICE REST API                      │
│                           (FastAPI Microservice)                       │
│  /api/v1/current-state • /api/v1/advisories • /api/v1/voice/query       │
│  Deterministic Intent Parser • Grounded Templates • Audio Cache        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                         HTTP REST / Audio Stream
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   5. MOBILE EDGE CLIENT APPLICATION                    │
│                      (React Native 0.84 Android)                       │
│  Leaflet Bathymetry Chart • Vernacular Kannada Voice • Real-time GPS   │
│  Dynamic Wave Canvas • SOS Telephony (Coast Guard 1554)                │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Complete Technology Stack

| Layer | Component | Version / Specification | Rationale & Purpose |
|---|---|---|---|
| **Mobile Client** | React Native | `0.84.1` (Hermes Engine, New Architecture) | High-performance native Android compilation; smooth 60fps gesture rendering. |
| **Mobile Client** | TypeScript | `^5.0.4` | Strict static type-safety across all network models and nautical navigation math. |
| **Mobile Client** | Leaflet Cartography | `Leaflet 1.9.4` via `react-native-webview` | Key-free nautical chartplotter rendering bathymetric soundings and depth contours. |
| **Mobile Client** | Native Sound | `react-native-nitro-sound` | Ultra-low latency microphone recording (AAC/16kHz) and WAV playback via native TurboModules. |
| **Mobile Client** | Geolocation | `@react-native-community/geolocation` | Direct hardware GPS sensor integration for live vessel positioning and distance-to-go calculations. |
| **Backend Microservice** | FastAPI | `0.110+` (Python 3.11+) | Asynchronous ASGI framework providing sub-millisecond route handling and auto-generated OpenAPI documentation. |
| **Backend Microservice** | Uvicorn | `0.28+` | Lightning-fast ASGI production server worker. |
| **Persistence** | PostgreSQL | `15.0+` | ACID-compliant relational data store with robust spatial indexing and constraints. |
| **Persistence** | SQLAlchemy & Alembic | `2.0+` | Declarative ORM and automated schema migration management. |
| **Scheduler** | APScheduler | `3.10+` | In-process background cron engine managing asynchronous ingestion cadences. |
| **Satellite Platform** | Google Earth Engine API | `earthengine-api` | Cloud geospatial analysis extracting raster values at coastal sampling points. |
| **Weather Engine** | Open-Meteo Python Client | `openmeteo-requests`, `requests-cache` | Fast cached retrieval of numerical marine and atmospheric forecast matrices. |
| **Web Scraper** | BeautifulSoup4 & Requests | `bs4 4.12+` | Parsing official HTML tabular advisories from INCOIS Marine Fisheries portal. |
| **Voice AI (ASR)** | Gnani.ai Prisma | `v3.0` (`kn-IN, en-IN` codemix) | Neural acoustic model tuned for Indian regional dialects and accented maritime terms. |
| **Voice AI (TTS)** | Gnani.ai Timbre | `v2.5` (`Kavin` Kannada neural voice) | Expressive Indic speech synthesis generating 24kHz mono audio. |

---

## 5. Data Ingestion Pipelines & Engineering

### 5.1 Satellite Remote Sensing (Google Earth Engine)
* **Sea Surface Temperature (SST):** Sourced from NOAA CDR OISST V2.1 (`NOAA/CDR/OISST/V2_1`), providing daily 0.25° (~25 km) global gridded optimal-interpolation temperatures.
* **Chlorophyll-a:** Sourced from Copernicus Global Ocean Colour L4 (`COPERNICUS/MARINE/OC_GLO_BGC/PLANKTON_MULTI_4KM`), providing 4 km spatial resolution of plankton biomass in $\text{mg/m}^3$.
* **Execution:** Sampled daily across the 25 canonical stations with validation bounds ($\text{SST} \in [15, 35]^\circ\text{C}$, $\text{CHL} \in [0.01, 20.0]\,\text{mg/m}^3$).

### 5.2 Hydrodynamic & Atmospheric Forecasting (Open-Meteo)
* **Wind Vector:** 10-meter wind speed ($\text{m/s}$) and wind direction ($\text{degrees}$).
* **Sea Surface State:** Significant wave height ($H_s$ in meters) and wave direction.
* **Cadence:** Ingested hourly via asynchronous batch requests.

### 5.3 Government Bulletin Ingestion (INCOIS Scraping & Geocoding)
* Scrapes Sector SEC004 (Karnataka) text bulletins from INCOIS.
* Parses tabular columns: Landing Centre, Bearing Angle, Distance (km), Ocean Depth (m), and Coordinates (DMS).
* Converts DMS strings (e.g., `14 49 58 N, 74 08 24 E`) into decimal degrees.
* Performs Haversine nearest-neighbor mapping to link each advisory to its closest canonical station.

### 5.4 The 25 Canonical Coastal Reference Stations
The littoral boundary of Karnataka is discretized into 25 permanent reference stations:
`KARN_001` (Karwar), `KARN_002` (Majali), `KARN_003` (Kumta), `KARN_004` (Ankola), `KARN_005` (Someshwara), `KARN_006` (Bhatkal), `KARN_007` (Kundapura), `KARN_008` (Maravanthe), `KARN_009` (Byndoor), `KARN_010` (Alvekodi), `KARN_011` (Gangolli), `KARN_012` (Shiroor), `KARN_013` (Gokarna), `KARN_014` (Keni), `KARN_015` (Surathkal), `KARN_016` (Honnavar), `KARN_017` (Belekeri), `KARN_018` (Malpe), `KARN_019` (Padubidri), `KARN_020` (Murdeshwar), `KARN_021` (Netrani Island), `KARN_022` (Kaup), `KARN_023` (Ullal), `KARN_024` (Manki), `KARN_025` (Mangalore).

---

## 6. Mathematical Formulations & Scoring Models

### 6.1 PFZ Bio-Optical Suitability Engine
Evaluates habitat suitability via trapezoidal membership functions:

$$\mu(x; a, b, c, d) = \max\left(0, \min\left(\frac{x - a}{b - a}, 1, \frac{d - x}{d - c}\right)\right)$$

* **SST Function Parameters:** $a = 24.0^\circ\text{C}, b = 26.0^\circ\text{C}, c = 29.0^\circ\text{C}, d = 31.0^\circ\text{C}$
* **Chlorophyll-a Parameters:** $a = 0.10\,\text{mg/m}^3, b = 0.30\,\text{mg/m}^3, c = 2.00\,\text{mg/m}^3, d = 4.00\,\text{mg/m}^3$

$$S_{\text{PFZ}} = 10 \times \left( 0.4706 \cdot \mu_{\text{sst}}(x_{\text{sst}}) + 0.5294 \cdot \mu_{\text{chl}}(x_{\text{chl}}) \right)$$

---

### 6.2 Marine Risk & Sea-State Hazard Index
Evaluates physical hazard index $h(x) \in [0, 1]$:

$$h(x; x_{\text{safe}}, x_{\text{mod}}, x_{\text{ext}}) = \begin{cases} 
0.0 & \text{if } x \le x_{\text{safe}} \\
0.5 \cdot \left(\frac{x - x_{\text{safe}}}{x_{\text{mod}} - x_{\text{safe}}}\right) & \text{if } x_{\text{safe}} < x \le x_{\text{mod}} \\
0.5 + 0.5 \cdot \left(\frac{x - x_{\text{mod}}}{x_{\text{ext}} - x_{\text{mod}}}\right) & \text{if } x_{\text{mod}} < x \le x_{\text{ext}} \\
1.0 & \text{if } x > x_{\text{ext}}
\end{cases}$$

* **Significant Wave Height ($H_s$):** $H_{\text{safe}} = 0.5\,\text{m}, H_{\text{mod}} = 1.5\,\text{m}, H_{\text{ext}} = 2.5\,\text{m}$
* **10m Wind Speed ($V_w$):** $V_{\text{safe}} = 7.0\,\text{m/s}, V_{\text{mod}} = 11.0\,\text{m/s}, V_{\text{ext}} = 17.0\,\text{m/s}$

$$R = 10 \times \left( 0.60 \cdot h(H_s) + 0.40 \cdot h(V_w) \right)$$

---

### 6.3 Temporal Confidence Decay Function
$$C = \left(\frac{N_{\text{present}}}{N_{\text{expected}}}\right) \times \gamma(\Delta t) \times 100, \quad 
\gamma(\Delta t) = \begin{cases}
1.00 & \le 6\text{ h} \\
0.95 & \le 12\text{ h} \\
0.85 & \le 24\text{ h} \\
0.70 & \le 48\text{ h} \\
0.50 & \le 96\text{ h} \\
0.00 & > 96\text{ h (STALE)}
\end{cases}$$

---

### 6.4 Multi-Criteria Per-Port Recommendation Algorithm
Computes custom ranking $\Phi$ per departure harbour:

$$\Phi = 0.55 \cdot D + 0.45 \cdot S + B$$

* **Distance Utility Decay:** $D = \max\left(0, 100 - 100 \cdot \frac{d_{\text{km}}}{150}\right)$
* **Normalized Satellite Score:** $S = S_{\text{PFZ}} \times 10$
* **Official Corroboration Bonus:** $B = 10.0$ if corroborated by INCOIS; $0.0$ otherwise.

---

### 6.5 Nautical Waypoint Navigation & Fuel Consumption Model
* **Nautical Miles:** $\text{Dist}_{\text{NM}} = \frac{d_{\text{km}}}{1.852}$
* **Voyage Duration:** $T_{\text{hours}} = \frac{\text{Dist}_{\text{NM}}}{10.5\,\text{knots}}$
* **Diesel Estimate:** $\text{Diesel}_{\text{liters}} = (\text{Dist}_{\text{NM}} \times 0.72\,\text{L/NM}) + 8.0\,\text{L (Reserve)}$
* **Financial Cost:** $\text{Cost}_{\text{INR}} = \text{Diesel}_{\text{liters}} \times ₹88/\text{L}$

---

## 7. Grounded Voice Assistant (Gnani.ai Neural Integration)

### 7.1 Acoustic Processing & Prisma v3.0 STT
* Captures 16 kHz mono AAC audio via native microphone TurboModules.
* Streams to Gnani.ai Prisma v3.0 REST endpoint (`/stt/v3`) using `format=codemix` and `language_code=kn-IN,en-IN`.
* Domain vocabulary hints injected: Karnataka ports (*Malpe, Karwar, Mangalore*), marine terms (*wind, wave, PFZ, INCOIS*).

### 7.2 Deterministic Spatial-Intent Parser (Zero-LLM Safety)
Transcripts are normalized and matched against an ordered intent tree:
1. `risk_explanation` ("explain risk", "ಅಪಾಯದ ಲೆಕ್ಕ")
2. `model_pfz` ("satellite pfz", "ಉಪಗ್ರಹ")
3. `official_pfz` ("incois", "ಮೀನು ಸಿಗುವ ಜಾಗ")
4. `marine_risk` ("risk", "safe", "ಅಪಾಯ")
5. `marine_conditions` ("weather", "wind", "ಗಾಳಿ", "ಅಲೆ")
6. `summary` ("today", "ಈಗ", "status")

### 7.3 Grounded Response Compilation
Responses are compiled by populating immutable string templates with database values. **No LLM is permitted in the analytical loop**, eliminating hallucinated sea conditions.

### 7.4 Neural Synthesis (Timbre v2.5) & WAV Reassembly
* Kannada responses are synthesized into 24 kHz WAV audio via Gnani Timbre v2.5 using voice `"Kavin"`.
* The in-memory RIFF header patch rewrites bytes 4–7 and 40–43 with exact calculated sizes, ensuring compliance with Android's Stagefright framework.
* Synthesized audio is stored in an in-memory cache with a 10-minute TTL.

---

## 8. Mobile Client & Human-Computer Interaction (React Native)

### 8.1 Linguistic Accessibility & Vernacular Kannada Localization
* Full Kannada localization covering all navigational alerts, risk categories, and ocean metrics.
* **Phonetic Transliteration Engine:** Converts over 100 coastal names into Kannada script (e.g., "Shreyas" $\to$ *ಶ್ರೇಯಸ್*), allowing personalized profiles without third-party Kannada keyboards.

### 8.2 Living Environmental Canvas (Sky & Dynamic Waves)
* **Diurnal Sky Cycle:** Changes dynamically across Dawn, Day, Dusk, and Night gradients based on local time.
* **Dynamic Wave Canvas:** Wave amplitude, frequency, and water color modulate based on the live Marine Risk Index ($R$):
  * **Safe ($R < 2$):** Undulating azure waves.
  * **Caution ($4 \le R < 6$):** Elevated crests, cloudy teal water.
  * **Hazardous ($R \ge 6$):** Frothing whitecaps, stormy charcoal-slate water.

### 8.3 Emergency Distress Protocol (SOS Dispatch)
* Locks hardware GPS coordinates with accuracy metrics.
* Pre-composes a standardized distress SMS with a Google Maps geohash link.
* Provides one-tap calling to emergency maritime services:
  * **Indian Coast Guard:** `1554`
  * **Coastal Security Police:** `1093`
  * **National Emergency:** `112`

---

## 9. Complete Database Schema (PostgreSQL)

```sql
-- 1. Canonical Coastal Reference Stations
CREATE TABLE sampling_locations (
    id SERIAL PRIMARY KEY,
    location_id VARCHAR(32) UNIQUE NOT NULL,
    city_name VARCHAR(128) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Environmental Satellite Observations (GEE)
CREATE TABLE environmental_observations (
    id SERIAL PRIMARY KEY,
    sampling_location_id INTEGER REFERENCES sampling_locations(id) ON DELETE CASCADE,
    observation_date DATE NOT NULL,
    sst DOUBLE PRECISION,
    chlorophyll DOUBLE PRECISION,
    source VARCHAR(64) NOT NULL,
    quality_flag VARCHAR(32) DEFAULT 'GOOD',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_env_obs UNIQUE (sampling_location_id, observation_date)
);

-- 3. Atmospheric & Wave NWP Observations (Open-Meteo)
CREATE TABLE marine_observations (
    id SERIAL PRIMARY KEY,
    sampling_location_id INTEGER REFERENCES sampling_locations(id) ON DELETE CASCADE,
    observation_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    wind_speed DOUBLE PRECISION NOT NULL,
    wind_direction DOUBLE PRECISION,
    wave_height DOUBLE PRECISION NOT NULL,
    wave_direction DOUBLE PRECISION,
    source VARCHAR(64) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_marine_obs UNIQUE (sampling_location_id, observation_timestamp)
);

-- 4. Computed PFZ Analytical Scores
CREATE TABLE pfz_results (
    id SERIAL PRIMARY KEY,
    sampling_location_id INTEGER REFERENCES sampling_locations(id) ON DELETE CASCADE,
    score DOUBLE PRECISION,
    category VARCHAR(64) NOT NULL,
    confidence DOUBLE PRECISION NOT NULL,
    observation_date DATE NOT NULL,
    status VARCHAR(32) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_pfz_res UNIQUE (sampling_location_id, observation_date)
);

-- 5. Computed Marine Risk Scores
CREATE TABLE risk_results (
    id SERIAL PRIMARY KEY,
    sampling_location_id INTEGER REFERENCES sampling_locations(id) ON DELETE CASCADE,
    score DOUBLE PRECISION NOT NULL,
    category VARCHAR(64) NOT NULL,
    confidence DOUBLE PRECISION NOT NULL,
    observation_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(32) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_risk_res UNIQUE (sampling_location_id, observation_timestamp)
);

-- 6. Official Government Advisories (INCOIS)
CREATE TABLE incois_advisories (
    id SERIAL PRIMARY KEY,
    advisory_date DATE NOT NULL,
    sector_id VARCHAR(32) NOT NULL,
    landing_center VARCHAR(128) NOT NULL,
    bearing_degrees DOUBLE PRECISION,
    distance_km DOUBLE PRECISION,
    depth_m DOUBLE PRECISION,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    raw_text TEXT,
    nearest_sampling_location_id INTEGER REFERENCES sampling_locations(id),
    distance_to_nearest_km DOUBLE PRECISION,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_incois_adv UNIQUE (advisory_date, latitude, longitude)
);
```

---

## 10. RESTful API Endpoint Contract

| Method | Endpoint | Request Payload | Response Attributes |
|---|---|---|---|
| `GET` | `/api/v1/health` | None | `status`, `database_status`, `version` |
| `GET` | `/api/v1/current-state` | None | Array of joined location states (`location_id`, `city_name`, `pfz`, `risk`) |
| `GET` | `/api/v1/current-state/{loc_id}` | None | Single location state object |
| `GET` | `/api/v1/advisories` | Query: `?landing=Malpe` | Array of scraped INCOIS records |
| `GET` | `/api/v1/alerts` | None | Array of active weather/PFZ safety alerts |
| `POST` | `/api/v1/voice/query` | Multipart (`audio_file`, `location_id`, `language_hint`) | `transcript`, `intent`, `answer`, `audio_url`, `freshness` |
| `POST` | `/api/v1/voice/text-query`| JSON: `{"text", "location_id", "language_hint"}` | Same as voice query |
| `GET` | `/api/v1/voice/audio/{id}` | Path: `audio_id` | Ephemeral `audio/wav` binary stream |
| `POST` | `/api/v1/pipeline/trigger` | None | Triggers immediate sync of all three ingestion pipelines |

---

## 11. Academic Research Framework (IEEE / ACM Guidance)

### 11.1 Formal Research Questions
* **RQ1 (Data Fusion Fidelity):** *Can asynchronous multi-source environmental pipelines fusing satellite bio-optical indicators with numerical hydrodynamic predictions generate high-resolution coastal advisory models without introducing spatial artifacts?*
* **RQ2 (Linguistic Grounding & Safety):** *Does deterministic intent routing coupled with neural ASR/TTS eliminate environmental hallucination risks compared to end-to-end Large Language Models in maritime safety domains?*
* **RQ3 (Spatial Utility & Fuel Optimization):** *Does multi-criteria per-port zone recommendation with nautical distance decay significantly reduce expected transit distance and diesel consumption relative to centralized regional bulletins?*
* **RQ4 (Edge Accessibility):** *Can a zero-cost mapping and vernacular voice architecture operate effectively on low-resource mobile hardware under intermittent high-seas network conditions?*

---

### 11.2 Comparative Benchmark with State-of-the-Art

| Feature Dimension | INCOIS Web Portal | Fisher Friend Mobile (MSSRF) | mKRISHI Fisheries (TCS) | **MatsyaMitra (This Work)** |
|---|---|---|---|---|
| **Architecture** | Web GIS / Static PDF | Mobile App | Mobile App | **Android (React Native 0.84)** |
| **Voice Interface** | None | Recorded Audio Clips | IVRS Broadcast | **Bilingual Neural ASR + TTS (Gnani.ai)** |
| **Response Engine** | None | Static Text | Static Text | **Deterministic Grounded Dynamic DB Query** |
| **Data Fusion** | SST + Chlorophyll | Aggregated Bulletins | Aggregated Bulletins | **GEE SST + CHL-a + Open-Meteo Waves/Wind** |
| **Risk Scoring** | Text Warning | Tabular Forecast | Tabular Forecast | **Hourly Continuous Hazard Index ($R \in [0, 10]$)** |
| **Cartography** | GeoServer | Google Maps SDK | Static Raster | **Key-Free Leaflet + Esri Ocean Bathymetry** |
| **Nautical Modeling** | Bearing/Distance Only | Straight Line Vector | None | **Waypoint Corridor + Fuel/Cost Estimator** |
| **Spatial Ranking** | Statewide Cluster | Regional List | Regional List | **Per-Port Dynamic Utility ($\Phi$) across 25 Stations** |

---

### 11.3 Systemic Limitations & Scientific Boundaries
1. **Satellite Cloud Gaps:** Optical satellite radiometry (Copernicus CHL-a) is blinded during the Southwest Monsoon (June–August). During this period, the system falls back to SST and Marine Risk scoring, explicitly reporting `STALE` satellite indices.
2. **Coarse SST Grid Resolution:** NOAA OISST operates on a 0.25° grid (~25 km). Stations separated by less than 15 km may report identical SST values, relying on 4 km Chlorophyll-a to provide spatial variation.
3. **Absence of Real-Time Vessel AIS:** In the absence of mandatory AIS transponders on artisanal Indian fishing canoes, spatial crowding metrics currently rely on mathematical dispersion models rather than live vessel tracking.
4. **Advisory Nature:** MatsyaMitra provides probabilistic environmental suitability models; it does not guarantee fish presence or replace mandatory navigational equipment, sonar, or official government maritime warnings.

---

## 12. Deployment, Environment Setup & Operational Run Guide

### 12.1 Local Environment Setup
```bash
# 1. Clone repository and navigate to root
cd E:\gnani\matsyamitra_integ-main

# 2. Configure Python virtual environment
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r analytics/requirements.txt

# 3. Initialize PostgreSQL Database
psql -U postgres -c "CREATE DATABASE matsyamitra;"
python -c "from analytics.persistence.database import init_db; init_db()"

# 4. Install Node dependencies
npm install
```

### 12.2 Launching the Full System
```powershell
# Option A: One-Click Quick-Start (Automated)
powershell -ExecutionPolicy Bypass -File .\quick-start.ps1

# Option B: Manual Startup
# Terminal 1: FastAPI Microservice
uvicorn analytics.api.main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2: React Native Metro Bundler
adb reverse tcp:8081 tcp:8081
adb reverse tcp:8000 tcp:8000
npm start -- --port 8081

# Terminal 3: Android App Installation
npm run android
```

---
*MatsyaMitra — Designed, Engineered, and Formulated by H S Shreyas & Chaithanya Nayaka T (2026).*
