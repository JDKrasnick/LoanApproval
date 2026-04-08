from __future__ import annotations
import uuid
from datetime import datetime
from typing import Any, Optional
from pydantic import BaseModel, Field, field_validator

from models import ApplicationStatus, DecisionOutcome, DocumentType


# ── Borrower ──────────────────────────────────────────────────────────────────

class BorrowerCreate(BaseModel):
    company_name: str
    dba_name: Optional[str] = None
    industry: str
    business_structure: str
    years_in_operation: int = Field(ge=1)
    ein: Optional[str] = None
    address_street: Optional[str] = None
    address_city: Optional[str] = None
    address_state: Optional[str] = None
    address_zip: Optional[str] = None


class BorrowerOut(BorrowerCreate):
    id: uuid.UUID
    created_at: datetime

    class Config:
        from_attributes = True


# ── Application ───────────────────────────────────────────────────────────────

class ApplicationCreate(BaseModel):
    borrower: BorrowerCreate
    loan_amount: float = Field(gt=0)
    loan_purpose: str
    loan_purpose_details: Optional[str] = None
    loan_term_months: int = Field(ge=1)
    annual_revenue: float = Field(ge=0)
    ebitda: float
    existing_debt: float = Field(ge=0)
    total_assets: float = Field(ge=0)
    current_assets: Optional[float] = None
    current_liabilities: Optional[float] = None
    interest_expense: Optional[float] = None
    annual_debt_service: Optional[float] = None
    ebit: Optional[float] = None


class ApplicationStatusUpdate(BaseModel):
    status: ApplicationStatus


class ApplicationOut(BaseModel):
    id: uuid.UUID
    borrower_id: uuid.UUID
    loan_amount: float
    loan_purpose: str
    loan_purpose_details: Optional[str]
    loan_term_months: int
    annual_revenue: float
    ebitda: float
    existing_debt: float
    total_assets: float
    current_assets: Optional[float]
    current_liabilities: Optional[float]
    interest_expense: Optional[float]
    annual_debt_service: Optional[float]
    ebit: Optional[float]
    status: ApplicationStatus
    submitted_at: datetime
    updated_at: datetime
    borrower: Optional[BorrowerOut] = None

    class Config:
        from_attributes = True


class ApplicationListItem(BaseModel):
    id: uuid.UUID
    borrower_id: uuid.UUID
    company_name: str
    industry: str
    loan_amount: float
    loan_term_months: int
    status: ApplicationStatus
    submitted_at: datetime

    class Config:
        from_attributes = True


class ApplicationListResponse(BaseModel):
    items: list[ApplicationListItem]
    total: int
    page: int
    page_size: int


# ── Document ──────────────────────────────────────────────────────────────────

class DocumentOut(BaseModel):
    id: uuid.UUID
    application_id: uuid.UUID
    document_type: DocumentType
    filename: str
    file_size_bytes: Optional[int]
    supabase_storage_path: Optional[str]
    uploaded_at: datetime

    class Config:
        from_attributes = True


# ── Decision ──────────────────────────────────────────────────────────────────

class RuleResult(BaseModel):
    rule: str
    formula: str
    value: Optional[float]
    threshold: float
    passed: bool
    severity: str  # "hard_decline" | "caution" | "pass"


class DecisionOut(BaseModel):
    id: uuid.UUID
    application_id: uuid.UUID
    outcome: DecisionOutcome
    rationale: dict[str, Any]
    score: Optional[float]
    ml_default_probability: Optional[float]
    triggered_rules: list[Any]
    decided_at: datetime

    class Config:
        from_attributes = True


# ── ML ────────────────────────────────────────────────────────────────────────

class MLScoreResponse(BaseModel):
    application_id: uuid.UUID
    default_probability: float
    model_version: str


# ── LLM ──────────────────────────────────────────────────────────────────────

class ExtractedFields(BaseModel):
    annual_revenue: Optional[float] = None
    ebitda: Optional[float] = None
    existing_debt: Optional[float] = None
    total_assets: Optional[float] = None
    current_assets: Optional[float] = None
    current_liabilities: Optional[float] = None
    interest_expense: Optional[float] = None
    ebit: Optional[float] = None
    raw_text_preview: Optional[str] = None


class LLMExtractionOut(BaseModel):
    id: uuid.UUID
    document_id: uuid.UUID
    extracted_fields: dict[str, Any]
    model_used: Optional[str]
    confidence_scores: dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True


# ── Audit ─────────────────────────────────────────────────────────────────────

class AuditLogOut(BaseModel):
    id: uuid.UUID
    application_id: uuid.UUID
    event_type: str
    payload: dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True
