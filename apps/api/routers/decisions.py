from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from database import get_db
from models import Application, Decision, ApplicationStatus
from schemas import DecisionOut
from services import rules_engine
from services.audit import log_event
from llm.client import explain_decision

router = APIRouter(prefix="/decisions", tags=["decisions"])


@router.post("/evaluate/{application_id}", response_model=DecisionOut)
def evaluate_application(application_id: uuid.UUID, db: Session = Depends(get_db)):
    app = (
        db.query(Application)
        .options(joinedload(Application.borrower))
        .filter(Application.id == application_id)
        .first()
    )
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    result = rules_engine.evaluate(app)

    # Upsert decision
    existing = db.query(Decision).filter(Decision.application_id == application_id).first()
    if existing:
        existing.outcome = result.outcome
        existing.rationale = result.rationale
        existing.score = result.score
        existing.triggered_rules = [r.__dict__ for r in result.rules]
        decision = existing
    else:
        decision = Decision(
            application_id=application_id,
            outcome=result.outcome,
            rationale=result.rationale,
            score=result.score,
            triggered_rules=[r.__dict__ for r in result.rules],
        )
        db.add(decision)

    # Update application status based on decision
    status_map = {
        "approved": ApplicationStatus.approved,
        "declined": ApplicationStatus.declined,
        "manual_review": ApplicationStatus.in_review,
    }
    app.status = status_map[result.outcome.value]

    log_event(
        db,
        application_id,
        "decision_made",
        {
            "outcome": result.outcome.value,
            "score": result.score,
            "industry_multiplier": result.industry_multiplier,
            "borrower_type": result.borrower_type,
            "hard_fails": result.rationale.get("hard_fails", []),
            "cautions": result.rationale.get("cautions", []),
        },
    )
    db.commit()
    db.refresh(decision)
    return decision


@router.post("/explain/{application_id}", response_model=DecisionOut)
async def explain_application_decision(application_id: uuid.UUID, db: Session = Depends(get_db)):
    decision = db.query(Decision).filter(Decision.application_id == application_id).first()
    if not decision:
        raise HTTPException(status_code=404, detail="No decision found for this application")

    app = (
        db.query(Application)
        .options(joinedload(Application.borrower))
        .filter(Application.id == application_id)
        .first()
    )
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    rationale = dict(decision.rationale)
    triggered_rules = list(decision.triggered_rules or [])

    explanation, model_used = await explain_decision(
        outcome=decision.outcome.value,
        score=decision.score or 0.0,
        borrower_type=rationale.get("borrower_type", "unknown"),
        years_in_operation=app.borrower.years_in_operation,
        industry=app.borrower.industry,
        industry_multiplier=rationale.get("industry_multiplier", 1.0),
        loan_amount=app.loan_amount,
        triggered_rules=triggered_rules,
        hard_fails=rationale.get("hard_fails", []),
        cautions=rationale.get("cautions", []),
        passes=rationale.get("passes", []),
    )

    rationale["explanation"] = explanation
    decision.rationale = rationale

    log_event(db, application_id, "explanation_generated", {"model_used": model_used})
    db.commit()
    db.refresh(decision)
    return decision


@router.get("/{application_id}", response_model=DecisionOut)
def get_decision(application_id: uuid.UUID, db: Session = Depends(get_db)):
    decision = (
        db.query(Decision)
        .filter(Decision.application_id == application_id)
        .first()
    )
    if not decision:
        raise HTTPException(status_code=404, detail="No decision found for this application")
    return decision
