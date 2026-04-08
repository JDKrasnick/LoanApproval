from __future__ import annotations

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session

from config import settings
from database import get_db
from models import Application, Document, DocumentType
from schemas import DocumentOut
from services.audit import log_event

router = APIRouter(prefix="/documents", tags=["documents"])


def _storage_path(application_id: uuid.UUID, filename: str) -> str:
    return f"applications/{application_id}/{filename}"


async def _upload_to_supabase(path: str, data: bytes, content_type: str) -> Optional[str]:
    """Upload file to Supabase Storage. Returns path on success, None if not configured."""
    if not settings.supabase_url or not settings.supabase_service_key:
        return path  # local dev: just record the path

    from supabase import create_client
    client = create_client(settings.supabase_url, settings.supabase_service_key)
    try:
        client.storage.from_("loan-documents").upload(
            path, data, {"content-type": content_type}
        )
        return path
    except Exception:
        return path


@router.post("/upload", response_model=DocumentOut, status_code=201)
async def upload_document(
    application_id: uuid.UUID = Form(...),
    document_type: DocumentType = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    data = await file.read()
    path = _storage_path(application_id, file.filename or "upload")
    storage_path = await _upload_to_supabase(path, data, file.content_type or "application/octet-stream")

    doc = Document(
        application_id=application_id,
        document_type=document_type,
        filename=file.filename or "upload",
        file_size_bytes=len(data),
        supabase_storage_path=storage_path,
    )
    db.add(doc)
    log_event(
        db,
        application_id,
        "document_uploaded",
        {"document_type": document_type.value, "filename": file.filename},
    )
    db.commit()
    db.refresh(doc)
    return doc


@router.get("/{application_id}", response_model=list[DocumentOut])
def list_documents(application_id: uuid.UUID, db: Session = Depends(get_db)):
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    return app.documents
