import os
import psycopg2
from pgvector.psycopg2 import register_vector

# Use Supabase connection string from dashboard:
# Settings → Database → Connection string → URI
# For production, use the "Connection pooling" string (port 6543)
DATABASE_URL = os.getenv("DATABASE_URL")


def get_db():
    """Get a database connection with pgvector registered."""
    if not DATABASE_URL:
        raise RuntimeError("DATABASE_URL environment variable not set")

    conn = psycopg2.connect(DATABASE_URL)
    register_vector(conn)
    return conn
