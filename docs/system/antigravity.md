# Antigravity Context System for "모두의 AI" (Modu AI)

This file (`ANTIGRAVITY.md`) and the `.antigravity/` directory serve as the central brain for the project. Access these files to restore context, understand current progress, and execute standard workflows efficiently.

## 📂 Context Directory Structure
- **`.antigravity/tasks.md`**: The living checklist of past, current, and future tasks.
- **`.antigravity/plan.md`**: Technical Implementation Plan for the current phase.
- **`.antigravity/status.md`**: High-level summary of what has been built (Walkthrough/Journal).
- **`.antigravity/workflows/`**: Reusable guides for repetitive tasks.

## 🚀 Quick Workflows
Use `view_file` on these guides to ensure consistent execution.

- **[Commit & Push](file:///.antigravity/workflows/git_commit.md)**: Standard procedure for saving work.
- **[Debugging](file:///.antigravity/workflows/debugging.md)**: Systematic approach to solving errors.
- **[Commit & Push](file:///.antigravity/workflows/git_commit.md)**: Standard procedure for saving work.
- **[Debugging](file:///.antigravity/workflows/debugging.md)**: Systematic approach to solving errors.

## 📜 Workflow Rules & Optimization Protocol
The agent **MUST** check these rules before generating task completions.

### 1. File & Folder Organization
- **Documentation**: All `.md` files (except `README.md`) MUST reside in `docs/` subdirectories (`docs/management/`, `docs/system/`, `docs/design/`).
- **Skills**: Repetitive workflows MUST be defined in `skills/[snake_case]/SKILL.md`.
- **Root Directory**: Keep clean. Only config files and `README.md` allowed.

### 2. Naming Conventions
- **Files**: `snake_case.md` (Exception: `README.md`).
- **Folders**: `snake_case`.

### 3. Post-Work Optimization Protocol
**CRITICAL**: AT THE END OF EVERY SESSION or MAJOR TASK:
1. **Move loose files** to `docs/` or `.antigravity/`.
2. **Standardize filenames** to `snake_case`.
3. **Update Index** references.
4. **Git Sync** using `git_sync_project`.

## 📍 Current Project State
> **Project**: 모두의 AI (formerly GenAI Nexus)
> **Stack**: Vite, React, TypeScript, Tailwind, Shadcn/UI, Supabase (Mocked)
> **Repo**: https://github.com/duckychoi/moduAI

**Active Phase**: Phase 5 (Deployment & Management)
**Latest Action**: Renamed project from "GenAI Nexus" to "모두의 AI".
