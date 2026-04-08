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


async def explain_decision(
    outcome: str,
    score: float,
    borrower_type: str,
    years_in_operation: int,
    industry: str,
    industry_multiplier: float,
    loan_amount: float,
    triggered_rules: list[dict],
    hard_fails: list[str],
    cautions: list[str],
    passes: list[str],
) -> tuple[str, str]:
    """
    Returns (explanation_text, model_used).
    Falls back to a summary string if LLM not configured.
    """
    if not settings.openai_api_key and not settings.anthropic_api_key:
        return _fallback_explanation(outcome, hard_fails, cautions), "unavailable"

    rules_lines = []
    for r in triggered_rules:
        direction = "min" if r.get("direction") == "min" else "max"
        value = r.get("value")
        value_str = f"{value:.3f}" if value is not None else "N/A"
        status = "PASS" if r.get("passed") else f"FAIL ({r.get('severity', '')})"
        rules_lines.append(
            f"  - {r['rule']} ({r['formula']}): value={value_str}, threshold={r['threshold']:.3f} [{direction}], {status}"
        )

    prompt_template = _load_prompt("explain_decision")
    prompt = prompt_template.format(
        outcome=outcome.upper(),
        score=round(score, 1),
        borrower_type=borrower_type,
        years_in_operation=years_in_operation,
        industry=industry,
        industry_multiplier=industry_multiplier,
        loan_amount=int(loan_amount),
        rules_detail="\n".join(rules_lines) if rules_lines else "  (none)",
        hard_fails=", ".join(hard_fails) if hard_fails else "none",
        cautions=", ".join(cautions) if cautions else "none",
        passes=", ".join(passes) if passes else "none",
    )

    client = get_llm_client()
    model_used = getattr(client, "model", settings.llm_provider)
    try:
        explanation = await client.complete(prompt)
        return explanation.strip(), model_used
    except Exception as e:
        return _fallback_explanation(outcome, hard_fails, cautions), model_used


def _fallback_explanation(outcome: str, hard_fails: list[str], cautions: list[str]) -> str:
    if outcome == "declined":
        reasons = hard_fails + cautions
        return f"This application was declined. Key issues: {'; '.join(reasons)}." if reasons else "This application was declined."
    if outcome == "manual_review":
        return f"This application requires manual review. Cautions noted: {'; '.join(cautions)}." if cautions else "This application requires manual review."
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
