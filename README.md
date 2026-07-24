# SwaCord 🌀

**SwaCord** is a fast, lightweight, serverless Peer-to-Peer (P2P) messenger and video-calling web app. It connects people directly through the browser using native WebRTC — no accounts, no installs, no dedicated media server.

## ✨ Features

- **P2P audio & video calls** — native `RTCPeerConnection`, no third-party media relay required for the call itself.
- **Screen sharing** (desktop browsers).
- **File sharing** — up to 2 MB, sent directly over a WebRTC data channel.
- **Real-time text chat** with emoji and typing indicators.
- **Two room types**:
  - **Direct link rooms** — pure P2P, signalling only, no data ever touches your database.
  - **Cloud rooms** (`v_...` room IDs) — presence/host-election and multi-peer mesh discovery backed by Vercel + Upstash Redis, so a room can survive the creator refreshing or leaving.
- **Host controls** — mute, kick, ban, transfer host.
- Light/dark theme, responsive layout, English/Russian/Ukrainian UI.

## 🏗 Architecture

There is no media server and no persistent app server — everything runs as static files plus three tiny Vercel Serverless Functions that only do **signalling and presence**, never audio/video:

| Path            | Purpose                                                                 |
|-----------------|--------------------------------------------------------------------------|
| `index.html`, `script.js`, `style.css` | The entire client app (static, servable from anywhere). |
| `api/signal.js` | Exchanges WebRTC offers/answers/ICE candidates between two peer IDs, via a short-lived Redis list. Polled every second by the client. |
| `api/room.js`   | Tracks which peer IDs are currently in a room (30s heartbeat TTL) and elects a host. |
| `api/chat.js`   | Optional server-side chat history for cloud rooms (last 200 messages, 30-day TTL). |

All three use [Upstash Redis](https://upstash.com) (`@upstash/redis`) via `Redis.fromEnv()`. **The app will not work at all — signalling, presence, and chat history will all fail — until Upstash is configured**, see below.

WebRTC connections use Google STUN servers plus TURN fallback (PeerJS's public TURN and Open Relay Project) for peers behind restrictive NATs. Offer/answer collisions between two devices connecting at the same instant are resolved with the standard [Perfect Negotiation](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Perfect_negotiation) pattern.

## 🚀 Deploying to Vercel

### 1. Create the Redis database
1. Go to the [Upstash console](https://console.upstash.com/) and create a free **Redis** database (any region close to your users is fine).
2. Open the database → **Details** tab → copy the **REST URL** and **REST Token** (not the Redis protocol connection string — you need the REST API credentials).

### 2. Deploy the project
1. Push this repo to your own GitHub/GitLab/Bitbucket, or fork it.
2. In [Vercel](https://vercel.com/new), import the repository. Framework preset: **Other** (it's static + serverless functions, no build step needed).
3. Before the first deploy (or right after, then redeploy), go to **Project → Settings → Environment Variables** and add:

   | Name                       | Value                              |
   |-----------------------------|-------------------------------------|
   | `UPSTASH_REDIS_REST_URL`   | the REST URL from Upstash          |
   | `UPSTASH_REDIS_REST_TOKEN` | the REST token from Upstash        |

   (Alternatively: Vercel's **Integrations** marketplace has an official Upstash integration that creates the database and sets these two variables for you automatically.)
4. Redeploy (Environment Variable changes only apply to new deployments). Open the deployed URL — creating a room and opening the link on a second device/browser should now work.

### 3. Local development
`vercel dev` is required (not a plain static server) so that `/api/*` routes work locally:
```bash
npm i -g vercel
vercel link
vercel env pull .env.local   # pulls the two variables you set above
vercel dev
```

## 🔍 Troubleshooting "it doesn't connect between two devices"

In practice this is almost always one of:
1. **Missing/incorrect Upstash env vars** — check the Function Logs in the Vercel dashboard for a Redis error; every `/api/*` call will 500 until both variables are set correctly.
2. **Not served over HTTPS** — browsers block microphone/camera access (`getUserMedia`) on plain `http://`, except on `localhost`. Vercel deployments are HTTPS by default, so this only bites custom setups.
3. **Symmetric/very restrictive NAT** on one side — the built-in STUN servers can't traverse it and the call needs to fall back to TURN relay (SwaCord retries via TURN automatically on connection failure, which can take a few seconds).

## 📞 Support

Open-source, MIT licensed, free to use. If you find it useful, tips are appreciated: **Telegram: [@Snerma](https://t.me/Snerma)**.

## License

MIT — see [LICENSE](./LICENSE).
