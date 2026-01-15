import os 
from openai import AzureOpenAI
from dotenv import load_dotenv 
load_dotenv()


client = AzureOpenAI(
    azure_endpoint= os.getenv("AZURE_OPENAI_ENDPOINT"),
    api_key = os.getenv("AZURE_OPENAI_KEY"),
    api_version = "2024-02-01"
)
response = client.embeddings.create(
    model = "text-embedding-3-small",
    input = "Hello world"
)

print(len(response.data[0].embedding))