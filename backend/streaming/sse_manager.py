"""
═══════════════════════════════════════════════════════════
Scalable SSE Manager — ANTIGRAVITY OS v2 (§24.3)
═══════════════════════════════════════════════════════════

SSE connection management for high concurrency.

PROBLEM: 1000 concurrent visitors = 1000 open SSE connections
         Each holds a file descriptor.

SOLUTION:
  1. Max SSE lifetime: 5 minutes (then client reconnects)
  2. Idle timeout: 60s → keepalive ping
  3. Hard timeout: 10 minutes absolute max
  4. Max concurrent per worker: 500
  5. ~8KB memory per connection → 500 connections = 4MB
"""

from __future__ import annotations

import asyncio
import json
import logging
import time
import uuid
from dataclasses import dataclass, field
from typing import AsyncGenerator, Dict, Optional, Set

logger = logging.getLogger("portfolio.streaming.sse")


# ═══════════════════════════════════════════════════════════
# CONSTANTS
# ═══════════════════════════════════════════════════════════

MAX_CONNECTIONS = 500
MAX_CONNECTION_LIFETIME = 300     # 5 minutes
IDLE_TIMEOUT = 60                 # 60 seconds → keepalive
HARD_TIMEOUT = 600                # 10 minutes absolute
KEEPALIVE_INTERVAL = 30           # 30s between keepalive pings


# ═══════════════════════════════════════════════════════════
# CONNECTION STATE
# ═══════════════════════════════════════════════════════════

@dataclass
class SSEConnection:
    """Active SSE connection."""
    connection_id: str
    session_id: str
    queue: asyncio.Queue = field(default_factory=asyncio.Queue)
    created_at: float = field(default_factory=time.time)
    last_activity: float = field(default_factory=time.time)
    closed: bool = False


# ═══════════════════════════════════════════════════════════
# SSE MANAGER
# ═══════════════════════════════════════════════════════════

class ScalableSSEManager:
    """
    Manages SSE connections with lifecycle policies.
    """

    def __init__(self):
        self._connections: Dict[str, SSEConnection] = {}
        self._session_connections: Dict[str, Set[str]] = {}  # session → conn IDs
        self._cleanup_task: Optional[asyncio.Task] = None

    @property
    def connection_count(self) -> int:
        return len(self._connections)

    async def start(self):
        """Start the background cleanup task."""
        self._cleanup_task = asyncio.create_task(self._cleanup_loop())
        logger.info("SSE Manager started")

    async def stop(self):
        """Stop cleanup and close all connections."""
        if self._cleanup_task:
            self._cleanup_task.cancel()
            try:
                await self._cleanup_task
            except asyncio.CancelledError:
                pass

        # Close all connections
        for conn in list(self._connections.values()):
            await self.close_connection(conn.connection_id)

        logger.info("SSE Manager stopped")

    async def create_connection(self, session_id: str) -> Optional[str]:
        """
        Create a new SSE connection. Returns connection_id or None if at capacity.
        """
        if len(self._connections) >= MAX_CONNECTIONS:
            logger.warning(
                f"SSE connection limit reached ({MAX_CONNECTIONS}). "
                f"Rejecting new connection for session {session_id}"
            )
            return None

        conn_id = str(uuid.uuid4())[:12]
        conn = SSEConnection(connection_id=conn_id, session_id=session_id)
        self._connections[conn_id] = conn

        # Track per session
        if session_id not in self._session_connections:
            self._session_connections[session_id] = set()
        self._session_connections[session_id].add(conn_id)

        logger.debug(
            f"SSE connection created: {conn_id} for session {session_id} "
            f"(total: {self.connection_count})"
        )
        return conn_id

    async def close_connection(self, connection_id: str):
        """Close and cleanup a connection."""
        conn = self._connections.pop(connection_id, None)
        if conn:
            conn.closed = True
            # Remove from session tracking
            session_conns = self._session_connections.get(conn.session_id)
            if session_conns:
                session_conns.discard(connection_id)
                if not session_conns:
                    del self._session_connections[conn.session_id]

    async def send_event(
        self,
        connection_id: str,
        data: dict,
        event_type: str = "message",
    ):
        """Send an event to a specific connection."""
        conn = self._connections.get(connection_id)
        if conn and not conn.closed:
            conn.last_activity = time.time()
            await conn.queue.put({
                "event": event_type,
                "data": json.dumps(data),
            })

    async def broadcast_to_session(
        self,
        session_id: str,
        data: dict,
        event_type: str = "message",
    ):
        """Send event to all connections for a session."""
        conn_ids = self._session_connections.get(session_id, set())
        for conn_id in list(conn_ids):
            await self.send_event(conn_id, data, event_type)

    async def broadcast_all(self, data: dict, event_type: str = "broadcast"):
        """Send event to ALL active connections."""
        for conn_id in list(self._connections.keys()):
            await self.send_event(conn_id, data, event_type)

    async def stream(self, connection_id: str) -> AsyncGenerator[str, None]:
        """
        Async generator that yields SSE-formatted events.
        Use with FastAPI's StreamingResponse.
        """
        conn = self._connections.get(connection_id)
        if not conn:
            return

        try:
            while not conn.closed:
                # Check lifetime limits
                age = time.time() - conn.created_at
                if age > MAX_CONNECTION_LIFETIME:
                    yield self._format_sse(
                        {"type": "reconnect", "reason": "lifetime_exceeded"},
                        "control",
                    )
                    break

                idle = time.time() - conn.last_activity
                if idle > IDLE_TIMEOUT:
                    # Send keepalive
                    yield self._format_sse({"type": "keepalive"}, "ping")
                    conn.last_activity = time.time()

                if age > HARD_TIMEOUT:
                    break

                # Get next event with timeout
                try:
                    event = await asyncio.wait_for(
                        conn.queue.get(), timeout=KEEPALIVE_INTERVAL
                    )
                    yield self._format_sse(event["data"], event["event"])
                except asyncio.TimeoutError:
                    # Send keepalive on timeout
                    yield self._format_sse({"type": "keepalive"}, "ping")

        finally:
            await self.close_connection(connection_id)

    def _format_sse(self, data, event_type: str = "message") -> str:
        """Format data as SSE string."""
        if isinstance(data, dict):
            data = json.dumps(data)
        lines = [f"event: {event_type}", f"data: {data}", "", ""]
        return "\n".join(lines)

    async def _cleanup_loop(self):
        """Background task to clean up stale connections."""
        while True:
            try:
                await asyncio.sleep(30)
                now = time.time()
                to_close = []

                for conn_id, conn in self._connections.items():
                    age = now - conn.created_at
                    if age > HARD_TIMEOUT or conn.closed:
                        to_close.append(conn_id)

                for conn_id in to_close:
                    await self.close_connection(conn_id)

                if to_close:
                    logger.info(
                        f"SSE cleanup: closed {len(to_close)} stale connections "
                        f"(remaining: {self.connection_count})"
                    )

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"SSE cleanup error: {e}")

    def get_stats(self) -> dict:
        """Get SSE connection stats for monitoring."""
        now = time.time()
        ages = [now - c.created_at for c in self._connections.values()]
        return {
            "total_connections": self.connection_count,
            "max_connections": MAX_CONNECTIONS,
            "unique_sessions": len(self._session_connections),
            "avg_connection_age_seconds": round(sum(ages) / len(ages), 1) if ages else 0,
            "oldest_connection_seconds": round(max(ages), 1) if ages else 0,
        }


# Singleton
sse_manager = ScalableSSEManager()
