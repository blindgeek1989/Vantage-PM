# VantagePM License Worker

Cloudflare Worker that handles:
- **POST /validate** — license key validation against a KV store
- **POST /feedback** — GitHub Issues proxy (keeps the PAT server-side)

## One-time setup

### 1. Install Wrangler

```
npm install -g wrangler
wrangler login
```

### 2. Create the KV namespace

```
wrangler kv namespace create LICENSES
wrangler kv namespace create LICENSES --preview
```

Copy the IDs into `wrangler.toml`, replacing `REPLACE_WITH_YOUR_KV_NAMESPACE_ID`
and `REPLACE_WITH_YOUR_KV_PREVIEW_ID`.

### 3. Set the GitHub feedback token secret

Create a fine-grained GitHub PAT with **Issues: write** permission on the
`blindgeek1989/Vantage-PM` repository. Then:

```
wrangler secret put GITHUB_FEEDBACK_TOKEN
```

Paste the token when prompted.

### 4. Deploy

```
cd worker
wrangler deploy
```

The deployed URL will look like:
`https://vantagepm-license.blindgeek1989.workers.dev`

Update `WORKER_URL` in `docs/renderer.js` if the URL differs.

## Managing license keys

Add a key:
```
wrangler kv key put --namespace-id=YOUR_KV_ID "VANTAGE-XXXX-XXXX-XXXX" '{"tier":"pro","email":"user@example.com","active":true}'
```

Deactivate a key:
```
wrangler kv key put --namespace-id=YOUR_KV_ID "VANTAGE-XXXX-XXXX-XXXX" '{"tier":"pro","email":"user@example.com","active":false}'
```

List all keys:
```
wrangler kv key list --namespace-id=YOUR_KV_ID
```

## Key format

Recommended: `VANTAGE-XXXX-XXXX-XXXX` (uppercase, stored as-is in KV).
The web app normalizes input to uppercase before sending.

## Local dev

```
cd worker
wrangler dev
```

Point `WORKER_URL` in `docs/renderer.js` to `http://localhost:8787` temporarily.
