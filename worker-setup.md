# NGMI Bot — Cloudflare Worker Setup

## Overview

`worker.js` is a zero-dependency Cloudflare Worker that acts as the Telegram webhook for `@NGMI_TON_BOT`. It handles `/start` commands with optional referral payloads and sends back an inline keyboard button that opens the NGMI Mini App.

---

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | Health check → `{"ok":true}` |
| `POST` | `/` | Telegram webhook receiver |
| `GET` | `/set-webhook?url=<WORKER_URL>` | Register webhook with Telegram |

---

## Deploy to Cloudflare Workers (Free Tier)

### Option A — Wrangler CLI (recommended)

1. **Install Wrangler**
   ```bash
   npm install -g wrangler
   ```

2. **Login**
   ```bash
   wrangler login
   ```

3. **Create `wrangler.toml`** in the `ngmi-game/` directory:
   ```toml
   name = "ngmi-bot"
   main = "worker.js"
   compatibility_date = "2024-01-01"
   compatibility_flags = ["nodejs_compat"]
   ```

4. **Deploy**
   ```bash
   cd ngmi-game
   wrangler deploy
   ```

   Wrangler will print your worker URL, e.g.:
   ```
   https://ngmi-bot.<your-subdomain>.workers.dev
   ```

### Option B — Cloudflare Dashboard (no CLI)

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages** → **Create Application** → **Create Worker**
2. Paste the contents of `worker.js` into the editor
3. Click **Save and Deploy**
4. Note the generated `*.workers.dev` URL

---

## Register the Webhook

After deploying, register your worker URL as the Telegram webhook:

```
GET https://ngmi-bot.<your-subdomain>.workers.dev/set-webhook?url=https://ngmi-bot.<your-subdomain>.workers.dev/
```

You can open this URL in your browser, or run:

```bash
curl "https://ngmi-bot.<your-subdomain>.workers.dev/set-webhook?url=https://ngmi-bot.<your-subdomain>.workers.dev/"
```

Expected response:
```json
{"ok":true,"result":true,"description":"Webhook was set"}
```

### Verify webhook is set

```bash
curl "https://api.telegram.org/bot8733328088:AAE2CMtfiAL5RHU1jE6uUNnP7-tJ4h6pLAE/getWebhookInfo"
```

---

## How Referrals Work

1. You generate a referral link: `t.me/NGMI_TON_BOT?startapp=ref_USERNAME`
2. User clicks it → Telegram opens the bot and sends `/start ref_USERNAME`
3. Worker receives the webhook, extracts `USERNAME` from the payload
4. Bot replies with a welcome message + button that opens:
   ```
   https://dearsealx-blip.github.io/ngmi-game/?ref=USERNAME
   ```
5. Your Mini App reads `?ref=` from the URL and attributes the referral

---

## Keeping the Bot Token Safe (optional hardening)

Instead of hardcoding the token, store it as a Cloudflare secret:

```bash
wrangler secret put BOT_TOKEN
```

Then update `worker.js` to read it from the environment:

```js
// In the fetch handler:
const BOT_TOKEN = env.BOT_TOKEN;
// Pass `env` through: export default { async fetch(request, env) { ... } }
```

This keeps the token out of source control.

---

## Quick Test (no deploy needed)

You can test locally with Wrangler:

```bash
wrangler dev
```

Then in another terminal:

```bash
# Health check
curl http://localhost:8787/

# Simulate a /start ref_alice webhook call
curl -X POST http://localhost:8787/ \
  -H "Content-Type: application/json" \
  -d '{
    "update_id": 1,
    "message": {
      "message_id": 1,
      "from": {"id": 123, "first_name": "Bob", "is_bot": false},
      "chat": {"id": 123, "type": "private"},
      "text": "/start ref_alice"
    }
  }'
```
