---
name: asd-ste100-verifier
description: "Use to audit, test, and enforce ASD-STE100 (Simplified Technical English) standards across conversation outputs, documentation drafts, and repository Markdown files. Evaluates vocabulary against the controlled STE dictionary and checks sentence length, passive voice, noun clusters, and verb tenses."
---

# ASD-STE100 Verifier and Audit Skill

Use this skill when the user asks to audit, test, rewrite, or enforce ASD-STE100 rules in written technical documentation or conversation responses.

---

## 1. Core ASD-STE100 Rules

Enforce these five principles when reviewing or writing text in ASD-STE100:

1. **Approved Vocabulary Only**
   * Check words against `assets/data/ste-dictionary.json` and `.ste-technical-terms.json`.
   * Use approved STE replacement terms:
     * Use `start` (do not use other words).
     * Use `use` (do not use other words).
     * Use `before` (do not use other words).
     * Use `after` (do not use other words).
     * Use `to` (do not use other words).
     * Use `if` (do not use other words).
     * Use `because` (do not use other words).

2. **Sentence Length Limits**
   * **Procedure Instructions:** Max 20 words per sentence.
   * **Description Statements:** Max 25 words per sentence for description text.

3. **Active Voice Only**
   * Write all sentences in active voice.
   * *Example:* `The technician installed the component.`

4. **Noun Cluster Limit**
   * Limit consecutive noun strings to max 3 nouns.
   * *Example:* `connector for the primary fuel line seal`

5. **Procedure Imperative Mood**
   * Start each procedure step with an imperative verb (e.g. `Remove`, `Install`, `Check`, `Turn`, `Open`, `Clean`).

---


## 2. Text-First Vocabulary Triage and Orthogonal Value Methodology

Follow this strict methodology when handling unlisted or non-compliant vocabulary:

### Principle A: Text Rewriting First, Dictionary Expansion Last
* Do not expand the dictionary to remove linter errors.
* Rewrite text with approved STE words (~900 root words) when possible.

### Principle B: The Orthogonal Value Test for Technical Terms
* Include a word in `.ste-technical-terms.json` ONLY if it is an indispensable technical term (`python`, `git`, `json`, `markdown`).
* Reject abstract nouns and general synonyms (`candidates`, `outcomes`, `considerations`, `rationale`). Rewrite sentences with approved STE words.

### 3-Step Rewriting Workflow
1. **Step 1 (Core STE Rewrite):** Rewrite the sentence with approved STE words.
2. **Step 2 (Orthogonal Value Check):** If rewriting removes an indispensable technical term, check if the term adds net positive value.
3. **Step 3 (3-Axis Option Ranking):** Rank candidate rewrites across three axes:
   * **Axis 1 (Intent Fidelity):** Keeps exact technical meaning and communication intent.
   * **Axis 2 (STE Conformance):** Reaches 100% compliance with STE vocabulary and grammar rules.
   * **Axis 3 (Brevity and Directness):** Uses short, direct imperative phrasing.

---


## 3. Automated Pre-Flight Response & File Linter Workflow

Before finalizing chat response text or writing Markdown files, the agent MUST run this automated pre-flight check:

1. **Pre-Flight In-Memory Lint Pass:**
   * Evaluate draft response sentences against `assets/data/ste-dictionary.json` and `.ste-technical-terms.json` in memory.
2. **Immediate Pre-Flight Correction:**
   * Rewrite any flagged non-STE tokens using core approved STE words before outputting text.
3. **Automated Lifecycle Hook:**
   * The `post_file_write` hook automatically runs `python3 -m ste_verifier.cli --fix` on any modified Markdown file.

---


## 4. Automated CLI Execution

Run the local check engine against Markdown files or documentation:
```bash
# Audit a single Markdown file or document
python3 -m ste_verifier.cli <filename.md>

# Audit multiple files in strict mode
python3 -m ste_verifier.cli <filename.md>

# Automatically fix unapproved vocabulary terms in-place
python3 -m ste_verifier.cli --fix <filename.md>
```

---


## 5. Harness & Repository Installation Runbook

Follow these five steps to install the STE Verifier into a new repository harness:

1. **Install Verifier Engine and Master Dictionary:**
   * Copy `ste_verifier/` module and `assets/data/ste-dictionary.json` into the target repository root.

2. **Initialize Local Technical Terms Glossary:**
   * Create `.ste-technical-terms.json` in the target workspace root to store project Technical Names and Technical Verbs.

3. **Deploy Workspace Directives and Skill:**
   * Copy this `SKILL.md` into the target harness skill directory.

4. **Configure Automated Lifecycle Hooks:**
   * Create `.agents/hooks.json` with a `post_file_write` hook executing `assets/scripts/post_write_ste_check.py $FILE`.

5. **Configure CI Pipeline Check:**
   * Add `python3 -m ste_verifier.cli <files.md>` to GitHub Actions or CI test runner to enforce 100% compliance.
