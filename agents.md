# AGENTS.md – Contributor Guide for Codex + Human Collaboration

This file outlines project-wide expectations for agents and human contributors working in this codebase. It defines structure, code style, commit discipline, and validation procedures.

---

## 📁 Project Structure

Use and respect the following conventions:

- `/scripts/`: Standalone scripts or one-off tools.
- `/components/`: UI elements or modular front-end logic.
- `/models/`: Machine learning, algorithms, or domain logic.
- `/data/`: Static files, config, inputs/outputs, or cached content.
- `/tests/`: Automated validation logic.

> ⚠️ Only touch what’s needed for the task. Ask or search context if unsure.

---

## ✍️ Code Style Guidelines

### Python
- PEP8 standard: 4 spaces, `snake_case` for functions.
- Avoid inline imports and side effects in modules.
- Keep functions under 50 lines unless justified.

### JavaScript / TypeScript
- Use functional components.
- Prefer hooks and destructuring.
- Respect Prettier formatting and ESLint rules.

### Markdown / Docs
- Use headers, bullets, and short paragraphs.
- Max line width: 100 characters.

---

## ✅ Validation Instructions

Changes must pass relevant checks before commit:

### Python
- `pytest tests/`
- `flake8 .` or `ruff .` if configured
- `pre-commit run --all-files` if available

### JS/TS
- `npm test`, `pnpm test`, or `vitest`
- `eslint .` and `prettier --check .`

> If no tests exist, validate that the app/tool runs without regression.

---

## 🧱 Git Rules

- **Do not create new branches.**
- Always leave the Git worktree clean: `git status` must be empty post-commit.
- Use `git commit`, not amend or squash.
- Follow any configured pre-commit hooks and fix violations before retrying.
- Do not modify or remove prior commits.

---

## 🧾 Commit / Patch Summary Format

### PR Message Style
```md
### Summary
- What changed and why
- Which files were touched
- Any validation steps taken

### Citations
- Code: `【F:src/tool.py†L12-34】`
- Terminal: `【cmd-abc123†L4-11】`
