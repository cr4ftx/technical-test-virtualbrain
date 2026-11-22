# 01: Groundwork: test runner, env and PokeAPI retries

**What to build:** Prefactor the backend so later tickets land easily. The backend gets a working test runner, reads its secrets from a gitignored env file, and every PokeAPI call survives transient failures.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Vitest is installed in the backend, with a `test` script that runs and passes
- [ ] The backend loads environment variables from a gitignored `.env` (Node's `--env-file`, no dotenv dependency) in both dev and start scripts
- [ ] A committed `.env.example` documents every variable (port, CORS origin, VirtualBrain token placeholder)
- [ ] PokeAPI calls retry up to 3 times with backoff on network errors, 5xx and 429; other 4xx fail immediately
- [ ] Retry behaviour is covered by unit tests (retries then succeeds, gives up after 3, no retry on 404)
- [ ] Typecheck and lint pass with strict mode still on
