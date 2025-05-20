# AGENTS.md – Contributor Guide for Codex + Human Collaboration

This file defines how Codex agents and human contributors must interact with this repository. It includes directory structure, style guidelines, validation rules, commit expectations, and environment setup requirements.

---

## 📁 Project Structure

Use and respect the following directory conventions:

* `/scripts/` — Standalone utilities or CLI tools
* `/components/` — Front-end modules or reusable interface logic
* `/models/` — Algorithms, data logic, ML models, or domain-specific processing
* `/data/` — Static or dynamic input/output files (e.g. CSV, JSON, config)
* `/tests/` — All validation, test cases, or verification logic

> Only touch what's necessary for your assigned task. If unsure, explore file context before modifying anything.

---

## ✍️ Code Style Guidelines

### Python

* Use PEP8 (4 spaces, `snake_case`, imports at top).
* Prefer pure functions with clear inputs and outputs.
* Avoid logic in `__main__` unless writing CLI tools.

### JavaScript / TypeScript

* Use functional components, avoid class-based React.
* Use Prettier defaults for formatting.
* Enforce ESLint rules.

### Markdown / Docs

* Use headers (`#`, `##`) to organize content.
* Prefer bullet lists to long paragraphs.
* Wrap lines at 100 characters.

---

## ✅ Validation Instructions

All changes must pass validation before commit:

### Python

* Run tests with:

  ```bash
  pytest tests/
  ```
* Linting (if configured):

  ```bash
  flake8 .
  # or
  ruff .
  ```
* Pre-commit (if configured):

  ```bash
  pre-commit run --all-files
  ```

### JavaScript / TypeScript

* Run tests with:

  ```bash
  npm test
  # or
  pnpm test
  # or
  vitest
  ```
* Lint:

  ```bash
  eslint .
  ```
* Format check:

  ```bash
  prettier --check .
  ```

> If no tests exist, verify that the code or tool runs correctly without error.

---

## 🔧 Environment Setup

Before any work is done, run:

```bash
./setup.sh
```

This is mandatory. Codex environments **lose network access** after setup. Skipping this step will break most validations.

### What it installs:

* **Python**

  * `pip install -r requirements.txt` (if file exists)
  * `pre-commit` and hook config (if `.pre-commit-config.yaml` exists)
* **Node.js / TypeScript**

  * Installs `package.json` dependencies using `pnpm` if available, else `npm`

> Do not skip this. If you change `setup.sh`, validate it still works before committing.

---

## 🧱 Git Rules

* Do **not** create new branches.
* Leave Git state clean: `git status` should show no changes after commit.
* Use `git commit` only (no amend or squash).
* Follow pre-commit rules and fix any violations before retrying.
* Do not touch existing commits.

---

## 📟 Commit / Patch Summary Format

Use this format for Codex-compatible PR summaries:

### Example

```md
### Summary
- Refactored input validation into standalone module
- Updated two utility functions for consistency
- Added tests to cover new edge cases

### Citations
- Code: 【F:scripts/validator.py†L8-45】
- Terminal: 【cmd-setup123†L12-21】
```

All changed lines must be cited using Codex file/terminal citation rules. Do not skip this.

---

## 🤖 Agent Behavior Expectations

* Always inspect full context of modified files before editing.
* Do not patch line-by-line — rewrite full logical blocks when editing.
* Run all required validation steps and cite results.
* Use complete, final code blocks in commits — no ellipses or partials.
* Nested `AGENTS.md` files override this one for scoped rules.
* Prompt-level instructions override this file but must still follow the spirit of these rules.

---

## 🧼 Final Notes

This file is required reading for any contributor or agent operating in this repo. If you modify it, do so responsibly and update validation or setup processes as needed.

```
```
