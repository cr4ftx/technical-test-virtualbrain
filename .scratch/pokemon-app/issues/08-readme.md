# 08: README

**What to build:** A reviewer can clone the repo and run everything from the README alone.

**Blocked by:** 04, 07

**Status:** resolved

- [x] Prerequisites and install steps for backend and web app
- [x] Env setup: copying `.env.example`, where to get the VirtualBrain token
- [x] How to run the backend and the frontend in dev, and how to run tests
- [x] How to generate the export and build the brain and chatbot from it
- [x] A short design-decisions section: disk cache, slim list, SSE protocol, server-owned battle state, damage formula, move-choice parsing and fallback
- [x] Replaces the exercise statement (kept or linked separately)

## Comments

**2026-11-22**: Implemented on `swanncastel/08-readme`. Notes against the ticket:

- The exercise statement moved to `docs/exercise.md` and is linked from the README.
- Node 24+ (the current LTS) is listed as the minimum. Type stripping is unflagged from 22.18, but the project is only checked on Node 26.
- The boilerplate `backend/README.md` and `web-app/README.md` are deleted: the root README replaces them.
