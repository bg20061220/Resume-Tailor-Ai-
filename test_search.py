import psycopg2
from sentence_transformers import SentenceTransformer
from pgvector.psycopg2 import register_vector


embedder = SentenceTransformer("all-MiniLM-L6-v2")

query = "A project where you used React Html Css javascript"
query_embedding = embedder.encode(query).tolist()

conn = psycopg2.connect(
    host = "localhost",
    database = "resume_tailor",
    user = "postgres",
    password = "postgres"
)

register_vector(conn)
cur = conn.cursor()

# Vector search
cur.execute(""" 
   SELECT title, content , 1 - (embedding <=> %s::vector) as similarity
    FROM projects 
    ORDER BY embedding <=> %s::vector
    LIMIT 3 
""" , (query_embedding , query_embedding))

print("Top 3 matches : \n")

for title , content , similarity in cur.fetchall():
    print(f" {title}")
    print(f"Similarity : {similarity:.2%}")
    print(f"   Full Content:\n{content}\n")
    print("="*50 + "\n")

cur.close()
conn.close() 