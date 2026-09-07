from pathlib import Path
from tempfile import NamedTemporaryFile
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.api.deps import get_owner_id
from app.database.bootstrap import ensure_database_ready
from app.database.connection import get_db
from app.models.analysis import Analysis
from app.models.resume import Resume


router = APIRouter(
    prefix="/api/resume",
    tags=["Resume"],
)


def _db_with_schema(db: Session = Depends(get_db)) -> Session:
    ensure_database_ready()
    return db


def _get_owned_resume(db: Session, resume_id: int, owner_id: str) -> Resume:
    resume = (
        db.query(Resume)
        .filter(Resume.id == resume_id, Resume.owner_id == owner_id)
        .first()
    )
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    return resume


def _get_owned_analysis(db: Session, analysis_id: int, owner_id: str) -> tuple[Analysis, Resume]:
    row = (
        db.query(Analysis, Resume)
        .join(Resume, Analysis.resume_id == Resume.id)
        .filter(Analysis.id == analysis_id, Resume.owner_id == owner_id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return row


@router.post("/upload")
async def upload_resume(
    file: UploadFile = File(...),
    jd_text: Optional[str] = Form(None),
    jd_file: Optional[UploadFile] = File(None),
    db: Session = Depends(_db_with_schema),
    owner_id: str = Depends(get_owner_id),
):
    from app.services.embedding_service import generate_document_embedding
    from app.services.matching_engine import ResumeMatchingEngine
    from app.services.pdf_parser import extract_text_from_pdf
    from app.services.section_detector import detect_sections
    from app.services.skill_extractor import extract_categorized_skills, extract_skills_from_text
    from app.services.text_processor import clean_text

    if file.content_type != "application/pdf":
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are supported for resume.",
        )

    contents = await file.read()

    if not contents:
        raise HTTPException(
            status_code=400,
            detail="Uploaded resume file is empty.",
        )

    resume_temp_path = None
    jd_temp_path = None

    with NamedTemporaryFile(suffix=".pdf", delete=False) as temp_file:
        temp_file.write(contents)
        resume_temp_path = Path(temp_file.name)

    if jd_file and jd_file.filename:
        jd_contents = await jd_file.read()
        with NamedTemporaryFile(suffix=".pdf", delete=False) as jd_temp_file:
            jd_temp_file.write(jd_contents)
            jd_temp_path = Path(jd_temp_file.name)

    try:
        raw_text = extract_text_from_pdf(str(resume_temp_path))
        cleaned_text = clean_text(raw_text)
        sections = detect_sections(cleaned_text)

        if jd_temp_path:
            raw_jd = extract_text_from_pdf(str(jd_temp_path))
            jd_text = clean_text(raw_jd)

        resume_embedding = generate_document_embedding(cleaned_text)

        resume = Resume(
            filename=file.filename,
            owner_id=owner_id,
            raw_text=cleaned_text,
            pdf_content=contents,
            embedding=resume_embedding,
        )

        db.add(resume)
        db.commit()
        db.refresh(resume)

        response_data = {
            "id": resume.id,
            "filename": resume.filename,
            "text": cleaned_text,
            "sections": sections,
        }

        if jd_text and jd_text.strip():
            engine = ResumeMatchingEngine()

            categorized_skills = extract_categorized_skills(jd_text)
            required_skills = categorized_skills["must_have"]
            preferred_skills = categorized_skills["preferred"]
            all_required_skills = required_skills + preferred_skills
            candidate_skills = extract_skills_from_text(
                cleaned_text, allowed_from_urls=all_required_skills
            )

            keywords = [sk.lower() for sk in required_skills]

            req_years_result = engine.extract_experience_years(jd_text, is_jd=True)
            req_years = (
                req_years_result[0]
                if isinstance(req_years_result, tuple)
                else req_years_result
            )

            job_requirements = {
                "required_skills": required_skills,
                "preferred_skills": preferred_skills,
                "required_years": req_years,
                "keywords": keywords,
            }

            match_result = engine.calculate_overall_score(
                required_skills=required_skills,
                preferred_skills=preferred_skills,
                candidate_skills=candidate_skills,
                required_experience_years=req_years,
                candidate_resume_text=cleaned_text,
                required_keywords=keywords,
                job_description=jd_text,
                job_requirements=job_requirements,
                use_dynamic_weights=True,
                resume_sections=sections,
            )

            jd_embedding_vec = generate_document_embedding(jd_text)

            analysis = Analysis(
                resume_id=resume.id,
                job_description=jd_text,
                jd_embedding=jd_embedding_vec,
                overall_score=match_result.get("overall_score"),
                match_result=match_result,
            )
            db.add(analysis)
            db.commit()
            db.refresh(analysis)

            response_data["match_result"] = match_result
            response_data["analysis_id"] = analysis.id

        return response_data

    finally:
        if jd_temp_path:
            jd_temp_path.unlink(missing_ok=True)
        if resume_temp_path:
            resume_temp_path.unlink(missing_ok=True)


@router.get("/list")
def list_resumes(
    db: Session = Depends(_db_with_schema),
    owner_id: str = Depends(get_owner_id),
):
    resumes = (
        db.query(Resume)
        .filter(Resume.owner_id == owner_id)
        .order_by(Resume.created_at.desc())
        .all()
    )
    return [
        {"id": r.id, "filename": r.filename, "created_at": r.created_at}
        for r in resumes
    ]


@router.post("/analyze-existing")
async def analyze_existing_resume(
    resume_id: int = Form(...),
    jd_text: Optional[str] = Form(None),
    jd_file: Optional[UploadFile] = File(None),
    db: Session = Depends(_db_with_schema),
    owner_id: str = Depends(get_owner_id),
):
    from app.services.embedding_service import generate_document_embedding
    from app.services.matching_engine import ResumeMatchingEngine
    from app.services.pdf_parser import extract_text_from_pdf
    from app.services.section_detector import detect_sections
    from app.services.skill_extractor import extract_categorized_skills, extract_skills_from_text
    from app.services.text_processor import clean_text

    resume = _get_owned_resume(db, resume_id, owner_id)

    jd_temp_path = None
    if jd_file and jd_file.filename:
        jd_contents = await jd_file.read()
        with NamedTemporaryFile(suffix=".pdf", delete=False) as jd_temp_file:
            jd_temp_file.write(jd_contents)
            jd_temp_path = Path(jd_temp_file.name)

    try:
        if jd_temp_path:
            raw_jd = extract_text_from_pdf(str(jd_temp_path))
            jd_text = clean_text(raw_jd)

        sections = detect_sections(resume.raw_text)

        response_data = {
            "id": resume.id,
            "filename": resume.filename,
            "text": resume.raw_text,
            "sections": sections,
        }

        if jd_text and jd_text.strip():
            engine = ResumeMatchingEngine()

            categorized_skills = extract_categorized_skills(jd_text)
            required_skills = categorized_skills["must_have"]
            preferred_skills = categorized_skills["preferred"]
            all_required_skills = required_skills + preferred_skills
            candidate_skills = extract_skills_from_text(
                resume.raw_text, allowed_from_urls=all_required_skills
            )
            keywords = [sk.lower() for sk in required_skills]

            req_years_result = engine.extract_experience_years(jd_text, is_jd=True)
            req_years = (
                req_years_result[0]
                if isinstance(req_years_result, tuple)
                else req_years_result
            )

            job_requirements = {
                "required_skills": required_skills,
                "preferred_skills": preferred_skills,
                "required_years": req_years,
                "keywords": keywords,
            }

            match_result = engine.calculate_overall_score(
                required_skills=required_skills,
                preferred_skills=preferred_skills,
                candidate_skills=candidate_skills,
                required_experience_years=req_years,
                candidate_resume_text=resume.raw_text,
                required_keywords=keywords,
                job_description=jd_text,
                job_requirements=job_requirements,
                use_dynamic_weights=True,
                resume_sections=sections,
            )

            jd_embedding_vec = generate_document_embedding(jd_text)

            analysis = Analysis(
                resume_id=resume.id,
                job_description=jd_text,
                jd_embedding=jd_embedding_vec,
                overall_score=match_result.get("overall_score"),
                match_result=match_result,
            )
            db.add(analysis)
            db.commit()
            db.refresh(analysis)

            response_data["match_result"] = match_result
            response_data["analysis_id"] = analysis.id

        return response_data
    finally:
        if jd_temp_path:
            jd_temp_path.unlink(missing_ok=True)


@router.get("/file/{resume_id}")
def get_resume_pdf(
    resume_id: int,
    db: Session = Depends(_db_with_schema),
    owner_id: str = Depends(get_owner_id),
):
    resume = _get_owned_resume(db, resume_id, owner_id)

    if not resume.pdf_content:
        raise HTTPException(status_code=404, detail="PDF file not found in database")

    return Response(
        content=resume.pdf_content,
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="{resume.filename}"'},
    )


@router.get("/history")
def get_history(
    db: Session = Depends(_db_with_schema),
    owner_id: str = Depends(get_owner_id),
):
    analyses = (
        db.query(Analysis, Resume)
        .join(Resume, Analysis.resume_id == Resume.id)
        .filter(Resume.owner_id == owner_id)
        .order_by(Analysis.created_at.desc())
        .all()
    )

    result = []
    for analysis, resume in analyses:
        jd_text_val = analysis.job_description or ""
        jd_snippet = (
            jd_text_val.strip()[:60] + "..."
            if len(jd_text_val.strip()) > 60
            else jd_text_val.strip()
        )
        if not jd_snippet:
            jd_snippet = "General Analysis"

        result.append(
            {
                "id": analysis.id,
                "resume_id": resume.id,
                "filename": resume.filename,
                "overall_score": analysis.overall_score,
                "created_at": analysis.created_at,
                "jd_snippet": jd_snippet,
            }
        )

    return result


@router.get("/analysis/{analysis_id}")
def get_analysis(
    analysis_id: int,
    db: Session = Depends(_db_with_schema),
    owner_id: str = Depends(get_owner_id),
):
    analysis, resume = _get_owned_analysis(db, analysis_id, owner_id)

    return {
        "id": analysis.id,
        "resume_id": resume.id,
        "filename": resume.filename,
        "resume_text": resume.raw_text,
        "has_pdf": bool(resume.pdf_content),
        "job_description": analysis.job_description,
        "overall_score": analysis.overall_score,
        "match_result": analysis.match_result,
        "created_at": analysis.created_at,
    }


@router.delete("/analysis/{analysis_id}")
def delete_analysis(
    analysis_id: int,
    db: Session = Depends(_db_with_schema),
    owner_id: str = Depends(get_owner_id),
):
    analysis, _resume = _get_owned_analysis(db, analysis_id, owner_id)

    db.delete(analysis)
    db.commit()

    return {"message": "Analysis deleted successfully"}
