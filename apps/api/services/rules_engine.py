"""
Credit decisioning rules engine.

Implements the Consolidated Financial Ratios spec:
  - 5 core metrics (all industries), weighted → Company Score (0–2)
  - 5 industry-specific metrics for one of 5 tracks → Industry Score (0–2)
  - Final Score = 0.6 * Company + 0.4 * Industry
  - Loan-amount decision table maps Final → approve / human review / reject
  - Hard-stop overrides (DSCR, LTV, bankruptcies) short-circuit the flow
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Callable, Optional

from models import Application, DecisionOutcome


# ── Industry → spec track mapping ────────────────────────────────────────────
INDUSTRY_TRACK: dict[str, str] = {
    "saas": "tech",
    "technology": "tech",
    "software": "tech",
    "healthcare": "healthcare",
    "retail": "retail",
    "hospitality": "hospitality",
    "restaurants": "hospitality",
    "food & beverage": "hospitality",
    "entertainment": "hospitality",
    "manufacturing": "industrials",
    "construction": "industrials",
    "real estate": "industrials",
    "transportation": "industrials",
}


def _track_for(industry: str) -> Optional[str]:
    key = industry.lower().strip()
    if key in INDUSTRY_TRACK:
        return INDUSTRY_TRACK[key]
    for k, v in INDUSTRY_TRACK.items():
        if k in key or key in k:
            return v
    return None


# ── Tier definitions ─────────────────────────────────────────────────────────
# Each metric defines thresholds returning a tier: 2 (approve), 1 (HR), 0 (concern), -1 (reject)
# direction "min" = higher is better; "max" = lower is better; or a custom callable.

Tier = int  # 2, 1, 0, or -1 (reject)


def _tier_min(value: float, approve: float, hr: float, concern: float) -> Tier:
    """Higher is better. approve >= hr >= concern; below concern → reject."""
    if value >= approve: return 2
    if value >= hr: return 1
    if value >= concern: return 0
    return -1


def _tier_max(value: float, approve: float, hr: float, concern: float) -> Tier:
    """Lower is better. approve <= hr <= concern; above concern → reject."""
    if value <= approve: return 2
    if value <= hr: return 1
    if value <= concern: return 0
    return -1


def _tier_min_3(value: float, approve: float, hr: float) -> Tier:
    """3-tier: approve / hr / reject (no concern band)."""
    if value >= approve: return 2
    if value >= hr: return 1
    return -1


def _tier_max_3(value: float, approve: float, hr: float) -> Tier:
    if value <= approve: return 2
    if value <= hr: return 1
    return -1


# ── Core metrics ─────────────────────────────────────────────────────────────
CORE_WEIGHTS = {
    "dscr": 0.30,
    "ltv": 0.25,
    "leverage": 0.20,
    "bankruptcies": 0.15,
    "time_in_business": 0.10,
}


def _score_dscr(v: float) -> Tier:
    return _tier_min(v, 1.50, 1.20, 1.00)


def _score_ltv(v: float) -> Tier:
    # v in percent (0–100+)
    return _tier_max(v, 65.0, 80.0, 100.0)


def _score_leverage(v: float) -> Tier:
    return _tier_max(v, 3.0, 4.5, 6.0)


def _score_bankruptcies(n: int) -> Tier:
    if n == 0: return 2
    if n == 1: return 1
    if n == 2: return 0
    return -1


def _score_time_in_business(years: float) -> Tier:
    if years >= 5: return 2
    if years >= 3: return 1
    if years >= 1: return 0
    return -1


# ── Industry-specific metric scorers ─────────────────────────────────────────
# Each entry: (metric_key, formula_label, scorer_fn)
INDUSTRY_METRICS: dict[str, list[tuple[str, str, Callable[[float], Tier]]]] = {
    "hospitality": [
        ("revpar", "RevPAR", lambda v: _tier_min(v, 150, 100, 80)),
        ("gop_per_room", "Gross Operating Profit / Room", lambda v: _tier_min_3(v, 60, 40)),
        ("occupancy_rate", "Occupancy Rate (%)", lambda v: _tier_min_3(v, 72, 60)),
        ("cap_rate", "Cap Rate (%)",
         lambda v: 2 if 6 <= v <= 9 else (1 if (5 <= v < 6) or (9 < v <= 11) else -1)),
        ("current_ratio", "Current Ratio", lambda v: _tier_min_3(v, 1.5, 1.0)),
    ],
    "tech": [
        ("revenue_growth_yoy", "Revenue Growth YoY (%)", lambda v: _tier_min(v, 40, 20, 5)),
        ("gross_margin", "Gross Margin (%)", lambda v: _tier_min(v, 75, 60, 40)),
        ("customer_concentration", "Customer Concentration (%)", lambda v: _tier_max_3(v, 15, 25)),
        ("burn_coverage_months", "Monthly Burn Coverage (months)", lambda v: _tier_min(v, 24, 12, 6)),
        ("nrr", "Net Revenue Retention (%)", lambda v: _tier_min(v, 120, 100, 85)),
    ],
    "retail": [
        ("sales_per_sqft", "Sales per Sq Ft ($)", lambda v: _tier_min_3(v, 500, 300)),
        ("gmroi", "GMROI", lambda v: _tier_min_3(v, 3.5, 2.0)),
        ("inventory_turnover", "Inventory Turnover (x/yr)", lambda v: _tier_min_3(v, 6, 3)),
        ("gross_margin", "Gross Margin (%)", lambda v: _tier_min_3(v, 45, 30)),
        ("same_store_sales_yoy", "Same-Store Sales Growth YoY (%)",
         lambda v: _tier_min(v, 5, 0, -5)),
    ],
    "healthcare": [
        ("operating_margin", "Operating Margin (%)", lambda v: _tier_min(v, 10, 3, 0)),
        ("days_cash_on_hand", "Days Cash on Hand", lambda v: _tier_min(v, 180, 140, 100)),
        ("days_in_ar", "Days in Accounts Receivable", lambda v: _tier_max(v, 40, 60, 9999)),
        ("payer_mix_gov", "Payer Mix Medicare/Medicaid (%)", lambda v: _tier_max(v, 40, 60, 100)),
        ("collection_rate", "Collection Rate (%)", lambda v: _tier_min_3(v, 95, 85)),
    ],
    "industrials": [
        ("asset_turnover", "Asset Turnover", lambda v: _tier_min_3(v, 1.2, 0.7)),
        ("interest_coverage", "Interest Coverage Ratio", lambda v: _tier_min(v, 4, 2.5, 1)),
        ("gross_margin", "Gross Margin (%)", lambda v: _tier_min_3(v, 30, 18)),
        ("ocf_margin", "Operating Cash Flow Margin (%)", lambda v: _tier_min_3(v, 12, 6)),
        ("backlog_to_revenue", "Backlog-to-Revenue Ratio", lambda v: _tier_min_3(v, 1.5, 1.0)),
    ],
}


# ── Loan-amount decision table ───────────────────────────────────────────────
# (min_amount, max_amount, approve_gte, hr_gte, reject_lt)
LOAN_BRACKETS: list[tuple[float, float, float, float]] = [
    # (upper_bound, approve_threshold, hr_lower_bound, (implicit reject < hr_lower_bound))
    (1_000_000, 1.80, 1.50),
    (2_000_000, 1.85, 1.65),
    (5_000_000, 1.90, 1.65),
]


def _bracket_for(amount: float) -> tuple[str, float, float]:
    """Clamp loan amount to nearest bracket; return (label, approve_threshold, hr_lower)."""
    if amount <= 1_000_000:
        return ("$500K–$1M", 1.80, 1.50)
    if amount <= 2_000_000:
        return ("$1M–$2M", 1.85, 1.65)
    return ("$2M–$5M", 1.90, 1.65)


# ── Result dataclasses ───────────────────────────────────────────────────────
@dataclass
class MetricResult:
    key: str
    label: str
    value: Optional[float]
    tier: Tier  # 2 | 1 | 0 | -1
    score: int  # 0..2 (reject mapped to 0 for scoring but tier=-1 flags reject)
    weight: Optional[float] = None  # for core metrics only

    @property
    def tier_label(self) -> str:
        return {2: "approve", 1: "human_review", 0: "concern", -1: "reject"}[self.tier]


@dataclass
class EngineResult:
    outcome: DecisionOutcome
    final_score: float
    company_score: float
    industry_score: Optional[float]
    industry_track: Optional[str]
    loan_bracket: str
    approve_threshold: float
    hr_lower_threshold: float
    core_metrics: list[MetricResult] = field(default_factory=list)
    industry_metrics: list[MetricResult] = field(default_factory=list)
    hard_stops: list[str] = field(default_factory=list)
    caps: list[str] = field(default_factory=list)  # caps decision at HR (no auto-approve)
    rationale: dict = field(default_factory=dict)

    def to_dict(self) -> dict:
        return {
            "outcome": self.outcome.value,
            "final_score": self.final_score,
            "company_score": self.company_score,
            "industry_score": self.industry_score,
            "industry_track": self.industry_track,
            "loan_bracket": self.loan_bracket,
            "approve_threshold": self.approve_threshold,
            "hr_lower_threshold": self.hr_lower_threshold,
            "core_metrics": [m.__dict__ for m in self.core_metrics],
            "industry_metrics": [m.__dict__ for m in self.industry_metrics],
            "hard_stops": self.hard_stops,
            "caps": self.caps,
            "summary": self.rationale.get("summary", ""),
        }


# ── Helpers ──────────────────────────────────────────────────────────────────
def _safe_div(a: Optional[float], b: Optional[float]) -> Optional[float]:
    if a is None or b is None or b == 0:
        return None
    return a / b


def _compute_core_values(app: Application) -> dict[str, Optional[float]]:
    annual_debt_service = app.annual_debt_service or (app.existing_debt * 0.15 if app.existing_debt else None)
    dscr = _safe_div(app.ebitda, annual_debt_service)

    # LTV uses collateral_value; fallback to total_assets if missing (common proxy)
    collateral = app.collateral_value if app.collateral_value else app.total_assets
    ltv = (app.loan_amount / collateral * 100.0) if collateral else None

    # Leverage Ratio = Total Debt / EBITDA (standard definition)
    leverage = _safe_div(app.existing_debt, app.ebitda) if app.ebitda and app.ebitda > 0 else None

    return {
        "dscr": dscr,
        "ltv": ltv,
        "leverage": leverage,
        "bankruptcies": float(app.bankruptcies_last_7y or 0),
        "time_in_business": float(app.borrower.years_in_operation),
    }


# ── Main entry point ─────────────────────────────────────────────────────────
def evaluate(app: Application) -> EngineResult:
    # 1. Compute core metric values
    core_values = _compute_core_values(app)

    core_scorers: list[tuple[str, str, Callable]] = [
        ("dscr", "DSCR (EBITDA / Annual Debt Service)", _score_dscr),
        ("ltv", "Loan-to-Value (%)", _score_ltv),
        ("leverage", "Leverage Ratio (Debt / EBITDA)", _score_leverage),
        ("bankruptcies", "Bankruptcies (last 7 years)", _score_bankruptcies),
        ("time_in_business", "Time in Business (years)", _score_time_in_business),
    ]

    core_results: list[MetricResult] = []
    hard_stops: list[str] = []
    caps: list[str] = []

    for key, label, scorer in core_scorers:
        val = core_values[key]
        if val is None:
            # Missing required core metric → hard stop to HR (can't auto-decide safely)
            core_results.append(MetricResult(key, label, None, 0, 0, CORE_WEIGHTS[key]))
            caps.append(f"Missing {label} — cannot auto-approve")
            continue
        tier = scorer(int(val) if key == "bankruptcies" else val)
        score = max(tier, 0)  # reject tier contributes 0 to weighted score
        core_results.append(MetricResult(key, label, val, tier, score, CORE_WEIGHTS[key]))

        if tier == -1:
            hard_stops.append(f"{label} in reject tier (value={val:.2f})")

    # Spec overrides
    dscr_val = core_values["dscr"]
    if dscr_val is not None and 1.00 <= dscr_val < 1.20:
        caps.append(f"DSCR {dscr_val:.2f} is below 1.20 — capped at Human Review")
    ltv_val = core_values["ltv"]
    if ltv_val is not None and 90.0 < ltv_val <= 100.0:
        caps.append(f"LTV {ltv_val:.1f}% exceeds 90% — cannot auto-approve")
    if (app.bankruptcies_last_7y or 0) >= 1 and (app.bankruptcies_last_7y or 0) <= 2:
        caps.append(f"{app.bankruptcies_last_7y} prior bankruptcy — capped at Human Review")

    # 2. Company Score (weighted sum on 0–2 scale)
    company_score = sum(m.score * (m.weight or 0) for m in core_results)

    # 3. Industry Score
    track = _track_for(app.borrower.industry)
    industry_results: list[MetricResult] = []
    industry_score: Optional[float] = None

    if track is None:
        caps.append(f"Industry '{app.borrower.industry}' has no defined track — capped at Human Review")
    else:
        spec = INDUSTRY_METRICS[track]
        scores: list[int] = []
        provided = app.industry_metrics or {}
        for key, label, scorer in spec:
            val = provided.get(key)
            if val is None:
                industry_results.append(MetricResult(key, label, None, 0, 0))
                caps.append(f"Missing industry metric '{label}' — capped at Human Review")
                continue
            tier = scorer(float(val))
            score = max(tier, 0)
            industry_results.append(MetricResult(key, label, float(val), tier, score))
            scores.append(score)
            if tier == -1:
                hard_stops.append(f"{label} in reject tier (value={val})")
        if scores:
            # Normalize to 0–2 scale: mean of per-metric scores (each 0–2)
            industry_score = sum(scores) / len(scores)

    # 4. Final Score
    if industry_score is not None:
        final_score = 0.6 * company_score + 0.4 * industry_score
    else:
        # Fall back to company score alone, capped at HR
        final_score = company_score

    # 5. Decision mapping
    bracket_label, approve_thr, hr_lower = _bracket_for(app.loan_amount)

    if hard_stops:
        outcome = DecisionOutcome.declined
    elif final_score < hr_lower:
        outcome = DecisionOutcome.declined
    elif final_score >= approve_thr and not caps:
        outcome = DecisionOutcome.approved
    else:
        outcome = DecisionOutcome.manual_review

    if outcome == DecisionOutcome.approved:
        summary = (
            f"Approved. Final score {final_score:.2f} ≥ {approve_thr} (bracket {bracket_label})."
        )
    elif outcome == DecisionOutcome.manual_review:
        summary = (
            f"Human review. Final score {final_score:.2f} in [{hr_lower}, {approve_thr}) "
            f"for bracket {bracket_label}."
            + (f" Caps: {'; '.join(caps)}." if caps else "")
        )
    else:
        reason = (
            "; ".join(hard_stops) if hard_stops
            else f"final score {final_score:.2f} below {hr_lower}"
        )
        summary = f"Declined. {reason}."

    rationale = {
        "summary": summary,
        "company_score": company_score,
        "industry_score": industry_score,
        "final_score": final_score,
        "industry_track": track,
        "loan_bracket": bracket_label,
        "approve_threshold": approve_thr,
        "hr_lower_threshold": hr_lower,
        "hard_stops": hard_stops,
        "caps": caps,
    }

    return EngineResult(
        outcome=outcome,
        final_score=final_score,
        company_score=company_score,
        industry_score=industry_score,
        industry_track=track,
        loan_bracket=bracket_label,
        approve_threshold=approve_thr,
        hr_lower_threshold=hr_lower,
        core_metrics=core_results,
        industry_metrics=industry_results,
        hard_stops=hard_stops,
        caps=caps,
        rationale=rationale,
    )
