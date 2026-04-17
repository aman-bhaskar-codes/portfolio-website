"""
═══════════════════════════════════════════════════════════
ANTIGRAVITY OS v3 — ntfy Push Notifications (§45)
═══════════════════════════════════════════════════════════

Real-time push notifications to the portfolio owner's devices.
Uses ntfy (self-hosted, free) — no app stores, no subscriptions.

Priority levels:
  URGENT (max):  VIP visitor, brief downloaded, 30+ min session
  HIGH:          Return visitor on 3rd+ visit, DSPy deployed
  DEFAULT:       RAG quality alert, nightly digest
  LOW (silent):  GitHub sync, chunk ingested
"""

from __future__ import annotations

import logging
from datetime import datetime
from typing import Any

logger = logging.getLogger("portfolio.notifications.ntfy")


class OwnerNotifier:
    """
    Push notifications to owner's devices (phone, laptop, watch).
    Owner subscribes to the ntfy topic via the free ntfy app.

    All methods are fire-and-forget: notification failures
    never crash the main application.
    """

    def __init__(self):
        self._base_url = "http://localhost:8080"
        self._topic = "portfolio-alerts"
        self._auth_token = ""
        self._enabled = False

    def configure(
        self,
        base_url: str = "http://localhost:8080",
        topic: str = "portfolio-alerts",
        auth_token: str = "",
        enabled: bool = True,
    ) -> None:
        """Configure ntfy connection."""
        self._base_url = base_url.rstrip("/")
        self._topic = topic
        self._auth_token = auth_token
        self._enabled = enabled

        if enabled:
            logger.info(f"✅ ntfy configured: {base_url}/{topic}")

    async def notify(
        self,
        title: str,
        body: str,
        priority: str = "default",
        tags: list[str] | None = None,
        click_url: str | None = None,
    ) -> bool:
        """
        Send a push notification.

        Priority values: max, urgent, high, default, low, min
        Tags: emoji shortcodes (e.g., "robot", "chart", "warning")
        """
        if not self._enabled:
            logger.debug(f"ntfy disabled, skipping: {title}")
            return False

        try:
            import httpx

            headers: dict[str, str] = {
                "Title": title,
                "Priority": priority,
            }

            if tags:
                headers["Tags"] = ",".join(tags)
            if click_url:
                headers["Click"] = click_url
            if self._auth_token:
                headers["Authorization"] = f"Bearer {self._auth_token}"

            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    f"{self._base_url}/{self._topic}",
                    headers=headers,
                    content=body,
                )
                response.raise_for_status()

            logger.debug(f"ntfy sent: {title}")
            return True
        except Exception as e:
            logger.warning(f"ntfy notification failed (non-fatal): {e}")
            return False

    # ───────────────────────────────────────────────────────
    # CONVENIENCE METHODS FOR COMMON NOTIFICATIONS
    # ───────────────────────────────────────────────────────

    async def notify_vip_visitor(
        self, company: str, persona: str
    ) -> bool:
        """URGENT: Visitor from a recognized company detected."""
        return await self.notify(
            title=f"🏢 VIP Visitor: {company}",
            body=f"Visitor from {company} detected (persona: {persona}). They're browsing your portfolio right now.",
            priority="urgent",
            tags=["office", "eyes"],
        )

    async def notify_brief_downloaded(
        self, visitor_info: str = ""
    ) -> bool:
        """URGENT: Someone downloaded a recruiter brief."""
        return await self.notify(
            title="📥 Brief Downloaded",
            body=f"A visitor just downloaded your recruiter brief. {visitor_info}",
            priority="urgent",
            tags=["inbox_tray", "fire"],
        )

    async def notify_super_session(
        self, duration_minutes: float, persona: str
    ) -> bool:
        """HIGH: Visitor with 30+ min session."""
        return await self.notify(
            title=f"⭐ Super Session: {duration_minutes:.0f} min",
            body=f"A {persona} has been engaged for {duration_minutes:.0f} minutes.",
            priority="high",
            tags=["star", "timer"],
        )

    async def notify_return_visitor(
        self, visit_count: int, visitor_id: str
    ) -> bool:
        """HIGH: Return visitor on 3rd+ visit."""
        return await self.notify(
            title=f"🔄 Return Visitor (#{visit_count})",
            body=f"Visitor {visitor_id[:8]}... is back for visit #{visit_count}.",
            priority="high",
            tags=["repeat", "wave"],
        )

    async def notify_dspy_deployed(
        self, improvement_pct: float
    ) -> bool:
        """HIGH: DSPy optimization deployed new prompts."""
        return await self.notify(
            title="🧠 Prompts Optimized",
            body=f"DSPy deployed new prompts: +{improvement_pct:.1%} engagement improvement.",
            priority="high",
            tags=["brain", "chart_with_upwards_trend"],
        )

    async def notify_rag_degraded(
        self, metric_name: str, value: float, threshold: float
    ) -> bool:
        """DEFAULT: RAG quality metric below threshold."""
        return await self.notify(
            title=f"⚠️ RAG Quality: {metric_name}",
            body=f"{metric_name}: {value:.2f} (target: {threshold:.2f}). Review recent chunks.",
            priority="default",
            tags=["warning", "chart_with_downwards_trend"],
        )

    async def notify_system_startup(self, version: str = "v3") -> bool:
        """DEFAULT: System started successfully."""
        return await self.notify(
            title=f"✅ ANTIGRAVITY OS {version} Started",
            body=f"All systems operational. Started at {datetime.now().strftime('%H:%M')}.",
            priority="default",
            tags=["white_check_mark", "rocket"],
        )

    async def send_nightly_digest(
        self,
        sessions: int,
        chat_opens: int,
        briefs_downloaded: int,
        top_persona: str,
        top_company: str | None,
        times_stumped: int,
    ) -> bool:
        """LOW: Nightly summary at 11pm."""
        return await self.notify(
            title=f"📊 Daily Digest: {sessions} visits",
            body=(
                f"🎯 {chat_opens} chat opens\n"
                f"📥 {briefs_downloaded} briefs downloaded\n"
                f"🔝 Top persona: {top_persona}\n"
                f"⭐ Top company: {top_company or 'unknown'}\n"
                f"💡 AI stumped: {times_stumped} times"
            ),
            priority="low",
            tags=["bar_chart", "robot"],
        )

    async def notify_github_sync(
        self, repo_name: str, chunks_updated: int
    ) -> bool:
        """LOW: GitHub sync completed."""
        return await self.notify(
            title=f"🔄 GitHub: {repo_name}",
            body=f"Sync complete: {chunks_updated} chunks updated.",
            priority="low",
            tags=["arrows_counterclockwise"],
        )

    @property
    def is_enabled(self) -> bool:
        return self._enabled


# Module-level singleton
owner_notifier = OwnerNotifier()
