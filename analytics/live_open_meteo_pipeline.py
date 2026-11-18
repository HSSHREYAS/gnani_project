"""Live Open-Meteo Marine Data Pipeline & Risk Scoring for MatsyaMitra.

Fetches live wave height and wind speed from Open-Meteo's public API for all 25
canonical Karnataka coastal stations, persists them into marine_observations,
and calculates operational risk scores with the piecewise marine risk engine.
"""

from __future__ import annotations

import json
import logging
import os
import urllib.request
from datetime import datetime, timezone
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from analytics.config import load_database_config_from_env
from analytics.persistence.database import create_database_engine
from analytics.persistence.models import MarineObservation, RiskResult, SamplingLocation
from analytics.persistence.repository import RiskRepository
from analytics.scoring.models import RiskScoringInput
from analytics.scoring.risk_engine import score_risk_record

logger = logging.getLogger("matsyamitra_open_meteo_pipeline")


def fetch_open_meteo_telemetry(locations: List[SamplingLocation]) -> tuple[list, list]:
    """Batch fetch live marine wave height and wind speed from Open-Meteo."""
    if not locations:
        return [], []

    lats = ",".join(str(loc.latitude) for loc in locations)
    lons = ",".join(str(loc.longitude) for loc in locations)

    # 1. Marine Wave Height API
    url_marine = (
        f"https://marine-api.open-meteo.com/v1/marine"
        f"?latitude={lats}&longitude={lons}&hourly=wave_height&cell_selection=sea&forecast_days=1"
    )
    req_marine = urllib.request.Request(url_marine, headers={"User-Agent": "MatsyaMitra/1.0"})
    with urllib.request.urlopen(req_marine, timeout=15) as resp:
        marine_raw = json.loads(resp.read().decode("utf-8"))
        marine_list = marine_raw if isinstance(marine_raw, list) else [marine_raw]

    # 2. Weather Wind Speed API
    url_wind = (
        f"https://api.open-meteo.com/v1/forecast"
        f"?latitude={lats}&longitude={lons}&hourly=wind_speed_10m&wind_speed_unit=ms&forecast_days=1"
    )
    req_wind = urllib.request.Request(url_wind, headers={"User-Agent": "MatsyaMitra/1.0"})
    with urllib.request.urlopen(req_wind, timeout=15) as resp:
        wind_raw = json.loads(resp.read().decode("utf-8"))
        wind_list = wind_raw if isinstance(wind_raw, list) else [wind_raw]

    return marine_list, wind_list


def ingest_and_score_live_data(session: Session) -> int:
    """Fetch live Open-Meteo observations for all active stations, persist, and score risk."""
    locations = list(
        session.scalars(
            select(SamplingLocation)
            .where(SamplingLocation.is_active.is_(True))
            .order_by(SamplingLocation.id)
        ).all()
    )

    if not locations:
        logger.warning("No active sampling locations found in database.")
        return 0

    logger.info("Fetching Open-Meteo telemetry for %d canonical Karnataka locations...", len(locations))
    marine_data, wind_data = fetch_open_meteo_telemetry(locations)

    now_utc = datetime.now(timezone.utc)
    target_hour = now_utc.strftime("%Y-%m-%dT%H:00")
    risk_repo = RiskRepository(session)

    inserted_count = 0

    for i, loc in enumerate(locations):
        m_item = marine_data[i] if i < len(marine_data) else {}
        w_item = wind_data[i] if i < len(wind_data) else {}

        times_m = m_item.get("hourly", {}).get("time", [])
        waves = m_item.get("hourly", {}).get("wave_height", [])
        times_w = w_item.get("hourly", {}).get("time", [])
        winds = w_item.get("hourly", {}).get("wind_speed_10m", [])

        idx_m = times_m.index(target_hour) if target_hour in times_m else (len(times_m) - 1 if times_m else 0)
        idx_w = times_w.index(target_hour) if target_hour in times_w else (len(times_w) - 1 if times_w else 0)

        wave_val = waves[idx_m] if idx_m < len(waves) else None
        wind_val = winds[idx_w] if idx_w < len(winds) else None

        time_str = times_m[idx_m] if idx_m < len(times_m) else target_hour
        try:
            obs_dt = datetime.fromisoformat(time_str).replace(tzinfo=timezone.utc)
        except Exception:
            obs_dt = now_utc

        # Check existing MarineObservation to avoid duplicate constraint errors
        existing_obs = session.scalar(
            select(MarineObservation).where(
                MarineObservation.location_id == loc.location_id,
                MarineObservation.observation_timestamp == obs_dt,
                MarineObservation.source == "open-meteo",
            )
        )

        if not existing_obs:
            obs = MarineObservation(
                sampling_location_id=loc.id,
                location_id=loc.location_id,
                latitude=loc.latitude,
                longitude=loc.longitude,
                observation_timestamp=obs_dt,
                wind_speed=wind_val,
                wave_height=wave_val,
                source="open-meteo",
                source_latitude=m_item.get("latitude"),
                source_longitude=m_item.get("longitude"),
            )
            session.add(obs)
            session.flush()
            obs_id = obs.marine_observation_id
        else:
            obs_id = existing_obs.marine_observation_id

        # Calculate risk score with deterministic risk engine
        age_hours = max(0.0, (now_utc - obs_dt).total_seconds() / 3600.0)
        scoring_input = RiskScoringInput(
            wind_speed=wind_val if wind_val is not None else 0.0,
            wave_height=wave_val if wave_val is not None else 0.0,
            observation_timestamp=obs_dt,
            sampling_location_id=loc.id,
            marine_observation_id=obs_id,
            data_age_hours=age_hours,
            source="open-meteo",
        )
        scored_result = score_risk_record(scoring_input)
        inserted = risk_repo.insert_risk_result(scored_result)
        inserted_count += inserted

    session.commit()
    logger.info("Successfully ingested & scored %d risk results for Karnataka stations.", inserted_count)
    return inserted_count


def main():
    engine = create_database_engine()
    with Session(engine) as session:
        count = ingest_and_score_live_data(session)
        print(f"Open-Meteo Pipeline finished. Scored {count} locations.")


if __name__ == "__main__":
    main()
