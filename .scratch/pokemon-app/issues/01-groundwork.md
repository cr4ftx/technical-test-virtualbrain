# 01: Groundwork: test runner, env and PokeAPI retries

**What to build:** Prefactor the backend so later tickets land easily. The backend gets a working test runner, reads its secrets from a gitignored env file, and every PokeAPI call survives transient failures.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] Vitest is installed in the backend, with a `test` script that runs and passes
- [x] The backend loads environment variables from a gitignored `.env` (Node's `--env-file`, no dotenv dependency) in both dev and start scripts
- [x] A committed `.env.example` documents every variable (port, CORS origin, VirtualBrain token placeholder)
- [x] PokeAPI calls retry up to 3 times with backoff on network errors, 5xx and 429; other 4xx fail immediately
- [x] Retry behaviour is covered by unit tests (retries then succeeds, gives up after 3, no retry on 404)
- [x] Typecheck and lint pass with strict mode still on

## Comments

**2026-11-22**: Implemented in PR #1 (`swanncastel/01-groundwork`). Agreed changes from the ticket:

- ts-node dropped for Node 26 native type stripping: the backend is ESM, relative imports carry `.ts`, `tsc` is typecheck-only (`erasableSyntaxOnly`), and nodemon / `build` / `dist` are gone (`dev` is `node --watch`).
- `--env-file-if-exists` instead of `--env-file`, so a fresh clone boots without a `.env`.
- "Up to 3 times" means 3 retries after the first attempt (4 attempts max), with a 10 s request timeout so stalled connections get retried too.
- TypeScript pinned to 5.9: typescript-eslint doesn't support TS 7 yet.
