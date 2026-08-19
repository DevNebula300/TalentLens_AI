from pathlib import Path
from tempfile import NamedTemporaryFile
import uuid
import os

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, Form
from fastapi.responses import FileResponse
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

    UPLOADS_DIR = Path("uploads/resumes")
    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
    
    file_id = uuid.uuid4().hex
    saved_file_path = UPLOADS_DIR / f"{file_id}.pdf"
    
    with open(saved_file_path, "wb") as f:
        f.write(contents)
        
    jd_temp_path = None
    if jd_file and jd_file.filename:
        jd_contents = await jd_file.read()
        with NamedTemporaryFile(suffix=".pdf", delete=False) as jd_temp_file:
            jd_temp_file.write(jd_contents)
            jd_temp_path = Path(jd_temp_file.name)

    try:
        # extract pdf
        raw_text = extract_text_from_pdf(str(saved_file_path))

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
            file_path=str(saved_file_path)
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
            candidate_skills = extract_skills_from_text(cleaned_text, allowed_from_urls=required_skills)
            
            # Simple keyword extraction for JD keywords (just use the required skills as keywords for now)
            keywords = [sk.lower() for sk in required_skills]
            
            # Extract experience requirements
            req_years_result = engine.extract_experience_years(jd_text)
            req_years = req_years_result[0] if isinstance(req_years_result, tuple) else req_years_result
            
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
        if jd_temp_path:
            jd_temp_path.unlink(missing_ok=True)


@router.get("/list")
def list_resumes(db: Session = Depends(get_db)):
    resumes = db.query(Resume).order_by(Resume.created_at.desc()).all()
    return [{"id": r.id, "filename": r.filename, "created_at": r.created_at} for r in resumes]


@router.post("/analyze-existing")
async def analyze_existing_resume(
    resume_id: int = Form(...),
    jd_text: Optional[str] = Form(None),
    jd_file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
):
    resume = db.query(Resume).filter(Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    jd_temp_path = None
    if jd_file and jd_file.filename:
        jd_contents = await jd_file.read()
        with NamedTemporaryFile(suffix=".pdf", delete=False) as jd_temp_file:
            jd_temp_file.write(jd_contents)
            jd_temp_path = Path(jd_temp_file.name)

    try:
        # Parse JD file if provided
        if jd_temp_path:
            raw_jd = extract_text_from_pdf(str(jd_temp_path))
            jd_text = clean_text(raw_jd)

        # Detect resume sections
        sections = detect_sections(resume.raw_text)

        response_data = {
            "id": resume.id,
            "filename": resume.filename,
            "text": resume.raw_text,
            "sections": sections,
        }

        # If Job Description is provided, run the matching engine
        if jd_text and jd_text.strip():
            engine = ResumeMatchingEngine()
            
            required_skills = extract_skills_from_text(jd_text)
            candidate_skills = extract_skills_from_text(resume.raw_text, allowed_from_urls=required_skills)
            keywords = [sk.lower() for sk in required_skills]
            
            req_years_result = engine.extract_experience_years(jd_text)
            req_years = req_years_result[0] if isinstance(req_years_result, tuple) else req_years_result
            
            job_requirements = {
                "required_skills": required_skills,
                "required_years": req_years,
                "keywords": keywords
            }
            
            match_result = engine.calculate_overall_score(
                required_skills=required_skills,
                candidate_skills=candidate_skills,
                required_experience_years=req_years,
                candidate_resume_text=resume.raw_text,
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
        if jd_temp_path:
            jd_temp_path.unlink(missing_ok=True)


@router.get("/file/{resume_id}")
def get_resume_pdf(resume_id: int, db: Session = Depends(get_db)):
    resume = db.query(Resume).filter(Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
        
    if not resume.file_path or not os.path.exists(resume.file_path):
        raise HTTPException(status_code=404, detail="PDF file not found on disk")
        
    return FileResponse(
        path=resume.file_path,
        media_type="application/pdf",
        filename=resume.filename,
        content_disposition_type="inline"
    )


@router.get("/history")
def get_history(db: Session = Depends(get_db)):
    analyses = db.query(Analysis, Resume).join(Resume).order_by(Analysis.created_at.desc()).all()
    
    result = []
    for analysis, resume in analyses:
        jd_text_val = analysis.job_description or ""
        jd_snippet = jd_text_val.strip()[:60] + "..." if len(jd_text_val.strip()) > 60 else jd_text_val.strip()
        if not jd_snippet:
            jd_snippet = "General Analysis"
            
        result.append({
            "id": analysis.id,
            "resume_id": resume.id,
            "filename": resume.filename,
            "overall_score": analysis.overall_score,
            "created_at": analysis.created_at,
            "jd_snippet": jd_snippet
        })
        
    return result


@router.get("/analysis/{analysis_id}")
def get_analysis(analysis_id: int, db: Session = Depends(get_db)):
    analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
        
    resume = db.query(Resume).filter(Resume.id == analysis.resume_id).first()
    
    has_pdf = False
    if resume and resume.file_path and os.path.exists(resume.file_path):
        has_pdf = True
    
    return {
        "id": analysis.id,
        "resume_id": resume.id,
        "filename": resume.filename if resume else None,
        "resume_text": resume.raw_text if resume else None,
        "has_pdf": has_pdf,
        "job_description": analysis.job_description,
        "overall_score": analysis.overall_score,
        "match_result": analysis.match_result,
        "created_at": analysis.created_at
    }

@router.delete("/analysis/{analysis_id}")
def delete_analysis(analysis_id: int, db: Session = Depends(get_db)):
    analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
        
    db.delete(analysis)
    db.commit()
    
    return {"message": "Analysis deleted successfully"}