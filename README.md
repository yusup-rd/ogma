# Ogma

Private resume builder. The web app lives in `apps/web` and the API in `apps/api`. See [PLAN.md](PLAN.md) and [ARCHITECTURE.md](ARCHITECTURE.md).

## Local development

Use Node.js 24.15 or later on the 24.x line, Corepack, and Docker Compose. Run these commands from the repository root.

1. Copy `.env.example` to `.env.local` at the root and in both apps if the local files are missing. PostgreSQL defaults to host port 5432. If you change its credentials or port, update the API's `DATABASE_URL` too.
2. Run `corepack yarn install --immutable`.
3. Start PostgreSQL with `corepack yarn db:up`. Use `corepack yarn db:down` to stop it and retain its data.
4. Apply the local PostgreSQL migrations with `corepack yarn db:migrate`.
5. Install Playwright Chromium with `corepack yarn workspace @ogma/api exec playwright install chromium`.
6. Run `corepack yarn dev`. Open [Ogma](http://localhost:3000) or check [API health through Next.js](http://localhost:3000/api/health). NestJS listens on port 3001.

Run `corepack yarn build`, `corepack yarn lint`, `corepack yarn typecheck`, and `corepack yarn format:check` before integrating changes.

The API health route is a process check. `/api/health/ready` checks PostgreSQL and the resume, authentication, and checkpoint tables. After signing in, use the Resumes dashboard to create, search, duplicate, or archive drafts. Ogma autosaves edits to PostgreSQL and checks the draft revision before saving, restoring a checkpoint, or exporting. Switch to Design to choose one of 23 layouts and tune its style. PDF export uses Playwright Chromium by default. For local development, you can set `CHROMIUM_CHANNEL=msedge` in `apps/api/.env.local` to use an installed Microsoft Edge browser.

## Owner sign-in

Register a confidential OpenID Connect web application with authorization code flow and S256 PKCE. Register the exact callback URL, for example `http://localhost:3000/api/auth/callback` for local development. In `apps/api/.env.local` set:

- `OGMA_PUBLIC_ORIGIN` to the browser-facing origin, such as `http://localhost:3000` locally or the HTTPS production origin.
- `OIDC_ISSUER` to the issuer identifier as published by the provider.
- `OIDC_CLIENT_ID` and `OIDC_CLIENT_SECRET` to the web application's credentials.
- `OIDC_OWNER_SUBJECT` to the owner account's stable `sub` claim for this application. Use the provider's subject identifier rather than an email address.
- `OIDC_TOKEN_AUTH_METHOD` to `client_secret_basic` if the provider requires HTTP Basic authentication. The default is `client_secret_post`.

Without OIDC configuration, the workspace and document API remain locked. Production requires HTTPS for both the public origin and the issuer. HTTP is available on loopback in development.

### Google setup

1. Open [Google Auth Platform](https://console.cloud.google.com/auth/overview), select a Google Cloud project, and set up Branding and Audience. For a personal Google account, choose External. You can add your account under Test users while setting up the app. [Google consent screen setup](https://developers.google.com/workspace/guides/configure-oauth-consent)
2. Under Clients, create a **Web application** client. Add `http://localhost:3000/api/auth/callback` to Authorized redirect URIs. When deploying to the planned hostname, register `https://ogma.yusuprd.com/api/auth/callback` for that deployment's client. [Google web client setup](https://developers.google.com/workspace/guides/create-credentials#web)
3. Get your Google account ID using [Google's OAuth 2.0 Playground](https://developers.google.com/oauthplayground/). Use its built-in credentials, enter `openid email` in Step 1, sign in with the owner account, and exchange the code in Step 2. In Step 3, send a GET request to `https://openidconnect.googleapis.com/v1/userinfo`. Copy the `sub` value from the response. [Google account ID and UserInfo](https://developers.google.com/identity/openid-connect/openid-connect#obtaininguserprofileinformation)
4. Add the following lines to the existing `apps/api/.env.local`, replacing the placeholders with the client credentials and account ID. Restart Ogma and open it using the same hostname and port as the callback.

```dotenv
OGMA_PUBLIC_ORIGIN=http://localhost:3000
OIDC_ISSUER=https://accounts.google.com
OIDC_CLIENT_ID=<web-client-id>
OIDC_CLIENT_SECRET=<web-client-secret>
OIDC_OWNER_SUBJECT=<google-account-sub>
```

Ogma requests `openid email` for Google and checks the signed token's `sub` against the configured owner. It stores the account ID in PostgreSQL and issues its own session.

## Optional AI configuration

The planned rewrite and cover letter features will use `AI_API_KEY`, `AI_BASE_URL`, and `AI_MODEL` from `apps/api/.env.local`. Set these to the credentials, API base URL, and model ID for your OpenAI-compatible provider when those features are implemented. Resume Check works independently of AI.
