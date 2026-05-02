"""
LLM client abstraction — swappable via LLM_PROVIDER env var.
Supported: openai, anthropic
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Protocol

from config import settings


PROMPTS_DIR = Path(__file__).parent / "prompts"


def _load_prompt(name: str) -> str:
    return (PROMPTS_DIR / f"{name}.txt").read_text()


class LLMClient(Protocol):
    async def complete(self, prompt: str, json_mode: bool = False) -> str: ...


class OpenAIClient:
    def __init__(self):
        from openai import AsyncOpenAI
        self._client = AsyncOpenAI(api_key=settings.openai_api_key)
        self.model = "gpt-4o-mini"

    async def complete(self, prompt: str, json_mode: bool = False) -> str:
        kwargs: dict = {"model": self.model, "messages": [{"role": "user", "content": prompt}], "temperature": 0}
        if json_mode:
            kwargs["response_format"] = {"type": "json_object"}
        response = await self._client.chat.completions.create(**kwargs)
        return response.choices[0].message.content or "{}"


class AnthropicClient:
    def __init__(self):
        import anthropic
        self._client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
        self.model = "claude-haiku-4-5-20251001"

    async def complete(self, prompt: str, json_mode: bool = False) -> str:
        message = await self._client.messages.create(
            model=self.model,
            max_tokens=1024,
            messages=[{"role": "user", "content": prompt}],
        )
        return message.content[0].text


def get_llm_client() -> LLMClient:
    provider = settings.llm_provider.lower()
    if provider == "anthropic":
        return AnthropicClient()
    return OpenAIClient()


def _fmt_metric(m: dict) -> str:
    val = m.get("value")
    val_str = f"{val:.2f}" if isinstance(val, (int, float)) else "missing"
    tier = m.get("tier_label", "n/a")
    weight = m.get("weight")
    weight_str = f", weight={weight:.0%}" if isinstance(weight, (int, float)) else ""
    return f"  - {m.get('rule', m.get('key'))}: value={val_str}, tier={tier}, score={m.get('score')}/2{weight_str}"


async def explain_decision(
    outcome: str,
    final_score: float,
    company_score: float,
    industry_score: float | None,
    industry_track: str | None,
    loan_bracket: str,
    approve_threshold: float,
    hr_lower_threshold: float,
    loan_amount: float,
    industry: str,
    core_metrics: list[dict],
    industry_metrics: list[dict],
    hard_stops: list[str],
    caps: list[str],
) -> tuple[str, str]:
    """
    Returns (explanation_text, model_used). Falls back to a summary if no LLM key.
    """
    if not settings.openai_api_key and not settings.anthropic_api_key:
        return _fallback_explanation(outcome, hard_stops, caps), "unavailable"

    core_detail = "\n".join(_fmt_metric(m) for m in core_metrics) or "  (none)"
    industry_detail = "\n".join(_fmt_metric(m) for m in industry_metrics) or "  (none)"

    prompt_template = _load_prompt("explain_decision")
    prompt = prompt_template.format(
        outcome=outcome.upper(),
        final_score=f"{final_score:.2f}",
        company_score=f"{company_score:.2f}",
        industry_score=f"{industry_score:.2f}" if industry_score is not None else "n/a (unknown industry track)",
        industry_track=industry_track or "unknown",
        loan_bracket=loan_bracket,
        approve_threshold=f"{approve_threshold:.2f}",
        hr_lower_threshold=f"{hr_lower_threshold:.2f}",
        loan_amount=f"{int(loan_amount):,}",
        industry=industry,
        core_detail=core_detail,
        industry_detail=industry_detail,
        hard_stops=", ".join(hard_stops) if hard_stops else "none",
        caps=", ".join(caps) if caps else "none",
    )

    client = get_llm_client()
    model_used = getattr(client, "model", settings.llm_provider)
    try:
        explanation = await client.complete(prompt)
        return explanation.strip(), model_used
    except Exception:
        return _fallback_explanation(outcome, hard_stops, caps), model_used


def _fallback_explanation(outcome: str, hard_stops: list[str], caps: list[str]) -> str:
    if outcome == "declined":
        reasons = hard_stops or caps
        return f"This application was declined. Key issues: {'; '.join(reasons)}." if reasons else "This application was declined."
    if outcome == "manual_review":
        return f"This application requires human review. Notes: {'; '.join(caps)}." if caps else "This application requires human review."
    return "This application was approved. All required financial thresholds were met."


async def extract_financials(document_text: str) -> tuple[dict, dict, str]:
    """
    Returns (extracted_fields, confidence_scores, model_used).
    Falls back to empty dicts if LLM not configured.
    """
    if not settings.openai_api_key and not settings.anthropic_api_key:
        return {}, {}, "unavailable"

    client = get_llm_client()
    model_used = getattr(client, "model", settings.llm_provider)

    prompt_template = _load_prompt("extract_financials")
    prompt = prompt_template.replace("{document_text}", document_text[:8000])

    try:
        raw = await client.complete(prompt, json_mode=True)
        data = json.loads(raw)
        confidence = data.pop("confidence", {})
        return data, confidence, model_used
    except Exception as e:
        return {"error": str(e)}, {}, model_used
