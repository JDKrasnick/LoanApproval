import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Integer, Float, DateTime, ForeignKey, Enum, Text
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import enum

from database import Base


def utcnow():
    return datetime.now(timezone.utc)


class ApplicationStatus(str, enum.Enum):
    new = "new"
    in_review = "in_review"
    approved = "approved"
    declined = "declined"
    funded = "funded"


class DecisionOutcome(str, enum.Enum):
    approved = "approved"
    declined = "declined"
    manual_review = "manual_review"


class DocumentType(str, enum.Enum):
    financial_statement = "financial_statement"
    tax_return = "tax_return"
    bank_statement = "bank_statement"
    ar_aging = "ar_aging"
    collateral = "collateral"


class Borrower(Base):
    __tablename__ = "borrowers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_name = Column(String(255), nullable=False)
    dba_name = Column(String(255))
    industry = Column(String(100), nullable=False)
    business_structure = Column(String(50), nullable=False)
    years_in_operation = Column(Integer, nullable=False)
    ein = Column(String(20))
    address_street = Column(String(255))
    address_city = Column(String(100))
    address_state = Column(String(2))
    address_zip = Column(String(10))
    created_at = Column(DateTime(timezone=True), default=utcnow)

    applications = relationship("Application", back_populates="borrower")


class Application(Base):
    __tablename__ = "applications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    borrower_id = Column(UUID(as_uuid=True), ForeignKey("borrowers.id"), nullable=False)
    loan_amount = Column(Float, nullable=False)
    loan_purpose = Column(String(100), nullable=False)
    loan_purpose_details = Column(Text)
    loan_term_months = Column(Integer, nullable=False)
    annual_revenue = Column(Float, nullable=False)
    ebitda = Column(Float, nullable=False)
    existing_debt = Column(Float, nullable=False)
    total_assets = Column(Float, nullable=False)
    current_assets = Column(Float)
    current_liabilities = Column(Float)
    interest_expense = Column(Float)
    annual_debt_service = Column(Float)
    ebit = Column(Float)
    collateral_value = Column(Float)
    bankruptcies_last_7y = Column(Integer, default=0, nullable=False)
    industry_metrics = Column(JSONB, default=dict, nullable=False)
    status = Column(
        Enum(ApplicationStatus),
        default=ApplicationStatus.new,
        nullable=False,
    )
    submitted_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    borrower = relationship("Borrower", back_populates="applications")
    documents = relationship("Document", back_populates="application")
    decision = relationship("Decision", back_populates="application", uselist=False)
    audit_logs = relationship("AuditLog", back_populates="application")


class Document(Base):
    __tablename__ = "documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    application_id = Column(UUID(as_uuid=True), ForeignKey("applications.id"), nullable=False)
    document_type = Column(Enum(DocumentType), nullable=False)
    supabase_storage_path = Column(String(512))
    filename = Column(String(255), nullable=False)
    file_size_bytes = Column(Integer)
    uploaded_at = Column(DateTime(timezone=True), default=utcnow)

    application = relationship("Application", back_populates="documents")
    llm_extraction = relationship("LLMExtraction", back_populates="document", uselist=False)


class Decision(Base):
    __tablename__ = "decisions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    application_id = Column(UUID(as_uuid=True), ForeignKey("applications.id"), nullable=False, unique=True)
    outcome = Column(Enum(DecisionOutcome), nullable=False)
    rationale = Column(JSONB, nullable=False, default=dict)
    score = Column(Float)
    ml_default_probability = Column(Float)
    triggered_rules = Column(JSONB, nullable=False, default=list)
    decided_at = Column(DateTime(timezone=True), default=utcnow)

    application = relationship("Application", back_populates="decision")


class AuditLog(Base):
    __tablename__ = "audit_log"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    application_id = Column(UUID(as_uuid=True), ForeignKey("applications.id"), nullable=False)
    event_type = Column(String(100), nullable=False)
    payload = Column(JSONB, nullable=False, default=dict)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    application = relationship("Application", back_populates="audit_logs")


class LLMExtraction(Base):
    __tablename__ = "llm_extractions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id"), nullable=False, unique=True)
    extracted_fields = Column(JSONB, nullable=False, default=dict)
    model_used = Column(String(100))
    confidence_scores = Column(JSONB, nullable=False, default=dict)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    document = relationship("Document", back_populates="llm_extraction")
