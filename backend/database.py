import os
import time
import psycopg2
from pgvector.psycopg2 import register_vector

DATABASE_URL = os.getenv("DATABASE_URL")

def get_db(retries: int = 3, delay: float = 1.5):
    """Get a database connection with pgvector registered. Retries on failure."""
    if not DATABASE_URL:
        raise RuntimeError("DATABASE_URL environment variable not set")

    last_error = None
    for attempt in range(1, retries + 1):
        try:
            conn = psycopg2.connect(
                DATABASE_URL,
                connect_timeout=10,        # don't hang forever
                keepalives=1,              # enable TCP keepalives
                keepalives_idle=30,        # start pinging after 30s idle
                keepalives_interval=10,    # ping every 10s
                keepalives_count=5,        # drop after 5 failed pings
            )
            # verify connection is actually alive
            with conn.cursor() as cur:
                cur.execute("SELECT 1")
            register_vector(conn)
            return conn
        except Exception as e:
            last_error = e
            print(f"[get_db] Attempt {attempt}/{retries} failed: {e}")
            if attempt < retries:
                time.sleep(delay)

    raise RuntimeError(f"Could not connect to database after {retries} attempts: {last_error}")