from pathlib import Path
from tempfile import NamedTemporaryFile

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.resume import Resume
from app.services.pdf_parser import extract_text_from_pdf
from app.services.section_detector import detect_sections
from app.services.text_processor import clean_text


router = APIRouter(
    prefix="/api/resume",
    tags=["Resume"],
)


@router.post("/upload")
async def upload_resume(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    if file.content_type != "application/pdf":
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are supported.",
        )

    contents = await file.read()

    if not contents:
        raise HTTPException(
            status_code=400,
            detail="Uploaded file is empty.",
        )

    with NamedTemporaryFile(
        suffix=".pdf",
        delete=False,
    ) as temp_file:
        temp_file.write(contents)
        temp_path = Path(temp_file.name)

    try:
        # extract pdf
        raw_text = extract_text_from_pdf(str(temp_path))

        # clean extracted text
        cleaned_text = clean_text(raw_text)

        # detect resume sections
        sections = detect_sections(cleaned_text)

        # create Resume database record
        resume = Resume(
            filename=file.filename,
            raw_text=cleaned_text,
        )

        # save to PostgreSQL
        db.add(resume)
        db.commit()
        db.refresh(resume)

        return {
            "id": resume.id,
            "filename": resume.filename,
            "text": cleaned_text,
            "sections": sections,
        }

    finally:
        temp_path.unlink(missing_ok=True)