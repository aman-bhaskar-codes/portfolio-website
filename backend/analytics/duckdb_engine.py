"""
═══════════════════════════════════════════════════════════
ANTIGRAVITY OS v3 — DuckDB Analytics Engine (§40)
═══════════════════════════════════════════════════════════

Embedded columnar analytics engine. PostgreSQL handles transactional
writes; DuckDB handles all analytical reads.

Why DuckDB:
  - 100x faster than PostgreSQL for analytical queries
  - Embedded: runs inside the Python process, no separate server
  - Reads Parquet files directly (no import step)
  - FREE, open source, zero infrastructure
"""

from __future__ import annotations

import logging
from datetime import datetime
from pathlib import Path
from typing import Any

logger = logging.getLogger("portfolio.analytics.duckdb")


class AnalyticsEngine:
    """
    DuckDB as the analytics layer.

    Architecture:
      PostgreSQL (OLTP) → nightly ETL via Parquet export →
      DuckDB (OLAP) → analytical queries, dashboards, DSPy training data

    All methods are defensive: if DuckDB fails, the error is logged
    but the application continues running.
    """

    # Pre-built analytical queries
    QUERIES = {
        "persona_distribution_7d": """
            SELECT visitor_persona, COUNT(*) as sessions,
                   AVG(session_duration_minutes) as avg_duration,
                   AVG(conversion_score) as avg_conversion
            FROM sessions
            WHERE created_at > CURRENT_TIMESTAMP - INTERVAL 7 DAY
            GROUP BY visitor_persona
            ORDER BY sessions DESC
        """,
        "top_engagement_topics": """
            SELECT topic_cluster,
                   COUNT(*) as times_asked,
                   AVG(follow_up_depth) as avg_depth,
                   AVG(conversion_score) as avg_conversion
            FROM conversations
            WHERE created_at > CURRENT_TIMESTAMP - INTERVAL 30 DAY
            GROUP BY topic_cluster
            ORDER BY avg_depth DESC
            LIMIT 20
        """,
        "rag_quality_trend": """
            SELECT DATE_TRUNC('day', evaluation_date) as day,
                   AVG(faithfulness) as faithfulness,
                   AVG(context_precision) as context_precision,
                   AVG(answer_relevancy) as answer_relevancy
            FROM rag_quality_metrics
            WHERE evaluation_date > CURRENT_TIMESTAMP - INTERVAL 30 DAY
            GROUP BY 1
            ORDER BY 1
        """,
        "dspy_optimization_history": """
            SELECT run_date, baseline_score, new_score,
                   improvement_pct, was_deployed
            FROM dspy_optimization_runs
            ORDER BY run_date DESC
            LIMIT 12
        """,
        "hourly_traffic": """
            SELECT DATE_TRUNC('hour', created_at) as hour,
                   COUNT(*) as requests,
                   COUNT(DISTINCT visitor_id) as unique_visitors
            FROM sessions
            WHERE created_at > CURRENT_TIMESTAMP - INTERVAL 24 HOUR
            GROUP BY 1
            ORDER BY 1
        """,
        "model_usage_breakdown": """
            SELECT model_name,
                   COUNT(*) as calls,
                   SUM(prompt_tokens) as total_prompt_tokens,
                   SUM(completion_tokens) as total_completion_tokens,
                   AVG(latency_ms) as avg_latency_ms
            FROM llm_calls
            WHERE created_at > CURRENT_TIMESTAMP - INTERVAL 7 DAY
            GROUP BY model_name
            ORDER BY calls DESC
        """,
    }

    def __init__(self):
        self._conn = None
        self._db_path: str = "data/analytics/antigravity.duckdb"
        self._parquet_dir: str = "data/analytics/parquet"
        self._available = False

    async def initialize(
        self,
        db_path: str = "data/analytics/antigravity.duckdb",
        parquet_dir: str = "data/analytics/parquet",
    ) -> None:
        """Initialize DuckDB connection and ensure directories exist."""
        self._db_path = db_path
        self._parquet_dir = parquet_dir

        try:
            import duckdb

            # Ensure directories exist
            Path(db_path).parent.mkdir(parents=True, exist_ok=True)
            Path(parquet_dir).mkdir(parents=True, exist_ok=True)

            self._conn = duckdb.connect(db_path)
            self._create_tables()
            self._available = True
            logger.info(f"✅ DuckDB initialized: {db_path}")
        except Exception as e:
            logger.warning(f"⚠️ DuckDB init failed (non-fatal): {e}")

    def _create_tables(self) -> None:
        """Create analytics tables if they don't exist."""
        if not self._conn:
            return

        self._conn.execute("""
            CREATE TABLE IF NOT EXISTS rag_quality_metrics (
                evaluation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                faithfulness DOUBLE,
                context_precision DOUBLE,
                context_recall DOUBLE,
                answer_relevancy DOUBLE,
                dataset_size INTEGER
            )
        """)

        self._conn.execute("""
            CREATE TABLE IF NOT EXISTS dspy_optimization_runs (
                run_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                baseline_score DOUBLE,
                new_score DOUBLE,
                improvement_pct DOUBLE,
                was_deployed BOOLEAN,
                num_training_examples INTEGER,
                notes VARCHAR
            )
        """)

        self._conn.execute("""
            CREATE TABLE IF NOT EXISTS llm_calls (
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                model_name VARCHAR,
                prompt_tokens INTEGER,
                completion_tokens INTEGER,
                latency_ms DOUBLE,
                request_type VARCHAR
            )
        """)

        self._conn.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                visitor_id VARCHAR,
                visitor_persona VARCHAR,
                session_duration_minutes DOUBLE,
                conversion_score DOUBLE,
                messages_count INTEGER,
                company_detected VARCHAR
            )
        """)

        self._conn.execute("""
            CREATE TABLE IF NOT EXISTS conversations (
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                visitor_id VARCHAR,
                topic_cluster VARCHAR,
                follow_up_depth INTEGER,
                conversion_score DOUBLE,
                model_used VARCHAR
            )
        """)

    async def query(self, query_name: str) -> list[dict[str, Any]]:
        """Execute a pre-built analytical query by name."""
        if not self._available or not self._conn:
            logger.debug(f"DuckDB not available for query: {query_name}")
            return []

        sql = self.QUERIES.get(query_name)
        if not sql:
            logger.warning(f"Unknown analytics query: {query_name}")
            return []

        try:
            result = self._conn.execute(sql)
            columns = [desc[0] for desc in result.description]
            rows = result.fetchall()
            return [dict(zip(columns, row)) for row in rows]
        except Exception as e:
            logger.warning(f"Analytics query '{query_name}' failed: {e}")
            return []

    async def execute_sql(self, sql: str) -> list[dict[str, Any]]:
        """Execute arbitrary SQL. Use with caution."""
        if not self._available or not self._conn:
            return []

        try:
            result = self._conn.execute(sql)
            if result.description:
                columns = [desc[0] for desc in result.description]
                rows = result.fetchall()
                return [dict(zip(columns, row)) for row in rows]
            return []
        except Exception as e:
            logger.warning(f"DuckDB SQL execution failed: {e}")
            return []

    async def insert_rag_metrics(
        self,
        faithfulness: float,
        context_precision: float,
        context_recall: float,
        answer_relevancy: float,
        dataset_size: int,
    ) -> None:
        """Insert RAG quality evaluation results."""
        if not self._available or not self._conn:
            return

        try:
            self._conn.execute(
                """
                INSERT INTO rag_quality_metrics
                (faithfulness, context_precision, context_recall,
                 answer_relevancy, dataset_size)
                VALUES (?, ?, ?, ?, ?)
                """,
                [faithfulness, context_precision, context_recall,
                 answer_relevancy, dataset_size],
            )
        except Exception as e:
            logger.warning(f"Failed to insert RAG metrics: {e}")

    async def insert_dspy_run(
        self,
        baseline_score: float,
        new_score: float,
        improvement_pct: float,
        was_deployed: bool,
        num_training_examples: int,
        notes: str = "",
    ) -> None:
        """Insert DSPy optimization run results."""
        if not self._available or not self._conn:
            return

        try:
            self._conn.execute(
                """
                INSERT INTO dspy_optimization_runs
                (baseline_score, new_score, improvement_pct,
                 was_deployed, num_training_examples, notes)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                [baseline_score, new_score, improvement_pct,
                 was_deployed, num_training_examples, notes],
            )
        except Exception as e:
            logger.warning(f"Failed to insert DSPy run: {e}")

    async def insert_llm_call(
        self,
        model_name: str,
        prompt_tokens: int,
        completion_tokens: int,
        latency_ms: float,
        request_type: str = "chat",
    ) -> None:
        """Log an LLM call for analytics."""
        if not self._available or not self._conn:
            return

        try:
            self._conn.execute(
                """
                INSERT INTO llm_calls
                (model_name, prompt_tokens, completion_tokens,
                 latency_ms, request_type)
                VALUES (?, ?, ?, ?, ?)
                """,
                [model_name, prompt_tokens, completion_tokens,
                 latency_ms, request_type],
            )
        except Exception as e:
            logger.warning(f"Failed to insert LLM call log: {e}")

    async def insert_session(
        self,
        visitor_id: str,
        visitor_persona: str,
        session_duration_minutes: float,
        conversion_score: float,
        messages_count: int,
        company_detected: str = "",
    ) -> None:
        """Log a visitor session."""
        if not self._available or not self._conn:
            return

        try:
            self._conn.execute(
                """
                INSERT INTO sessions
                (visitor_id, visitor_persona, session_duration_minutes,
                 conversion_score, messages_count, company_detected)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                [visitor_id, visitor_persona, session_duration_minutes,
                 conversion_score, messages_count, company_detected],
            )
        except Exception as e:
            logger.warning(f"Failed to insert session: {e}")

    async def shutdown(self) -> None:
        """Close DuckDB connection."""
        if self._conn:
            try:
                self._conn.close()
                logger.info("✅ DuckDB connection closed")
            except Exception as e:
                logger.debug(f"DuckDB shutdown: {e}")

    @property
    def is_available(self) -> bool:
        return self._available


# Module-level singleton
analytics_engine = AnalyticsEngine()
