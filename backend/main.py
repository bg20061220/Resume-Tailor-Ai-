from fastapi import FastAPI , HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel 
from typing import List , Optional 
import psycopg2
from sentence_transformers import SentenceTransformer
from pgvector.psycopg2 import register_vector

app = FastAPI(title = "Resume Tailor API")

app.add_middleware(
    CORSMiddleware, 
    allow_origins = ["*"],
    allow_methods = ["*"],
    allow_headers = ["*"],
)

embedder = SentenceTransformer("all-MiniLM-L6-v2")

def get_db():
    conn = psycopg2.connect(
        host="localhost",
        database="resume_tailor",
        user="postgres",
        password="postgres"
    )
    register_vector(conn)
    return conn

class SearchRequest(BaseModel):
    query : str 
    limit : int = 5 

@app.get("/")
def root():
    return {"message : Resume Tailor API"}

@app.post("/api/search")
def search_projects(request : SearchRequest):
    query_embedding = embedder.encode(request.query).tolist()

    conn = get_db()
    cur  = conn.cursor()
    
    cur.execute("""
   SELECT id , type , title , content , skills , 1 - (embedding <=>%s::vector) as similarity 
    FROM projects 
    ORDER BY embedding <=> %s::vector
    LIMIT %s
        """ , (query_embedding  , query_embedding , request.limit))
    

    results = []

    for row in cur.fetchall():
         results.append({
        "id" : row[0],
        "type" : row[1],
        "title" : row[2],
        "content" : row[3],
        "skills" : row[4],
        "similarity" : row[5]
        })

    cur.close()
    conn.close()
    
    return {"results" : results}

@app.get("/health") 
def health():
    return {"status" : "healthy"}