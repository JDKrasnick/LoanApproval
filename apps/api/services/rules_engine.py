"""
Credit decisioning rules engine.

Thresholds are configured per borrower type (SMB / Startup / Established).
Industry risk tiers apply a multiplier to the final score.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional

from models import Application, DecisionOutcome


# ── Industry risk multipliers ──────────────────────────────────────────────────
# Values < 1.0 = lower risk (score benefits), > 1.0 = higher risk (score penalized)
INDUSTRY_RISK_MULTIPLIERS: dict[str, float] = {
    "saas": 0.9,
    "technology": 0.9,
    "software": 0.9,
    "healthcare": 0.95,
    "financial services": 0.95,
    "professional services": 1.0,
    "manufacturing": 1.1,
    "retail": 1.2,
    "real estate": 1.15,
    "construction": 1.25,
    "restaurants": 1.35,
    "hospitality": 1.4,
    "food & beverage": 1.35,
    "entertainment": 1.3,
}
DEFAULT_INDUSTRY_MULTIPLIER = 1.1


# ── Threshold config by borrower type ────────────────────────────────────────
# "years_in_operation" determines type: < 3 = startup, 3–10 = smb, > 10 = established
THRESHOLDS: dict[str, dict[str, float]] = {
    "startup": {
        "debt_to_equity_max": 2.0,
        "dscr_min": 1.15,
        "current_ratio_min": 1.0,
        "interest_coverage_min": 1.5,
        "approval_score_min": 60.0,
    },
    "smb": {
        "debt_to_equity_max": 3.0,
        "dscr_min": 1.2,
        "current_ratio_min": 1.0,
        "interest_coverage_min": 2.0,
        "approval_score_min": 65.0,
    },
    "established": {
        "debt_to_equity_max": 4.0,
        "dscr_min": 1.1,
        "current_ratio_min": 0.9,
        "interest_coverage_min": 1.5,
        "approval_score_min": 60.0,
    },
}


@dataclass
class RuleResult:
    rule: str
    formula: str
    value: Optional[float]
    threshold: float
    passed: bool
    severity: str  # "hard_decline" | "caution" | "pass"
    direction: str  # "min" | "max"


@dataclass
class EngineResult:
    outcome: DecisionOutcome
    score: float
    industry_multiplier: float
    borrower_type: str
    rules: list[RuleResult] = field(default_factory=list)
    rationale: dict = field(default_factory=dict)

    def to_dict(self) -> dict:
        return {
            "outcome": self.outcome.value,
            "score": self.score,
            "industry_multiplier": self.industry_multiplier,
            "borrower_type": self.borrower_type,
            "rules": [
                {
                    "rule": r.rule,
                    "formula": r.formula,
                    "value": r.value,
                    "threshold": r.threshold,
                    "passed": r.passed,
                    "severity": r.severity,
                    "direction": r.direction,
                }
                for r in self.rules
            ],
            "summary": self.rationale.get("summary", ""),
        }


def _borrower_type(years: int) -> str:
    if years < 3:
        return "startup"
    if years <= 10:
        return "smb"
    return "established"


def _industry_multiplier(industry: str) -> float:
    key = industry.lower().strip()
    for k, v in INDUSTRY_RISK_MULTIPLIERS.items():
        if k in key or key in k:
            return v
    return DEFAULT_INDUSTRY_MULTIPLIER


def _safe_ratio(numerator: Optional[float], denominator: Optional[float]) -> Optional[float]:
    if numerator is None or denominator is None:
        return None
    if denominator == 0:
        return None
    return numerator / denominator


def evaluate(app: Application) -> EngineResult:
    years = app.borrower.years_in_operation
    btype = _borrower_type(years)
    thresholds = THRESHOLDS[btype]
    industry_mult = _industry_multiplier(app.borrower.industry)

    rules: list[RuleResult] = []
    hard_fails: list[str] = []
    cautions: list[str] = []

    # ── 1. Debt-to-Equity ────────────────────────────────────────────────────
    equity = app.total_assets - app.existing_debt
    dte = _safe_ratio(app.existing_debt, equity)
    dte_threshold = thresholds["debt_to_equity_max"]
    dte_passed = dte is not None and dte <= dte_threshold
    dte_severity = "pass" if dte_passed else ("hard_decline" if dte is not None and dte > dte_threshold * 1.5 else "caution")
    dte_rule = RuleResult(
        rule="Debt-to-Equity",
        formula="existing_debt / (total_assets - existing_debt)",
        value=dte,
        threshold=dte_threshold,
        passed=dte_passed,
        severity=dte_severity,
        direction="max",
    )
    rules.append(dte_rule)
    if not dte_passed:
        if dte_severity == "hard_decline":
            hard_fails.append("Debt-to-Equity exceeds hard limit")
        else:
            cautions.append("Debt-to-Equity elevated")

    # ── 2. DSCR ──────────────────────────────────────────────────────────────
    annual_debt_service = app.annual_debt_service or (app.existing_debt * 0.15)
    dscr = _safe_ratio(app.ebitda, annual_debt_service)
    dscr_threshold = thresholds["dscr_min"]
    dscr_passed = dscr is not None and dscr >= dscr_threshold
    dscr_severity = "pass" if dscr_passed else ("hard_decline" if dscr is not None and dscr < dscr_threshold * 0.8 else "caution")
    dscr_rule = RuleResult(
        rule="DSCR",
        formula="ebitda / annual_debt_service",
        value=dscr,
        threshold=dscr_threshold,
        passed=dscr_passed,
        severity=dscr_severity,
        direction="min",
    )
    rules.append(dscr_rule)
    if not dscr_passed:
        if dscr_severity == "hard_decline":
            hard_fails.append("DSCR below hard minimum")
        else:
            cautions.append("DSCR marginal")

    # ── 3. Current Ratio ─────────────────────────────────────────────────────
    if app.current_assets is not None and app.current_liabilities is not None:
        current_ratio = _safe_ratio(app.current_assets, app.current_liabilities)
        cr_threshold = thresholds["current_ratio_min"]
        cr_passed = current_ratio is not None and current_ratio >= cr_threshold
        cr_severity = "pass" if cr_passed else ("hard_decline" if current_ratio is not None and current_ratio < cr_threshold * 0.7 else "caution")
        cr_rule = RuleResult(
            rule="Current Ratio",
            formula="current_assets / current_liabilities",
            value=current_ratio,
            threshold=cr_threshold,
            passed=cr_passed,
            severity=cr_severity,
            direction="min",
        )
        rules.append(cr_rule)
        if not cr_passed:
            if cr_severity == "hard_decline":
                hard_fails.append("Current Ratio below hard minimum")
            else:
                cautions.append("Current Ratio low")

    # ── 4. Interest Coverage ─────────────────────────────────────────────────
    if app.ebit is not None and app.interest_expense is not None:
        ic = _safe_ratio(app.ebit, app.interest_expense)
        ic_threshold = thresholds["interest_coverage_min"]
        ic_passed = ic is not None and ic >= ic_threshold
        ic_severity = "pass" if ic_passed else ("hard_decline" if ic is not None and ic < ic_threshold * 0.6 else "caution")
        ic_rule = RuleResult(
            rule="Interest Coverage",
            formula="ebit / interest_expense",
            value=ic,
            threshold=ic_threshold,
            passed=ic_passed,
            severity=ic_severity,
            direction="min",
        )
        rules.append(ic_rule)
        if not ic_passed:
            if ic_severity == "hard_decline":
                hard_fails.append("Interest Coverage below hard minimum")
            else:
                cautions.append("Interest Coverage marginal")

    # ── Score calculation ─────────────────────────────────────────────────────
    # Base score: 100 points. Deduct for failed rules, apply industry multiplier.
    base_score = 100.0
    for rule in rules:
        if not rule.passed:
            if rule.severity == "hard_decline":
                base_score -= 30
            elif rule.severity == "caution":
                base_score -= 10

    # Adjust for revenue-to-loan ratio (larger buffer = safer)
    revenue_coverage = _safe_ratio(app.annual_revenue, app.loan_amount)
    if revenue_coverage is not None:
        if revenue_coverage >= 5:
            base_score += 5
        elif revenue_coverage < 1:
            base_score -= 15

    score = base_score / industry_mult
    score = max(0.0, min(100.0, score))

    # ── Determine outcome ─────────────────────────────────────────────────────
    if hard_fails:
        outcome = DecisionOutcome.declined
        summary = f"Hard decline triggered: {'; '.join(hard_fails)}"
    elif score >= thresholds["approval_score_min"] and not cautions:
        outcome = DecisionOutcome.approved
        summary = f"All rules passed. Score: {score:.1f}. Industry tier: {industry_mult:.2f}x."
    elif score >= thresholds["approval_score_min"] * 0.85:
        outcome = DecisionOutcome.manual_review
        summary = f"Marginal profile. Score: {score:.1f}. Cautions: {'; '.join(cautions) or 'none'}."
    else:
        outcome = DecisionOutcome.declined
        summary = f"Score below threshold ({score:.1f} < {thresholds['approval_score_min']}). Cautions: {'; '.join(cautions)}."

    rationale = {
        "summary": summary,
        "hard_fails": hard_fails,
        "cautions": cautions,
        "passes": [r.rule for r in rules if r.passed],
        "borrower_type": btype,
        "industry_multiplier": industry_mult,
    }

    return EngineResult(
        outcome=outcome,
        score=score,
        industry_multiplier=industry_mult,
        borrower_type=btype,
        rules=rules,
        rationale=rationale,
    )
