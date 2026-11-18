"""Initialize Supabase Cloud Database for MatsyaMitra.

Creates all tables directly from SQLAlchemy Base metadata and seeds
the canonical 25 Karnataka coastal sampling stations.
"""

from sqlalchemy import select
from analytics.persistence.database import create_database_engine, create_tables
from analytics.persistence.models import Base, SamplingLocation
from analytics.persistence.session import create_session_factory, session_scope

_LOCATIONS = [
    ("KARN_001", "Karwar", 14.602642, 73.152614),
    ("KARN_002", "Kundapura", 13.714424, 74.206417),
    ("KARN_003", "Kumta", 14.252099, 73.284125),
    ("KARN_004", "Ankola", 14.576383, 73.371932),
    ("KARN_005", "Someshwara", 12.656436, 74.245355),
    ("KARN_006", "Bhatkal Deep Sea", 13.876570, 73.098200),
    ("KARN_007", "Malpe Offshore", 13.628876, 74.066202),
    ("KARN_008", "Maravanthe", 13.697208, 74.292278),
    ("KARN_009", "Baindur", 13.841149, 73.600926),
    ("KARN_010", "Kundapura Coast", 13.701877, 74.189533),
    ("KARN_011", "Gangolli", 13.642529, 74.507275),
    ("KARN_012", "Shiroor", 13.819599, 74.118591),
    ("KARN_013", "Gokarna", 14.444009, 73.421502),
    ("KARN_014", "Mangalore Deep Sea", 12.360216, 73.587784),
    ("KARN_015", "Surathkal", 12.904593, 73.898817),
    ("KARN_016", "Honnavar", 14.288519, 73.698840),
    ("KARN_017", "Belekeri", 14.437228, 73.948746),
    ("KARN_018", "Malpe", 13.343755, 74.666625),
    ("KARN_019", "Bhatkal Offshore", 13.722979, 73.496794),
    ("KARN_020", "Murudeshwar", 14.117504, 73.262162),
    ("KARN_021", "Netrani Deep Sea", 13.762229, 73.216743),
    ("KARN_022", "Kaup", 13.522264, 73.478449),
    ("KARN_023", "Ullal Offshore", 12.397850, 73.472452),
    ("KARN_024", "Manki", 13.763693, 73.448016),
    ("KARN_025", "Mangalore", 12.896538, 74.719480),
]


def main() -> None:
    print("Connecting to Supabase PostgreSQL...")
    engine = create_database_engine()

    print("Creating all database tables (models)...")
    create_tables(engine)
    print("All tables created successfully!")

    print("Seeding canonical 25 Karnataka coastal locations...")
    session_factory = create_session_factory(engine)
    with session_scope(session_factory) as session:
        for loc_id, city, lat, lon in _LOCATIONS:
            existing = session.scalar(
                select(SamplingLocation).where(SamplingLocation.location_id == loc_id)
            )
            if existing is None:
                session.add(
                    SamplingLocation(
                        location_id=loc_id,
                        city_name=city,
                        latitude=lat,
                        longitude=lon,
                        is_active=True,
                    )
                )
            else:
                existing.city_name = city
                existing.latitude = lat
                existing.longitude = lon

    print("25 canonical locations successfully initialized in Supabase!")
    print("Done!")


if __name__ == "__main__":
    main()
