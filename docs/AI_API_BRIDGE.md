# Chemistry Framework — optional OpenAI API bridge (prototype)

This is an **opt-in**, single-maintainer prototype. It does not replace the deterministic science models, and it is **not deployed** merely by merging the code.

## What exists

- Offline “分析命题”: remains entirely local and unchanged.
- “AI 深度审查”: sends a hypothesis and optional system conditions from the browser to a separately hosted CF backend.
- Backend: `POST /api/analyze` -> OpenAI Responses API -> text analysis, explicitly labelled **not verified**.
- Backend does **not** run web search, retrieve papers, query your scientific model solvers, or verify citations.
- The browser never receives `OPENAI_API_KEY`. Its `CF_ACCESS_TOKEN` is a **separate** token protecting your own backend.

## Requirements

- Node.js 20+ with built-in `fetch`.
- A valid OpenAI API project with remaining budget/billing and a model that the project can access.
- A hosting service capable of running a persistent Node.js backend over HTTPS; GitHub Pages alone cannot do this.
- `OPENAI_API_KEY` must be a server-side secret only.

## Local setup

1. Generate a separate access token. For example:
   `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`
2. Set these **server-side** environment variables. Windows PowerShell example (replace placeholders locally):
   ```powershell
   $env:OPENAI_API_KEY="your-real-secret-key"
   $env:CF_ACCESS_TOKEN="your-generated-random-access-token"
   $env:CF_ALLOWED_ORIGINS="http://localhost:8000"
   $env:CF_MODEL="gpt-4.1-mini"
   node server/index.mjs
   ```
3. In another terminal, start your static site from the repository root:
   `python -m http.server 8000`
4. Open `http://localhost:8000/` -> “验证我的直觉” -> “AI 深度审查”.
5. Enter the backend root address `http://localhost:8787` and the separately generated CF access token; **never** enter the OpenAI API Key into the browser input.
6. Submit a hypothesis. The result is labelled model-generated and unverified.

`server/.env.example` is a reference for deployment environment variables; Node does not load the file automatically. Do not upload real secrets or put them into a committed `.env`.

## Production deployment

1. Deploy the backend with `node server/index.mjs` as the start command on a Node-compatible HTTPS hosting provider.
2. Set `OPENAI_API_KEY`, `CF_ACCESS_TOKEN`, `CF_ALLOWED_ORIGINS=https://yangzhexi381-dot.github.io`, `CF_MODEL`, and `PORT` using the provider's **secret/environment settings**.
3. Open the GitHub Pages site. Enter the backend's **HTTPS origin** and the CF access token in the optional analysis panel.
4. Check `GET /health` and run a deliberate test request. Ensure CORS accepts only the Pages origin and the token is required.
5. Configure API project budget alerts and spending limits on the OpenAI platform. Real calls consume API credits; a ChatGPT subscription does not cover them.

## Security and scientific limits

- Use HTTPS for all non-local requests. Never log real credentials, and never store the CF access token in a public repository.
- The frontend never saves the CF token to `localStorage`; it stays in the password field until the page is closed.
- The prototype enforces an allowed-origin list, separate access token, body length cap and in-memory IP rate limit. **CORS is not authentication.** This is not sufficient for public anonymous or multi-user deployment.
- For a public product, replace the shared token with per-user authentication, quotas, persistent rate limits, abuse protection and privacy controls. Lock down the backend independently of CORS.
- The output is **not peer-reviewed and does not constitute measured or independently verified evidence**. No citations, experimental results, thermodynamic constants or kinetic parameters should be treated as sourced unless verified elsewhere.
- Preserve the separate `src/models/` scientific calculations and their tests. Future tool-assisted analysis can call those verified functions via a documented protocol rather than asking a model to invent numeric results.

## Local tests

```bash
node --test tests/*.test.cjs server/*.test.mjs
```

The test suite does not require a real OpenAI API Key and must not make paid model calls.
