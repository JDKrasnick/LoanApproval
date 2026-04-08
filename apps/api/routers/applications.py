from __future__ import annotations

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_
from sqlalchemy.orm import Session, joinedload

from database import get_db
from models import Application, ApplicationStatus, Borrower
from schemas import (
    ApplicationCreate,
    ApplicationListItem,
    ApplicationListResponse,
    ApplicationOut,
    ApplicationStatusUpdate,
)
from services.audit import log_event

router = APIRouter(prefix="/applications", tags=["applications"])


@router.post("", response_model=ApplicationOut, status_code=201)
def create_application(body: ApplicationCreate, db: Session = Depends(get_db)):
    borrower = Borrower(**body.borrower.model_dump())
    db.add(borrower)
    db.flush()

    app_data = body.model_dump(exclude={"borrower"})
    application = Application(borrower_id=borrower.id, **app_data)
    db.add(application)
    db.flush()

    log_event(db, application.id, "application_submitted", {"loan_amount": body.loan_amount})
    db.commit()
    db.refresh(application)
    return application


@router.get("", response_model=ApplicationListResponse)
def list_applications(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    status: Optional[ApplicationStatus] = None,
    industry: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: str = Query("submitted_at", regex="^(submitted_at|loan_amount|status)$"),
    sort_dir: str = Query("desc", regex="^(asc|desc)$"),
    db: Session = Depends(get_db),
):
    q = (
        db.query(Application)
        .join(Borrower)
        .options(joinedload(Application.borrower))
    )

    if status:
        q = q.filter(Application.status == status)
    if industry:
        q = q.filter(Borrower.industry.ilike(f"%{industry}%"))
    if search:
        q = q.filter(
            or_(
                Borrower.company_name.ilike(f"%{search}%"),
                Borrower.dba_name.ilike(f"%{search}%"),
            )
        )

    total = q.count()

    sort_col = getattr(Application, sort_by, Application.submitted_at)
    if sort_dir == "desc":
        q = q.order_by(sort_col.desc())
    else:
        q = q.order_by(sort_col.asc())

    items = q.offset((page - 1) * page_size).limit(page_size).all()

    return ApplicationListResponse(
        items=[
            ApplicationListItem(
                id=a.id,
                borrower_id=a.borrower_id,
                company_name=a.borrower.company_name,
                industry=a.borrower.industry,
                loan_amount=a.loan_amount,
                loan_term_months=a.loan_term_months,
                status=a.status,
                submitted_at=a.submitted_at,
            )
            for a in items
        ],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{application_id}", response_model=ApplicationOut)
def get_application(application_id: uuid.UUID, db: Session = Depends(get_db)):
    app = (
        db.query(Application)
        .options(joinedload(Application.borrower))
        .filter(Application.id == application_id)
        .first()
    )
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    return app


@router.patch("/{application_id}/status", response_model=ApplicationOut)
def update_status(
    application_id: uuid.UUID,
    body: ApplicationStatusUpdate,
    db: Session = Depends(get_db),
):
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    old_status = app.status
    app.status = body.status
    log_event(
        db,
        application_id,
        "status_changed",
        {"from": old_status.value, "to": body.status.value},
    )
    db.commit()
    db.refresh(app)
    return app
