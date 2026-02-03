import os
import requests

HF_API_TOKEN = os.getenv("HF_API_TOKEN")
HF_MODEL_URL = "https://router.huggingface.co/hf-inference/models/sentence-transformers/all-MiniLM-L6-v2"


def get_embedding(text: str) -> list:
    """Generate embedding vector for the given text using HF Inference API."""
    if not HF_API_TOKEN:
        raise RuntimeError("HF_API_TOKEN environment variable not set")

    headers = {"Authorization": f"Bearer {HF_API_TOKEN}"}

    # Use feature-extraction task format
    payload = {
        "inputs": text,
        "parameters": {},
        "options": {"wait_for_model": True, "use_cache": True}
    }

    response = requests.post(
        HF_MODEL_URL,
        headers=headers,
        json=payload
    )

    if response.status_code == 503:
        raise RuntimeError("Model is loading, please try again in a few seconds")
    elif response.status_code == 401:
        raise RuntimeError("Invalid HF_API_TOKEN")
    elif response.status_code != 200:
        raise RuntimeError(f"HF API error {response.status_code}: {response.text}")

    result = response.json()

    # Handle different response formats
    if isinstance(result, list):
        if len(result) > 0 and isinstance(result[0], list):
            # Nested list - take mean pooling
            import numpy as np
            embedding = np.mean(result, axis=0).tolist()
        else:
            embedding = result
    else:
        raise RuntimeError(f"Unexpected response format: {type(result)}")

    if len(embedding) != 384:
        raise RuntimeError(f"Expected 384 dimensions, got {len(embedding)}")

    return embedding
