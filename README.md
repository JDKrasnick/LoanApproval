# LoanApproval — Cornell Fintech Club Spring 2026

Full-stack fintech lending platform covering the complete loan lifecycle.

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 14 (App Router) + Tailwind CSS |
| Backend | FastAPI (Python) |
| Database | PostgreSQL (local) / Supabase (prod) |
| ML | scikit-learn — logistic regression + gradient boosting |
| LLM | OpenAI / Anthropic (swappable via env var) |
| Storage | Supabase Storage |

## Quick Start (Local)

```bash
# 1. Copy env
cp .env.example .env

# 2. Start Postgres
docker compose up db -d

# 3. Backend
cd apps/api
pip3 install -r requirements.txt
uvicorn main:app --reload
# → http://localhost:8000/docs

# 4. Frontend (new terminal)
cd apps/web
npm install
npm run dev
# → http://localhost:3000

# 5. Train ML model (optional)
cd ml
pip3 install -r requirements.txt
python3 train.py              # synthetic data
python3 train.py --data lending_club.csv  # real data
```

## Project Structure

```
LoanApproval/
├── apps/
│   ├── api/                 # FastAPI backend
│   │   ├── main.py          # App entry point + CORS
│   │   ├── models.py        # SQLAlchemy ORM
│   │   ├── schemas.py       # Pydantic request/response models
│   │   ├── routers/         # API route handlers
│   │   │   ├── applications.py
│   │   │   ├── decisions.py
│   │   │   ├── documents.py
│   │   │   ├── ml.py
│   │   │   ├── llm.py
│   │   │   └── audit.py
│   │   ├── services/
│   │   │   ├── rules_engine.py   # Credit decisioning logic
│   │   │   └── audit.py          # Immutable audit log helper
│   │   └── llm/
│   │       ├── client.py         # OpenAI / Anthropic abstraction
│   │       └── prompts/          # Prompt templates
│   └── web/                 # Next.js 14 frontend
│       └── src/
│           ├── app/         # App Router pages
│           ├── components/  # Shared + feature components
│           ├── lib/         # API client, utils
│           └── types/       # TypeScript types
└── ml/
    ├── train.py             # Training script (LendingClub or synthetic)
    └── model.pkl            # Trained model artifact (git-ignored)
```

## API Reference

Interactive docs at `http://localhost:8000/docs`

| Method | Path | Description |
|--------|------|-------------|
| POST | `/applications` | Submit new loan application |
| GET | `/applications` | List all (filterable, sortable, paginated) |
| GET | `/applications/{id}` | Get application detail |
| PATCH | `/applications/{id}/status` | Update pipeline status |
| POST | `/decisions/evaluate/{id}` | Run credit rules engine |
| GET | `/decisions/{id}` | Fetch decision + rationale |
| POST | `/documents/upload` | Upload supporting documents |
| GET | `/documents/{id}` | List docs for application |
| POST | `/ml/score/{id}` | ML default probability score |
| POST | `/llm/extract/{doc_id}` | LLM financial document extraction |
| GET | `/audit/{id}` | Full immutable audit log |

## Rules Engine

Configured thresholds by borrower type (startup / SMB / established):

| Ratio | Formula | Threshold |
|-------|---------|-----------|
| Debt-to-Equity | `debt / (assets - debt)` | > 3.0 → hard decline |
| DSCR | `ebitda / annual_debt_service` | < 1.2 → hard decline |
| Current Ratio | `current_assets / current_liabilities` | < 1.0 |
| Interest Coverage | `ebit / interest_expense` | < 2.0 |

Industry risk tiers apply a multiplier to the final score (SaaS = 0.9x, hospitality = 1.4x).

**Outcomes:** `APPROVED` · `DECLINED` · `MANUAL_REVIEW`

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `SUPABASE_URL` | Supabase project URL (optional) |
| `SUPABASE_SERVICE_KEY` | Supabase service role key (optional) |
| `LLM_PROVIDER` | `openai` or `anthropic` |
| `OPENAI_API_KEY` | OpenAI API key |
| `ANTHROPIC_API_KEY` | Anthropic API key |
| `NEXT_PUBLIC_API_URL` | Backend URL for frontend |
