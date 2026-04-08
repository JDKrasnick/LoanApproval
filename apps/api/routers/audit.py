from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Application, AuditLog
from schemas import AuditLogOut

router = APIRouter(prefix="/audit", tags=["audit"])


@router.get("/{application_id}", response_model=list[AuditLogOut])
def get_audit_log(application_id: uuid.UUID, db: Session = Depends(get_db)):
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    logs = (
        db.query(AuditLog)
        .filter(AuditLog.application_id == application_id)
        .order_by(AuditLog.created_at.asc())
        .all()
    )
    return logs
