# Ogma

Private resume builder. The web app lives in `apps/web` and the API in `apps/api`. See [PLAN.md](PLAN.md) and [ARCHITECTURE.md](ARCHITECTURE.md).

## Local development

Use Node.js 24.15 or later on the 24.x line, Corepack, and Docker Compose. Run these commands from the repository root.

1. Copy `.env.example` to `.env.local` at the root and in both apps if the local files are missing. PostgreSQL defaults to host port 5432. If you change its credentials or port, update the API's `DATABASE_URL` too.
2. Run `corepack yarn install --immutable`.
3. Start PostgreSQL with `corepack yarn db:up`. Use `corepack yarn db:down` to stop it and retain its data.
4. Run `corepack yarn dev`. Open [Ogma](http://localhost:3000) or check [API health through Next.js](http://localhost:3000/api/health). NestJS listens on port 3001.

Run `corepack yarn build`, `corepack yarn lint`, `corepack yarn typecheck`, and `corepack yarn format:check` before integrating changes. Install Playwright Chromium with `corepack yarn workspace @ogma/api exec playwright install chromium` when working on PDF rendering.

The API health route is a process check. Database connection, schema, and migrations are the next implementation step.

## Optional AI configuration

The planned rewrite and cover letter features will use `AI_API_KEY`, `AI_BASE_URL`, and `AI_MODEL` from `apps/api/.env.local`. Set these to the credentials, API base URL, and model ID for your OpenAI-compatible provider when those features are implemented. Resume Check works independently of AI.
