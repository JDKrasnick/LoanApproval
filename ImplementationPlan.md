Implementation Plan
Monorepo Structure

LoanApproval/
├── apps/
│   ├── web/                    # Next.js 14 (App Router)
│   └── api/                    # FastAPI
├── packages/
│   └── shared-types/           # Shared TS types (optional)
├── ml/                         # scikit-learn model + training scripts
└── docker-compose.yml          # Postgres local dev
Database Schema (PostgreSQL via Supabase)
borrowers — company identity


id, company_name, industry, business_structure,
years_in_operation, created_at
applications — one per loan request


id, borrower_id, loan_amount, loan_purpose, loan_term_months,
annual_revenue, ebitda, existing_debt, total_assets,
status (new|in_review|approved|declined|funded),
submitted_at, updated_at
documents — uploaded files


id, application_id, document_type (financial_statement|tax_return|collateral),
supabase_storage_path, filename, uploaded_at
decisions — engine output


id, application_id, outcome (approved|declined|manual_review),
rationale (jsonb), score, ml_default_probability,
decided_at, triggered_rules (jsonb)
audit_log — immutable event trail


id, application_id, event_type, payload (jsonb), created_at
llm_extractions — parsed document data (LLM stretch)


id, document_id, extracted_fields (jsonb), model_used,
confidence_scores (jsonb), created_at
API Routes (FastAPI)
Applications

POST /applications — create new
GET /applications — list all (dashboard, with filter/sort params)
GET /applications/{id} — detail + financial data
PATCH /applications/{id}/status — underwriter updates pipeline stage
Decisions

POST /decisions/evaluate/{application_id} — run rules engine
GET /decisions/{application_id} — fetch result + rationale
Documents

POST /documents/upload — multipart, stores to Supabase Storage
GET /documents/{application_id} — list docs for an application
ML

POST /ml/score/{application_id} — run model, returns default_probability
LLM

POST /llm/extract/{document_id} — parse PDF, return structured fields
Infrastructure only at first; full parser is stretch
Audit

GET /audit/{application_id} — full event log
Frontend Routes (Next.js App Router)

app/
├── page.tsx                        # Landing / role selector (Borrower | Underwriter)
├── apply/
│   ├── page.tsx                    # Step 1: Business profile
│   ├── loan/page.tsx               # Step 2: Loan details
│   ├── financials/page.tsx         # Step 3: Financial data
│   ├── documents/page.tsx          # Step 4: Document upload
│   └── review/page.tsx             # Step 5: Review + submit
├── status/[id]/page.tsx            # Borrower status tracker (polls /applications/{id})
└── dashboard/
    ├── page.tsx                    # Pipeline table + portfolio metrics
    └── applications/[id]/page.tsx  # Borrower detail + decision summary
Rules Engine Logic (FastAPI service)
Configurable thresholds per borrower type (SMB / Startup / Established):

Ratio	Formula	Hard decline threshold
Debt-to-Equity	existing_debt / (assets - debt)	> 3.0
DSCR	ebitda / annual_debt_service	< 1.2
Current Ratio	current_assets / current_liabilities	< 1.0
Interest Coverage	ebit / interest_expense	< 2.0
Output logic:

Any hard-fail → DECLINED
All pass, score ≥ threshold → APPROVED
Gray zone → MANUAL_REVIEW
Industry risk tiers feed a multiplier into the score (e.g., SaaS = 0.9x risk, hospitality = 1.4x).

ML Module (ml/)
Dataset: LendingClub (Kaggle)
Pipeline: pandas cleaning → feature engineering (financial ratios) → logistic regression + gradient boosting → AUC-ROC eval
Output: default_probability float stored on decisions.ml_default_probability
Integration: rules engine can optionally gate or weight by ML score
Artifacts: ml/model.pkl loaded by FastAPI at startup
LLM Infrastructure (apps/api/llm/)
Abstraction layer: LLMClient wrapping OpenAI/Anthropic — swappable via env var LLM_PROVIDER
extract_financials(pdf_text) -> ExtractedFields — structured output with Pydantic
Stores results in llm_extractions, surfaced in the apply form to pre-fill Step 3
Prompt templates versioned in apps/api/llm/prompts/
Build Order
DB schema + Supabase setup — migrations first, everything depends on this
FastAPI skeleton — health check, Supabase client, Pydantic models
Borrower Portal — multi-step form, doc upload, submit → status page
Rules engine — ratio calculations, decision endpoint, audit logging
Lender Dashboard — pipeline table, detail view, status actions, Recharts metrics
ML module — training script, model serving endpoint
LLM infrastructure — client abstraction, extraction endpoint, form pre-fill
Key Deployment Notes (for later)
Frontend → Vercel, set NEXT_PUBLIC_API_URL env var
Backend → Railway or Fly.io (Dockerfile in apps/api/)
Supabase handles both DB and Storage in prod — no config change needed
ml/model.pkl needs to ship with the API container
One thing worth flagging: the spec has the rules engine treating financial inputs as raw user-entered numbers (revenue, EBITDA, etc.) — without an LLM parser those are self-reported and unverified. That's fine for the demo, but worth noting if you want the ML model to reflect realistic data quality.