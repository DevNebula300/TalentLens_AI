from pathlib import Path
from tempfile import NamedTemporaryFile

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, Form
from sqlalchemy.orm import Session
from typing import Optional

from app.database.connection import get_db
from app.models.resume import Resume
from app.models.analysis import Analysis
from app.services.pdf_parser import extract_text_from_pdf
from app.services.section_detector import detect_sections
from app.services.text_processor import clean_text
from app.services.skill_extractor import extract_skills_from_text
from app.services.matching_engine import ResumeMatchingEngine


router = APIRouter(
    prefix="/api/resume",
    tags=["Resume"],
)


@router.post("/upload")
async def upload_resume(
    file: UploadFile = File(...),
    jd_text: Optional[str] = Form(None),
    jd_file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
):
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

    with NamedTemporaryFile(
        suffix=".pdf",
        delete=False,
    ) as temp_file:
        temp_file.write(contents)
        temp_path = Path(temp_file.name)
        
    jd_temp_path = None
    if jd_file and jd_file.filename:
        jd_contents = await jd_file.read()
        with NamedTemporaryFile(suffix=".pdf", delete=False) as jd_temp_file:
            jd_temp_file.write(jd_contents)
            jd_temp_path = Path(jd_temp_file.name)

    try:
        # extract pdf
        raw_text = extract_text_from_pdf(str(temp_path))

        # clean extracted text
        cleaned_text = clean_text(raw_text)

        # detect resume sections
        sections = detect_sections(cleaned_text)
        
        # Parse JD file if provided
        if jd_temp_path:
            raw_jd = extract_text_from_pdf(str(jd_temp_path))
            jd_text = clean_text(raw_jd)

        # create Resume database record
        resume = Resume(
            filename=file.filename,
            raw_text=cleaned_text,
        )

        # save to PostgreSQL
        db.add(resume)
        db.commit()
        db.refresh(resume)

        response_data = {
            "id": resume.id,
            "filename": resume.filename,
            "text": cleaned_text,
            "sections": sections,
        }
        
        # If Job Description is provided, run the matching engine
        if jd_text and jd_text.strip():
            engine = ResumeMatchingEngine()
            
            required_skills = extract_skills_from_text(jd_text)
            candidate_skills = extract_skills_from_text(cleaned_text)
            
            # Simple keyword extraction for JD keywords (just use the required skills as keywords for now)
            keywords = [sk.lower() for sk in required_skills]
            
            # Extract experience requirements
            req_years = engine.extract_experience_years(jd_text)
            
            job_requirements = {
                "required_skills": required_skills,
                "required_years": req_years,
                "keywords": keywords
            }
            
            match_result = engine.calculate_overall_score(
                required_skills=required_skills,
                candidate_skills=candidate_skills,
                required_experience_years=req_years,
                candidate_resume_text=cleaned_text,
                required_keywords=keywords,
                job_description=jd_text,
                job_requirements=job_requirements,
                use_dynamic_weights=True
            )
            
            analysis = Analysis(
                resume_id=resume.id,
                job_description=jd_text,
                overall_score=match_result.get("overall_score"),
                match_result=match_result
            )
            db.add(analysis)
            db.commit()
            db.refresh(analysis)
            
            response_data["match_result"] = match_result
            response_data["analysis_id"] = analysis.id

        return response_data

    finally:
        temp_path.unlink(missing_ok=True)
        if jd_temp_path:
            jd_temp_path.unlink(missing_ok=True)


@router.get("/history")
def get_history(db: Session = Depends(get_db)):
    analyses = db.query(Analysis, Resume).join(Resume).order_by(Analysis.created_at.desc()).all()
    
    result = []
    for analysis, resume in analyses:
        result.append({
            "id": analysis.id,
            "resume_id": resume.id,
            "filename": resume.filename,
            "overall_score": analysis.overall_score,
            "created_at": analysis.created_at
        })
        
    return result


@router.get("/analysis/{analysis_id}")
def get_analysis(analysis_id: int, db: Session = Depends(get_db)):
    analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
        
    resume = db.query(Resume).filter(Resume.id == analysis.resume_id).first()
    
    return {
        "id": analysis.id,
        "resume_id": resume.id,
        "filename": resume.filename if resume else None,
        "job_description": analysis.job_description,
        "overall_score": analysis.overall_score,
        "match_result": analysis.match_result,
        "created_at": analysis.created_at
    }