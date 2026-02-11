# Editor Extension Recommendation Policy

This repository uses a **single, centralized VS Code recommendation set** in the root workspace file:

- `.vscode/extensions.json`

## Required AI assistant recommendations

The required AI-assistant tooling for this repo is:

1. `openai.chatgpt` (OpenAI ChatGPT extension, including Codex-capable workflows)
2. `google.geminicodeassist` (Gemini-compatible assistance)

### Jules compatibility

There is currently no standard, repo-supported Jules-specific VS Code extension ID configured in this repository. Jules usage remains policy-driven via automation/review workflow documentation, not via a pinned VS Code extension recommendation.

## Workspace consistency rule

App-level `.vscode/extensions.json` files should **not** duplicate the root recommendation set unless an app has a justified, app-specific need.

Current state:

- `apps/gs-web/.vscode/extensions.json`: not present
- `apps/gs-admin/.vscode/extensions.json`: not present

This keeps extension recommendations centralized at the root.
