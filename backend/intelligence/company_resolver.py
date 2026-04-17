"""
═══════════════════════════════════════════════════════════
ANTIGRAVITY OS v4 — Company Resolver
═══════════════════════════════════════════════════════════

Resolves visitor IP addresses to company domains using MaxMind or APIs.
Fails open gracefully if no database is present.
"""

from __future__ import annotations

import logging
from pathlib import Path

logger = logging.getLogger("portfolio.intelligence.company")


class CompanyResolver:
    """
    Looks up organizational info from an IP address.
    Requires MaxMind GeoLite2 ASN or Enterprise DB.
    """

    def __init__(self, db_path: str | None = None):
        self._db_path = db_path
        self._reader = None
        self._initialized = False

    def _init_reader(self) -> None:
        """Lazy load the maxmind DB."""
        if self._initialized:
            return

        self._initialized = True
        
        if not self._db_path:
            return
            
        path = Path(self._db_path)
        if not path.exists():
            logger.debug(f"MaxMind DB not found at {path}, company resolution disabled.")
            return

        try:
            import maxminddb
            self._reader = maxminddb.open_database(str(path))
            logger.info("Company resolver initialized via MaxMind DB.")
        except ImportError:
            logger.debug("maxminddb package not installed.")
        except Exception as e:
            logger.warning(f"Failed to open MaxMind DB: {e}")

    def resolve(self, ip_address: str) -> dict[str, str | None]:
        """
        Attempt to resolve IP to company info.
        Never blocks or crashes on failure.
        """
        self._init_reader()

        result = {
            "name": None,
            "domain": None,
            "org": None,
        }

        # 1. Skip local IPs
        if ip_address.startswith(("127.", "192.168.", "10.", "172.")):
            return result
            
        if ip_address == "::1":
            return result

        # 2. Query MaxMind if available
        if self._reader:
            try:
                record = self._reader.get(ip_address)
                if record:
                    # Handle different MaxMind DB formats (City vs ASN vs Enterprise)
                    org = record.get("traits", {}).get("organization")
                    domain = record.get("traits", {}).get("domain")
                    
                    if not org:
                        org = record.get("autonomous_system_organization")

                    # Filter out obvious ISPs
                    if org and not self._is_isp(org):
                        result["org"] = org
                        result["domain"] = domain
            except Exception as e:
                logger.debug(f"Company resolution failed for {ip_address}: {e}")

        return result

    def _is_isp(self, org_name: str) -> bool:
        """Heuristic to filter out generic ISPs from business names."""
        lower = org_name.lower()
        isps = [
            "comcast", "verizon", "att ", "t-mobile", "spectrum", 
            "charter", "vodafone", "telecom", "broadband", "isp",
            "amazon.com", "googleusercontent", "aws "
        ]
        return any(isp in lower for isp in isps)


# Shared instance
company_resolver = CompanyResolver()
