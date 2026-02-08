from pydantic import BaseModel
from typing import List, Optional


class SearchRequest(BaseModel):
    query: str
    limit: int = 5


class ProjectData(BaseModel):
    id: str
    type: str
    title: str
    date_range: Optional[str] = None
    skills: List[str] = []
    industry: List[str] = []
    tags: List[str] = []
    content: str


class GenerateRequest(BaseModel):
    job_description: str
    num_bullets: int = 3
    experience_ids: List[str] = []


class LinkedInParseRequest(BaseModel):
    experiences_text: Optional[str] = None
    projects_text: Optional[str] = None
    volunteering_text: Optional[str] = None


class BatchExperienceRequest(BaseModel):
    experiences: List[ProjectData]
