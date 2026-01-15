import os 
from azure.search.documents import SearchClient
from azure.core.credentials import AzureKeyCredential
from sentence_transformers import SentenceTransformer
from dotenv import load_dotenv
load_dotenv()

# loafding env variables
search_endpoint = os.getenv("AZURE_SEARCH_ENDPOINT")
search_key = os.getenv("AZURE_SEARCH_KEY")
index_name = os.getenv("INDEX_NAME")

# Initialize the search client
search_client = SearchClient(
    endpoint=search_endpoint,
    index_name=index_name,
    credential=AzureKeyCredential(search_key)
)

# Load the embedding model
model = SentenceTransformer("all-MiniLM-L6-v2")

def search_chunks(query , k = 3) : 
    query_vector = model.encode(query).tolist()
    results = search_client.search(
        search_text = None , 
        vector_queries= [ {
            "kind" : "vector" ,
            "vector" : query_vector,
            "fields" : "embedding",
            "k" : k
        }],
        select= ["id" , "content"]
    )

    chunks = []
    for result in results : 
        chunks.append({
            "id" : result["id"],
            "content" : result["content"],
            "score" : result["@search.score"]
        })

    return chunks 


if __name__ == "__main__":
    query = "A project where you built your own algorithm  "
    results = search_chunks(query , k = 3)
    print("Top relevant chunks  : \n")
    for r in results : 
        print(f"ID: {r['id']}")
        print(f"Score: {r['score']:.4f}") 
        print(f"Content: {r['content']}\n")
        print("-" * 40)