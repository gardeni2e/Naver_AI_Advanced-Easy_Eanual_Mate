from __future__ import annotations

import json
import sqlite3
from datetime import datetime

from app.core.config import settings
from app.models.schemas import ManualListItem, ProductInfo


class MetadataService:
    def __init__(self) -> None:
        settings.ensure_directories()
        self._init_db()

    def connect(self) -> sqlite3.Connection:
        return sqlite3.connect(settings.db_path)

    def _init_db(self) -> None:
        with self.connect() as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS manuals (
                  manual_id TEXT PRIMARY KEY,
                  source_type TEXT NOT NULL,
                  file_name TEXT,
                  estimated_product TEXT,
                  chunk_count INTEGER,
                  created_at TEXT
                )
                """
            )

    def upsert_manual(
        self,
        manual_id: str,
        source_type: str,
        file_name: str,
        estimated_product: ProductInfo,
        chunk_count: int,
    ) -> None:
        with self.connect() as conn:
            conn.execute(
                """
                INSERT OR REPLACE INTO manuals
                (manual_id, source_type, file_name, estimated_product, chunk_count, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    manual_id,
                    source_type,
                    file_name,
                    json.dumps(estimated_product.model_dump(), ensure_ascii=False),
                    chunk_count,
                    datetime.now().isoformat(timespec="seconds"),
                ),
            )

    def list_manuals(self) -> list[ManualListItem]:
        with self.connect() as conn:
            rows = conn.execute(
                """
                SELECT manual_id, source_type, file_name, estimated_product, chunk_count, created_at
                FROM manuals
                ORDER BY created_at DESC
                """
            ).fetchall()
        manuals: list[ManualListItem] = []
        for row in rows:
            estimated = ProductInfo(**json.loads(row[3])) if row[3] else None
            manuals.append(
                ManualListItem(
                    manual_id=row[0],
                    source_type=row[1],
                    file_name=row[2],
                    estimated_product=estimated,
                    chunk_count=row[4],
                    created_at=datetime.fromisoformat(row[5]),
                )
            )
        return manuals

    def get_manual(self, manual_id: str) -> ManualListItem | None:
        with self.connect() as conn:
            row = conn.execute(
                """
                SELECT manual_id, source_type, file_name, estimated_product, chunk_count, created_at
                FROM manuals
                WHERE manual_id = ?
                """,
                (manual_id,),
            ).fetchone()
        if row is None:
            return None
        estimated = ProductInfo(**json.loads(row[3])) if row[3] else None
        return ManualListItem(
            manual_id=row[0],
            source_type=row[1],
            file_name=row[2],
            estimated_product=estimated,
            chunk_count=row[4],
            created_at=datetime.fromisoformat(row[5]),
        )

    def delete_manual(self, manual_id: str) -> bool:
        with self.connect() as conn:
            cursor = conn.execute("DELETE FROM manuals WHERE manual_id = ?", (manual_id,))
        return cursor.rowcount > 0


metadata_service = MetadataService()
