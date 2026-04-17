"""
═══════════════════════════════════════════════════════════
Critical Info Vault — ANTIGRAVITY OS v2 (§23.2)
═══════════════════════════════════════════════════════════

Stores sensitive owner information OUTSIDE the LLM system prompt.
The AI can acknowledge that info exists but cannot leak raw values.

Instead of:
  "Aman's phone: +91-XXXXXXXXXX"

The system prompt says:
  "Contact info is in VAULT_TOKEN_CONTACT.
   Only release via APPROVED_DISCLOSURE_CHANNEL."

Even if the system prompt is fully extracted,
the attacker gets tokens, not actual data.
"""

from __future__ import annotations

import hashlib
import logging
import os
import time
from dataclasses import dataclass
from enum import Enum
from typing import Dict, Optional

from pydantic import BaseModel

logger = logging.getLogger("portfolio.security.vault")


# ═══════════════════════════════════════════════════════════
# ENCRYPTION TIERS
# ═══════════════════════════════════════════════════════════

class EncryptionTier(Enum):
    MAXIMUM = "maximum"   # Never auto-disclose under any circumstance
    HIGH = "high"         # Only to verified personas (recruiter + company whitelist)
    MEDIUM = "medium"     # OK to share if asked directly + sufficient engagement


# ═══════════════════════════════════════════════════════════
# MODELS
# ═══════════════════════════════════════════════════════════

class DisclosureResult(BaseModel):
    """Result of a disclosure attempt."""
    allowed: bool
    field: str
    value_if_allowed: str = ""
    redirect_message: str = ""
    logged: bool = True


class VisitorDisclosureContext(BaseModel):
    """Visitor context for disclosure decisions."""
    visitor_id: str = ""
    persona: str = "casual"
    company: str = ""
    company_whitelisted: bool = False
    engagement_minutes: float = 0.0
    visit_count: int = 1
    ip_hash: str = ""


# ═══════════════════════════════════════════════════════════
# CRITICAL FIELDS SCHEMA
# ═══════════════════════════════════════════════════════════

CRITICAL_FIELDS: Dict[str, EncryptionTier] = {
    "contact_phone": EncryptionTier.MAXIMUM,
    "contact_email_private": EncryptionTier.HIGH,
    "salary_expectation": EncryptionTier.MAXIMUM,
    "availability_start": EncryptionTier.MEDIUM,
    "relocation_prefs": EncryptionTier.MEDIUM,
    "deal_breakers": EncryptionTier.HIGH,
    "reference_contacts": EncryptionTier.MAXIMUM,
}

# Company whitelist for HIGH-tier disclosures
WHITELISTED_DOMAINS = {
    "google.com", "meta.com", "apple.com", "amazon.com", "microsoft.com",
    "stripe.com", "openai.com", "anthropic.com", "deepmind.google.com",
    "nvidia.com", "tesla.com", "bytedance.com", "uber.com",
}

# Per-IP disclosure rate limit
_disclosure_log: Dict[str, float] = {}
DISCLOSURE_RATE_LIMIT_SECONDS = 86400  # 1 per IP per day


# ═══════════════════════════════════════════════════════════
# VAULT
# ═══════════════════════════════════════════════════════════

