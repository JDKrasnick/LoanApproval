from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Document, LLMExtraction
from schemas import LLMExtractionOut
from services.audit import log_event

router = APIRouter(prefix="/llm", tags=["llm"])


@router.post("/extract/{document_id}", response_model=LLMExtractionOut)
async def extract_document(document_id: uuid.UUID, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if doc.document_type.value not in ("financial_statement", "tax_return"):
        raise HTTPException(
            status_code=400,
            detail="LLM extraction only supported for financial_statement and tax_return documents",
        )

    # In production: fetch file from Supabase Storage and extract text via pypdf2/pdfminer
    # For now we use a stub that signals infrastructure is wired
    document_text = f"[Document: {doc.filename} — text extraction requires file retrieval from storage]"

    from llm.client import extract_financials
    fields, confidence, model_used = await extract_financials(document_text)

    existing = db.query(LLMExtraction).filter(LLMExtraction.document_id == document_id).first()
    if existing:
        existing.extracted_fields = fields
        existing.confidence_scores = confidence
        existing.model_used = model_used
        extraction = existing
    else:
        extraction = LLMExtraction(
            document_id=document_id,
            extracted_fields=fields,
            confidence_scores=confidence,
            model_used=model_used,
        )
        db.add(extraction)

    log_event(
        db,
        doc.application_id,
        "llm_extraction_complete",
        {"document_id": str(document_id), "model_used": model_used},
    )
    db.commit()
    db.refresh(extraction)
    return extraction
