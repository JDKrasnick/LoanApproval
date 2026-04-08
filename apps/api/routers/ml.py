from __future__ import annotations

import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from database import get_db
from models import Application, Decision
from schemas import MLScoreResponse
from services.audit import log_event

router = APIRouter(prefix="/ml", tags=["ml"])

_model = None
_model_version = "unloaded"


def _load_model():
    global _model, _model_version
    model_path = Path(__file__).parent.parent.parent.parent / "ml" / "model.pkl"
    if model_path.exists():
        import joblib
        _model = joblib.load(model_path)
        _model_version = "v1.0"
    else:
        _model = None
        _model_version = "stub"


def _extract_features(app: Application) -> list[float]:
    """Extract model features from application. Must match training feature order."""
    equity = app.total_assets - app.existing_debt
    dte = app.existing_debt / equity if equity > 0 else 0
    annual_debt_service = app.annual_debt_service or (app.existing_debt * 0.15)
    dscr = app.ebitda / annual_debt_service if annual_debt_service > 0 else 0
    revenue_to_loan = app.annual_revenue / app.loan_amount if app.loan_amount > 0 else 0
    return [
        app.loan_amount,
        app.loan_term_months,
        app.annual_revenue,
        app.ebitda,
        app.existing_debt,
        app.total_assets,
        dte,
        dscr,
        revenue_to_loan,
        app.borrower.years_in_operation,
    ]


@router.post("/score/{application_id}", response_model=MLScoreResponse)
def score_application(application_id: uuid.UUID, db: Session = Depends(get_db)):
    app = (
        db.query(Application)
        .options(joinedload(Application.borrower))
        .filter(Application.id == application_id)
        .first()
    )
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    if _model is None:
        _load_model()

    if _model is not None:
        import numpy as np
        features = np.array([_extract_features(app)])
        prob = float(_model.predict_proba(features)[0][1])
    else:
        # Stub: derive a rough probability from rules-engine score proxy
        equity = app.total_assets - app.existing_debt
        dte = app.existing_debt / equity if equity > 0 else 0
        annual_debt_service = app.annual_debt_service or (app.existing_debt * 0.15)
        dscr = app.ebitda / annual_debt_service if annual_debt_service > 0 else 0
        # Heuristic: higher D/E and lower DSCR = higher default probability
        prob = min(0.95, max(0.02, 0.5 - (dscr - 1.2) * 0.15 + (dte - 2) * 0.05))

    # Store on decision if it exists
    decision = db.query(Decision).filter(Decision.application_id == application_id).first()
    if decision:
        decision.ml_default_probability = prob
        db.flush()

    log_event(
        db,
        application_id,
        "ml_scored",
        {"default_probability": prob, "model_version": _model_version},
    )
    db.commit()

    return MLScoreResponse(
        application_id=application_id,
        default_probability=prob,
        model_version=_model_version,
    )
