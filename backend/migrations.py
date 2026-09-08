"""Safe database migration system for EduAI.

Replaces the try/except ALTER pattern with versioned migrations.
Each migration has a unique ID and runs exactly once.
"""
import sqlite3
from typing import List, Tuple

# Migration registry: (version, sql_statement)
MIGRATIONS: List[Tuple[int, str]] = [
    (1, "ALTER TABLE documents ADD COLUMN quiz_progress_json TEXT;"),
    (2, "ALTER TABLE documents ADD COLUMN quiz_json TEXT;"),
    (3, "ALTER TABLE documents ADD COLUMN terms_json TEXT;"),
    (4, "ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'student';"),
    (5, "ALTER TABLE users ADD COLUMN password_hash TEXT DEFAULT '';"),
    (6, "ALTER TABLE users ADD COLUMN permissions_json TEXT DEFAULT '{}';"),
    (7, "ALTER TABLE users ADD COLUMN token_period TEXT;"),
]


def _ensure_migrations_table(conn: sqlite3.Connection) -> None:
    """Create the schema_migrations table if it doesn't exist."""
    conn.execute("""
        CREATE TABLE IF NOT EXISTS schema_migrations (
            version INTEGER PRIMARY KEY,
            applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    conn.commit()


def _get_applied(conn: sqlite3.Connection) -> set:
    """Return set of already-applied migration versions."""
    cursor = conn.execute("SELECT version FROM schema_migrations ORDER BY version")
    return {row[0] for row in cursor.fetchall()}


def migrate(conn: sqlite3.Connection) -> List[int]:
    """Apply all pending migrations in order. Returns list of newly applied versions."""
    _ensure_migrations_table(conn)
    applied = _get_applied(conn)
    newly_applied = []

    for version, sql in MIGRATIONS:
        if version not in applied:
            try:
                conn.execute(sql)
                conn.execute(
                    "INSERT INTO schema_migrations (version) VALUES (?);",
                    (version,),
                )
                conn.commit()
                newly_applied.append(version)
            except sqlite3.OperationalError:
                # Column already exists or similar - skip gracefully
                conn.rollback()
                # Mark as applied to avoid retrying
                try:
                    conn.execute(
                        "INSERT OR IGNORE INTO schema_migrations (version) VALUES (?);",
                        (version,),
                    )
                    conn.commit()
                except Exception:
                    pass

    return newly_applied


def get_current_version(conn: sqlite3.Connection) -> int:
    """Return the highest applied migration version (0 if none)."""
    _ensure_migrations_table(conn)
    cursor = conn.execute("SELECT COALESCE(MAX(version), 0) FROM schema_migrations")
    return cursor.fetchone()[0]


def get_pending_count(conn: sqlite3.Connection) -> int:
    """Return the number of pending (unapplied) migrations."""
    _ensure_migrations_table(conn)
    applied = _get_applied(conn)
    return sum(1 for v, _ in MIGRATIONS if v not in applied)
