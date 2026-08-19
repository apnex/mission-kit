import re
from typing import List, Dict, Any
from ste_verifier.dictionary import STEDictionary


class STEViolation:
    def __init__(self, line_num: int, rule_id: str, severity: str, message: str, original_text: str, replacement: str = ""):
        self.line_num = line_num
        self.rule_id = rule_id
        self.severity = severity
        self.message = message
        self.original_text = original_text
        self.replacement = replacement

    def to_dict(self) -> Dict[str, Any]:
        return {
            "line": self.line_num,
            "rule": self.rule_id,
            "severity": self.severity,
            "message": self.message,
            "original": self.original_text,
            "replacement": self.replacement
        }


class STEChecker:
    def __init__(self, dictionary: STEDictionary, strict_unlisted: bool = True):
        self.dict = dictionary
        self.strict_unlisted = strict_unlisted
        # Passive voice regex pattern
        self.passive_pattern = re.compile(
            r'\b(am|is|are|was|were|be|been|being)\s+([a-z]+ed|attached|built|bought|done|driven|found|given|kept|made|paid|put|seen|sent|shut|taken|written)\b',
            re.IGNORECASE
        )

    def check_text(self, text: str) -> List[STEViolation]:
        lines = text.splitlines()
        violations: List[STEViolation] = []

        for line_idx, line in enumerate(lines, start=1):
            line_str = line.strip()
            if not line_str or line_str.startswith("```") or line_str.startswith("#"):
                # Skip code fences and headings
                continue

            # 1. Unapproved phrases check
            for unapp_phrase, info in self.dict.unapproved_words.items():
                pattern = r'\b' + re.escape(unapp_phrase) + r'\b'
                matches = re.finditer(pattern, line, re.IGNORECASE)
                for m in matches:
                    matched_text = m.group(0)
                    replacement = info.get("replacement", "")
                    rationale = info.get("rationale", info.get("note", "Unapproved STE term"))
                    violations.append(STEViolation(
                        line_num=line_idx,
                        rule_id="STE-001-UNAPPROVED-VOCAB",
                        severity="ERROR",
                        message=f"Unapproved term '{matched_text}'. {rationale}",
                        original_text=matched_text,
                        replacement=replacement
                    ))

            # 2. Strict Mechanical Token Check (Flag any word not explicitly permitted in dictionary or .ste-dictionary.json)
            if self.strict_unlisted:
                # Strip markdown links, code spans, and inline formatting
                clean_line = re.sub(r'`[^`]*`', '', line_str)
                clean_line = re.sub(r'\[([^\]]+)\]\([^\)]+\)', r'\1', clean_line)
                
                tokens = re.findall(r'\b[a-zA-Z]{2,}\b', clean_line)
                for token in tokens:
                    t_lower = token.lower()
                    if not self.dict.is_approved_word(t_lower) and t_lower not in self.dict.unapproved_words:
                        violations.append(STEViolation(
                            line_num=line_idx,
                            rule_id="STE-000-UNLISTED-WORD",
                            severity="ERROR",
                            message=f"Word '{token}' is not explicitly permitted in master dictionary or .ste-dictionary.json.",
                            original_text=token,
                            replacement=f"Declare in .ste-dictionary.json or replace with approved STE word"
                        ))

            # Split line into sentences for structural checks
            sentences = re.split(r'(?<=[.!?])\s+', line_str)
            for sentence in sentences:
                sent_clean = sentence.strip()
                if not sent_clean:
                    continue

                words = re.findall(r'\b[a-zA-Z0-9_-]+\b', sent_clean)
                word_count = len(words)

                # 3. Sentence length check
                is_procedural = bool(re.match(r'^\d+[\.\)]\s+|^[-*]\s+|^(Step|\d+)', line_str, re.IGNORECASE))
                max_allowed = self.dict.rules.get("max_sentence_length_procedural", 20) if is_procedural else self.dict.rules.get("max_sentence_length_descriptive", 25)

                if word_count > max_allowed:
                    violations.append(STEViolation(
                        line_num=line_idx,
                        rule_id="STE-002-SENTENCE-LENGTH",
                        severity="WARNING",
                        message=f"Sentence has {word_count} words (max allowed: {max_allowed} words for {'procedural' if is_procedural else 'descriptive'} text).",
                        original_text=sent_clean
                    ))

                # 4. Passive voice check
                passive_match = self.passive_pattern.search(sent_clean)
                if passive_match:
                    violations.append(STEViolation(
                        line_num=line_idx,
                        rule_id="STE-003-PASSIVE-VOICE",
                        severity="WARNING",
                        message=f"Passive voice detected ('{passive_match.group(0)}'). Use active voice in STE.",
                        original_text=passive_match.group(0)
                    ))

        return violations

    def autofix_text(self, text: str) -> str:
        fixed_lines = []
        for line in text.splitlines():
            fixed_line = line
            for unapp_phrase, info in self.dict.unapproved_words.items():
                replacement = info.get("replacement")
                if replacement and "/" not in replacement:
                    pattern = r'\b' + re.escape(unapp_phrase) + r'\b'
                    fixed_line = re.sub(pattern, replacement, fixed_line, flags=re.IGNORECASE)
            fixed_lines.append(fixed_line)
        return "\n".join(fixed_lines)
