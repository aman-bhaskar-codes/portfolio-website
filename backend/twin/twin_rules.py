import os
from pathlib import Path

class TwinRules:
    """Dynamically loads and manages the system constraints and personality of the AI Twin."""
    
    def __init__(self):
        self.prompt_path = Path(os.path.dirname(__file__)).parent / "prompts" / "twin.txt"
        
    def get_base_prompt(self) -> str:
        if self.prompt_path.exists():
            return self.prompt_path.read_text(encoding="utf-8")
        return "You are the Portfolio AI Twin. Answer professionally."

twin_rules = TwinRules()
