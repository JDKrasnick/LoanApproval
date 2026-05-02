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


def _triggered_rules_payload(result: rules_engine.EngineResult) -> list[dict]:
    payload = []
    for m in result.core_metrics:
        payload.append({
            "category": "core",
            "rule": m.label,
            "key": m.key,
            "value": m.value,
            "tier": m.tier,
            "tier_label": m.tier_label,
            "score": m.score,
            "weight": m.weight,
        })
    for m in result.industry_metrics:
        payload.append({
            "category": "industry",
            "rule": m.label,
            "key": m.key,
            "value": m.value,
            "tier": m.tier,
            "tier_label": m.tier_label,
            "score": m.score,
        })
    return payload


@router.post("/evaluate/{application_id}", response_model=DecisionOut)
async def evaluate_application(application_id: uuid.UUID, db: Session = Depends(get_db)):
    app = (
        db.query(Application)
        .options(joinedload(Application.borrower))
        .filter(Application.id == application_id)
        .first()
    )
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    result = rules_engine.evaluate(app)
    triggered = _triggered_rules_payload(result)

    # Always generate a plain-English explanation so applicants see why.
    explanation, model_used = await explain_decision(
        outcome=result.outcome.value,
        final_score=result.final_score,
        company_score=result.company_score,
        industry_score=result.industry_score,
        industry_track=result.industry_track,
        loan_bracket=result.loan_bracket,
        approve_threshold=result.approve_threshold,
        hr_lower_threshold=result.hr_lower_threshold,
        loan_amount=app.loan_amount,
        industry=app.borrower.industry,
        core_metrics=[m.__dict__ for m in result.core_metrics],
        industry_metrics=[m.__dict__ for m in result.industry_metrics],
        hard_stops=result.hard_stops,
        caps=result.caps,
    )
    rationale = dict(result.rationale)
    rationale["explanation"] = explanation
    rationale["model_used"] = model_used

    existing = db.query(Decision).filter(Decision.application_id == application_id).first()
    if existing:
        existing.outcome = result.outcome
        existing.rationale = rationale
        existing.score = result.final_score
        existing.triggered_rules = triggered
        decision = existing
    else:
        decision = Decision(
            application_id=application_id,
            outcome=result.outcome,
            rationale=rationale,
            score=result.final_score,
            triggered_rules=triggered,
        )
        db.add(decision)

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
            "final_score": result.final_score,
            "company_score": result.company_score,
            "industry_score": result.industry_score,
            "industry_track": result.industry_track,
            "loan_bracket": result.loan_bracket,
            "hard_stops": result.hard_stops,
            "caps": result.caps,
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
    triggered = list(decision.triggered_rules or [])
    core = [r for r in triggered if r.get("category") == "core"]
    industry = [r for r in triggered if r.get("category") == "industry"]

    explanation, model_used = await explain_decision(
        outcome=decision.outcome.value,
        final_score=decision.score or 0.0,
        company_score=rationale.get("company_score", 0.0),
        industry_score=rationale.get("industry_score"),
        industry_track=rationale.get("industry_track"),
        loan_bracket=rationale.get("loan_bracket", ""),
        approve_threshold=rationale.get("approve_threshold", 0.0),
        hr_lower_threshold=rationale.get("hr_lower_threshold", 0.0),
        loan_amount=app.loan_amount,
        industry=app.borrower.industry,
        core_metrics=core,
        industry_metrics=industry,
        hard_stops=rationale.get("hard_stops", []),
        caps=rationale.get("caps", []),
    )

    rationale["explanation"] = explanation
    rationale["model_used"] = model_used
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
