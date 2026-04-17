"""
═══════════════════════════════════════════════════════════
ANTIGRAVITY OS v4 — Configuration Wrapper
═══════════════════════════════════════════════════════════

Bridges V4 components to the existing V3 pydantic-settings in 
backend/config/settings.py, providing fallback parsing.
"""

from __future__ import annotations

import os

from backend.config.settings import settings as v3_settings


class V4ConfigAdapter:
    """Wrapper to ensure V4 compatibility with V3 settings file."""
    
    def __getattr__(self, name: str) -> str | int | float | bool | None:
        # First check V3 settings properties
        if hasattr(v3_settings, name):
            return getattr(v3_settings, name)
            
        # Fallback to os.environ for new V4 vars not yet in V3 schema
        if name in os.environ:
            val = os.environ[name]
            # Simple type coercion
            if val.lower() in ("true", "1", "yes"):
                return True
            if val.lower() in ("false", "0", "no"):
                return False
            try:
                if "." in val:
                    return float(val)
                return int(val)
            except ValueError:
                return val
                
        # Aliases
        if name == "OLLAMA_BASE_URL":
            return getattr(v3_settings, "OLLAMA_URL", "http://localhost:11434")
            
        # Defaults for new V4 values
        defaults = {
            "ANTHROPIC_API_KEY": "",
            "GITHUB_WEBHOOK_SECRET": "",
        }
        
        return defaults.get(name, None)


settings = V4ConfigAdapter()
