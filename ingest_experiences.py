import os 
import json 
import re 
from sentence_transformers import SentenceTransformer
from azure.storage.blob import BlobServiceClient
from azure.search.documents import SearchClient 
from azure.core.credentials import AzureKeyCredential
from dotenv import load_dotenv 
load_dotenv()
# Loading Embedding Model 
embedder = SentenceTransformer("all-MiniLM-L6-v2")

def embed(text):
     return embedder.encode(text).tolist() 

# Connecting to Azure Blob 
blob_service = BlobServiceClient.from_connection_string(
     os.getenv("AZURE_STORAGE_CONNECTION_STRING")
)
container = blob_service.get_container_client("experience-data")

# Connect to azure search 

search_client  =  SearchClient(
     endpoint= os.getenv("AZURE_SEARCH_ENDPOINT"),
     index_name = os.getenv("INDEX_NAME"),
     credential= AzureKeyCredential(os.getenv("AZURE_SEARCH_KEY"))
)

# Chunking Helper 
def chunk_text(text, max_chars=500): 
    chunks = [] 
    while len(text) > max_chars: 
        split_at = text.rfind(" ", 0, max_chars) 
        if split_at == -1: 
            split_at = max_chars 
        chunks.append(text[:split_at]) 
        text = text[split_at:] 
    chunks.append(text)
    return chunks

def sanitize_id(s):
    return re.sub(r"[^A-Za-z0-9_\-=]", "_", s)# Process All files in blob 

docs_to_upload = []

for blob in container.list_blobs():
    if not blob.name.endswith(".json"):
        continue 

    blob_data = container.download_blob(blob.name).readall()
    data = json.loads(blob_data)

    content = data.get("content" , "")

    chunks = chunk_text(content)

    for i , chunk  in enumerate(chunks): 
        vector = embed(chunk)
        safe_id = sanitize_id(f"{blob.name}-{i}")

        doc = {
            "id" :  safe_id,
            "content" : chunk ,
            "embedding" : vector , 
        }
        docs_to_upload.append(doc)

# Upload to azure search 

print(f"Uploading {len(docs_to_upload)} documents...")
search_client.upload_documents(docs_to_upload)
print("Done")