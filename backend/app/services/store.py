"""SQLite persistence for shareable floor plans + version history."""

from __future__ import annotations

import json
import sqlite3
import uuid
from pathlib import Path
from typing import Any

DB_PATH = Path(__file__).resolve().parents[2] / "data" / "plans.db"


def _connect() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with _connect() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS plans (
                id TEXT PRIMARY KEY,
                payload TEXT NOT NULL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS plan_versions (
                plan_id TEXT NOT NULL,
                version INTEGER NOT NULL,
                payload TEXT NOT NULL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (plan_id, version)
            )
            """
        )
        conn.commit()


def save_plan(payload: dict[str, Any], plan_id: str | None = None) -> tuple[str, int]:
    """Save a plan. If plan_id is provided, append a new version; else create new id.

    Returns (plan_id, version).
    """
    init_db()
    if plan_id:
        with _connect() as conn:
            row = conn.execute(
                "SELECT COALESCE(MAX(version), 0) AS v FROM plan_versions WHERE plan_id = ?",
                (plan_id,),
            ).fetchone()
            version = int(row["v"]) + 1 if row else 1
            payload = {**payload, "id": plan_id, "version": version}
            conn.execute(
                "INSERT INTO plan_versions (plan_id, version, payload) VALUES (?, ?, ?)",
                (plan_id, version, json.dumps(payload)),
            )
            conn.execute(
                """
                INSERT INTO plans (id, payload) VALUES (?, ?)
                ON CONFLICT(id) DO UPDATE SET payload = excluded.payload, created_at = CURRENT_TIMESTAMP
                """,
                (plan_id, json.dumps(payload)),
            )
            conn.commit()
        return plan_id, version

    new_id = uuid.uuid4().hex[:10]
    version = 1
    payload = {**payload, "id": new_id, "version": version}
    with _connect() as conn:
        conn.execute(
            "INSERT INTO plans (id, payload) VALUES (?, ?)",
            (new_id, json.dumps(payload)),
        )
        conn.execute(
            "INSERT INTO plan_versions (plan_id, version, payload) VALUES (?, ?, ?)",
            (new_id, version, json.dumps(payload)),
        )
        conn.commit()
    return new_id, version


def get_plan(plan_id: str, version: int | None = None) -> dict[str, Any] | None:
    init_db()
    with _connect() as conn:
        if version is not None:
            row = conn.execute(
                "SELECT payload FROM plan_versions WHERE plan_id = ? AND version = ?",
                (plan_id, version),
            ).fetchone()
        else:
            row = conn.execute("SELECT payload FROM plans WHERE id = ?", (plan_id,)).fetchone()
    if not row:
        return None
    return json.loads(row["payload"])


def list_versions(plan_id: str) -> list[dict[str, Any]]:
    init_db()
    with _connect() as conn:
        rows = conn.execute(
            """
            SELECT version, created_at, payload
            FROM plan_versions
            WHERE plan_id = ?
            ORDER BY version DESC
            """,
            (plan_id,),
        ).fetchall()
    out: list[dict[str, Any]] = []
    for row in rows:
        payload = json.loads(row["payload"])
        out.append(
            {
                "version": row["version"],
                "created_at": row["created_at"],
                "prompt": payload.get("prompt", ""),
            }
        )
    return out
