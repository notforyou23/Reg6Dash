# AGENTS.md

## Coding Conventions
- Follow Python PEP8 style (4 spaces, snake_case).
- JS/TS should follow Prettier default formatting.
- No inline functions inside views or route handlers — extract logic to separate helpers.
- Keep function length under 50 lines when possible.

## File Structure Rules
- Place shared utilities in `/utils/` or `/lib/`.
- UI components go under `/components/`.
- Keep all model or AI logic in `/models/` or `/agents/`.

## Git & Commits
- Do not create new branches (Codex-enforced).
- All changes must be committed with:
  - Clear message summarizing the change.
  - File citations using `【F:<file_path>†L<line>】`.
- Keep Git state clean after every commit (`git status` should return nothing new).
- If pre-commit hooks exist, they must pass. Fix and re-commit if needed.

## Testing & Validation
- If any test suite exists (like `tests/` or `__tests__/`), run it before final commit:
  - Python: `pytest tests/`
  - JS/TS: `npm test` or `vitest`
- Do not skip testing unless explicitly allowed in task prompt.
- All static files (e.g. JSON, YAML, Markdown) should pass basic lint checks if configured.

## PR / Patch Summary Rules
- Patch summaries must:
  - List the main changes (in bullet format).
  - Include citations for all code edits.
  - Mention whether tests passed (terminal citation).

## Optional Tools / Notes
- Use `pre-commit` if configured (run with `pre-commit run --all-files`)
- If no formal test exists, run basic lints:
  - Python: `flake8 .`
  - JS/TS: `eslint .` or `npx prettier --check .`

## Jason-Specific Note
- If any player prop model, NFL prediction, or YouTube/Garcia code is updated, double-check model state, cached data, and output integrity.
- AI-generated code must be validated — don’t blindly trust output. (Yeah, even mine.)
