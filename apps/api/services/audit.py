"""Audit log helper — all writes go through here to ensure immutability."""
from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy.orm import Session

from models import AuditLog


def log_event(
    db: Session,
    application_id: uuid.UUID,
    event_type: str,
    payload: dict[str, Any] | None = None,
) -> AuditLog:
    entry = AuditLog(
        application_id=application_id,
        event_type=event_type,
        payload=payload or {},
    )
    db.add(entry)
    db.flush()
    return entry
