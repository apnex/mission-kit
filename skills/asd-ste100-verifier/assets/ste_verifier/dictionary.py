import json
from pathlib import Path
from typing import Dict, Set, Any, Optional


class STEDictionary:
    def __init__(self, master_path: Optional[Path] = None, project_config_path: Optional[Path] = None):
        base_dir = Path(__file__).resolve().parent.parent
        if master_path is None:
            # Default to data/ste-dictionary.json relative to project root
            master_path = base_dir / "data" / "ste-dictionary.json"

        self.master_path = master_path
        self.base_dir = base_dir
        self.approved_words: Dict[str, Dict[str, Any]] = {}
        self.unapproved_words: Dict[str, Dict[str, Any]] = {}
        self.rules: Dict[str, Any] = {}
        self.technical_names: Set[str] = set()
        self.technical_verbs: Set[str] = set()

        self._load_master()

        # Load project technical terms files
        possible_config_paths = [
            project_config_path,
            base_dir / ".ste-technical-terms.json",
            base_dir / ".ste-dictionary.json",
            base_dir / "data" / "ste-technical-terms.json"
        ]

        for p in possible_config_paths:
            if p and p.exists():
                self._load_project_config(p)

    def _load_master(self):
        if not self.master_path.exists():
            raise FileNotFoundError(f"Master STE dictionary not found at {self.master_path}")

        with open(self.master_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        self.rules = data.get("rules", {})
        self.approved_words = {k.lower(): v for k, v in data.get("approved_words", {}).items()}
        self.unapproved_words = {k.lower(): v for k, v in data.get("unapproved_words", {}).items()}

    def _load_project_config(self, path: Path):
        try:
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
            
            for tn in data.get("technical_names", []):
                self.technical_names.add(tn.lower())
            
            for tv in data.get("technical_verbs", []):
                self.technical_verbs.add(tv.lower())
        except Exception as e:
            print(f"Warning: Failed to load project config at {path}: {e}")

    def is_approved_word(self, word: str) -> bool:
        w = word.lower().strip()
        if w in self.approved_words:
            return True
        if w in self.technical_names or w in self.technical_verbs:
            return True
        return False

    def get_unapproved_info(self, word_or_phrase: str) -> Optional[Dict[str, Any]]:
        w = word_or_phrase.lower().strip()
        return self.unapproved_words.get(w)
