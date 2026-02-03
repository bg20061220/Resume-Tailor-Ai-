from fastapi import APIRouter, HTTPException, Depends
from models import ProjectData
from database import get_db
from utils.embeddings import get_embedding
from dependencies.auth import get_current_user

router = APIRouter(prefix="/api", tags=["experiences"])


@router.post("/experiences")
def add_experience(
    project: ProjectData,
    user_id: str = Depends(get_current_user),
):
    embedding = get_embedding(project.content)
    conn = get_db()
    cur = conn.cursor()

    try:
        cur.execute("""
        INSERT INTO experiences (id, user_id, type, title, date_range, skills, industry, tags, content, embedding)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            project.id,
            user_id,
            project.type,
            project.title,
            project.date_range,
            project.skills,
            project.industry,
            project.tags,
            project.content,
            embedding
        ))
        conn.commit()
        return {"status": "success", "id": project.id}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cur.close()
        conn.close()


@router.get("/experiences")
def get_all_experiences(user_id: str = Depends(get_current_user)):
    conn = get_db()
    cur = conn.cursor()

    cur.execute("""
         SELECT id, type, title, date_range, skills, industry, tags, content
         FROM experiences
         WHERE user_id = %s
         ORDER BY date_range DESC
    """, (user_id,))

    results = []
    for row in cur.fetchall():
        results.append({
            "id": row[0],
            "type": row[1],
            "title": row[2],
            "date_range": row[3],
            "skills": row[4],
            "industry": row[5],
            "tags": row[6],
            "content": row[7]
        })

    cur.close()
    conn.close()

    return {"experiences": results, "count": len(results)}


@router.put("/experiences/{experience_id}")
def update_experience(
    experience_id: str,
    project: ProjectData,
    user_id: str = Depends(get_current_user),
):
    embedding = get_embedding(project.content)
    conn = get_db()
    cur = conn.cursor()

    try:
        cur.execute("""
            UPDATE experiences
            SET type = %s, title = %s, date_range = %s, skills = %s,
                industry = %s, tags = %s, content = %s, embedding = %s
            WHERE id = %s AND user_id = %s
        """, (
            project.type,
            project.title,
            project.date_range,
            project.skills,
            project.industry,
            project.tags,
            project.content,
            embedding,
            experience_id,
            user_id
        ))

        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Experience not found")

        conn.commit()
        return {"status": "updated", "id": experience_id}
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cur.close()
        conn.close()


@router.delete("/experiences/{experience_id}")
def delete_experience(
    experience_id: str,
    user_id: str = Depends(get_current_user),
):
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        "DELETE FROM experiences WHERE id = %s AND user_id = %s",
        (experience_id, user_id)
    )
    deleted = cur.rowcount

    conn.commit()
    cur.close()
    conn.close()

    if deleted == 0:
        raise HTTPException(status_code=404, detail="Experience not found")
    return {"status": "deleted", "id": experience_id}
