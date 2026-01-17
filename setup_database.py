import psycopg2
from pgvector.psycopg2 import register_vector

conn = psycopg2.connect(
    host="localhost",
    database="resume_tailor",
    user="postgres",
    password="postgres"
)

cur = conn.cursor()

# Enable pgvector extension
cur.execute("CREATE EXTENSION IF NOT EXISTS vector")

# Create projects table matching your Azure schema
cur.execute("""
    CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        date_range TEXT,
        skills TEXT[],
        industry TEXT[],
        tags TEXT[],
        content TEXT NOT NULL,
        embedding vector(384) NOT NULL
    )
""")

# Create HNSW index for fast vector search
cur.execute("""
    CREATE INDEX IF NOT EXISTS projects_embedding_idx 
    ON projects USING hnsw (embedding vector_cosine_ops)
""")

conn.commit()
print("✅ Database schema created!")

cur.close()
conn.close()