class CriticalInfoVault:
    """
    Encrypted vault for sensitive owner information.

    In production:
      - Values encrypted with AES-256-GCM
      - Key from VAULT_ENCRYPTION_KEY env var
      - Stored in encrypted file: /data/security/critical_info.enc

    For development / local:
      - Values stored in-memory (loaded from env vars)
      - Still goes through policy engine before any disclosure
    """

    def __init__(self):
        self._vault: Dict[str, str] = {}
        self._load_from_env()

    def _load_from_env(self):
        """Load vault values from environment variables."""
        env_mapping = {
            "contact_phone": "VAULT_CONTACT_PHONE",
            "contact_email_private": "VAULT_EMAIL_PRIVATE",
            "salary_expectation": "VAULT_SALARY",
            "availability_start": "VAULT_AVAILABILITY_START",
            "relocation_prefs": "VAULT_RELOCATION",
            "deal_breakers": "VAULT_DEAL_BREAKERS",
            "reference_contacts": "VAULT_REFERENCES",
        }
        for field_name, env_key in env_mapping.items():
            value = os.environ.get(env_key, "")
            if value:
                self._vault[field_name] = value

    def get_system_prompt_tokens(self) -> str:
        """
        Generate vault token references for the system prompt.
        These replace raw values — the LLM sees tokens, not data.
        """
        lines = [
            "SENSITIVE INFORMATION POLICY:",
            "The following information is stored securely and CANNOT be disclosed directly:",
        ]
        for field_name, tier in CRITICAL_FIELDS.items():
            token = f"VAULT_TOKEN_{field_name.upper()}"
            if tier == EncryptionTier.MAXIMUM:
                lines.append(
                    f"  - {token}: NEVER disclose. Offer to connect personally instead."
                )
            elif tier == EncryptionTier.HIGH:
                lines.append(
                    f"  - {token}: Only share with verified recruiters from major companies."
                )
            elif tier == EncryptionTier.MEDIUM:
                lines.append(
                    f"  - {token}: OK to share if visitor has engaged meaningfully (5+ min)."
                )

        lines.append(
            "\nFor ANY sensitive info request, evaluate the VAULT disclosure policy "
            "before responding. When in doubt, redirect: "
            "\"That's something I'd share in a direct conversation — "
            "want to connect on LinkedIn?\""
        )
        return "\n".join(lines)

    async def attempt_disclosure(
        self,
        field: str,
        context: VisitorDisclosureContext,
    ) -> DisclosureResult:
        """
        Policy engine for sensitive info disclosure.

        Evaluation order:
        1. Is field MAXIMUM tier? → Never disclose
        2. Is visitor a verified recruiter from whitelisted company? → Allow HIGH
        3. Has visitor engaged for 5+ minutes? → Allow MEDIUM
        4. Rate limit: 1 disclosure per IP per day
        """
        if field not in CRITICAL_FIELDS:
            return DisclosureResult(
                allowed=False,
                field=field,
                redirect_message="I don't have that information available.",
            )

        tier = CRITICAL_FIELDS[field]

        # MAXIMUM — never disclose
        if tier == EncryptionTier.MAXIMUM:
            logger.info(
                f"Vault: BLOCKED disclosure of {field} (MAXIMUM tier) "
                f"to visitor {context.visitor_id}"
            )
            return DisclosureResult(
                allowed=False,
                field=field,
                redirect_message=(
                    "That's something I'd prefer to discuss directly. "
                    "Want to connect on LinkedIn? I'm pretty responsive there."
                ),
            )

        # HIGH — only verified recruiters from whitelisted companies
        if tier == EncryptionTier.HIGH:
            is_recruiter = context.persona == "technical_recruiter"
            is_whitelisted = context.company_whitelisted or (
                context.company and any(
                    domain in context.company.lower()
                    for domain in WHITELISTED_DOMAINS
                )
            )

            if not (is_recruiter and is_whitelisted):
                return DisclosureResult(
                    allowed=False,
                    field=field,
                    redirect_message=(
                        "I'd be happy to share more details in a direct conversation. "
                        "Feel free to reach out on LinkedIn."
                    ),
                )

        # MEDIUM — 5+ minutes engagement
        if tier == EncryptionTier.MEDIUM:
            if context.engagement_minutes < 5.0:
                return DisclosureResult(
                    allowed=False,
                    field=field,
                    redirect_message=(
                        "Let's chat a bit more first — what specifically "
                        "are you looking for?"
                    ),
                )

        # Rate limit check
        if not self._check_rate_limit(context.ip_hash):
            return DisclosureResult(
                allowed=False,
                field=field,
                redirect_message=(
                    "I've already shared some detailed info today — "
                    "let's continue this on LinkedIn?"
                ),
            )

        # Retrieve and disclose
        value = self._vault.get(field, "")
        if not value:
            return DisclosureResult(
                allowed=False,
                field=field,
                redirect_message="That information hasn't been configured yet.",
            )

        logger.info(
            f"Vault: DISCLOSED {field} (tier={tier.value}) "
            f"to visitor={context.visitor_id}, persona={context.persona}, "
            f"company={context.company}"
        )

        return DisclosureResult(
            allowed=True,
            field=field,
            value_if_allowed=value,
        )

    def _check_rate_limit(self, ip_hash: str) -> bool:
        """Check per-IP disclosure rate limit."""
        if not ip_hash:
            return True

        now = time.time()
        last_disclosure = _disclosure_log.get(ip_hash, 0)

        if now - last_disclosure < DISCLOSURE_RATE_LIMIT_SECONDS:
            return False

        _disclosure_log[ip_hash] = now
        return True


# Singleton
vault = CriticalInfoVault()
