import json
from fastapi import APIRouter, HTTPException, Depends
from models import LinkedInParseRequest
from utils.llm import call_llm
from dependencies.auth import get_current_user

router = APIRouter(prefix="/api", tags=["linkedin"])


@router.post("/parse-linkedin")
def parse_linkedin(
    request: LinkedInParseRequest,
    user_id: str = Depends(get_current_user),
):
    sections = []
    if request.experiences_text and request.experiences_text.strip():
        sections.append(f"=== WORK EXPERIENCE ===\n{request.experiences_text.strip()}")
    if request.projects_text and request.projects_text.strip():
        sections.append(f"=== PROJECTS ===\n{request.projects_text.strip()}")
    if request.volunteering_text and request.volunteering_text.strip():
        sections.append(f"=== VOLUNTEERING ===\n{request.volunteering_text.strip()}")

    if not sections:
        raise HTTPException(status_code=400, detail="Please paste text in at least one section.")

    combined_text = "\n\n".join(sections)

    prompt = f"""You are a structured data extractor. Parse the following LinkedIn profile text into a JSON array of experiences.

For each experience entry you find, extract:
- "type": one of "work", "project", or "volunteering" based on which section it came from
- "title": the role/project title and company/organization (e.g. "Software Engineer at Google")
- "date_range": the date range if present (e.g. "Jan 2020 - Present"), or null if not found
- "skills": an array of skills/technologies mentioned (extract from the description)
- "content": the full description text of the experience

Rules:
- Return ONLY a valid JSON array, no other text
- Each entry in the array is an object with the fields above
- If a section has multiple entries, create a separate object for each
- Do not invent information not present in the text
- If skills are not explicitly mentioned, infer them from the description (technologies, tools, frameworks)

LinkedIn Profile Text:
{combined_text}

Return ONLY the JSON array:"""

    llm_output = call_llm(prompt, temperature=0.1)

    # Parse the JSON response
    try:
        # Try to extract JSON array from the response
        text = llm_output.strip()
        # Handle cases where LLM wraps JSON in markdown code blocks
        if text.startswith("```"):
            text = text.split("\n", 1)[1] if "\n" in text else text[3:]
            text = text.rsplit("```", 1)[0]
            text = text.strip()

        parsed = json.loads(text)
        if not isinstance(parsed, list):
            parsed = [parsed]
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=500,
            detail="Failed to parse LinkedIn text. Please try again or adjust the pasted text."
        )

    # Validate and normalize each entry
    experiences = []
    for entry in parsed:
        experiences.append({
            "type": entry.get("type", "work"),
            "title": entry.get("title", "Untitled"),
            "date_range": entry.get("date_range"),
            "skills": entry.get("skills", []),
            "content": entry.get("content", ""),
        })

    return {"experiences": experiences, "count": len(experiences)}
