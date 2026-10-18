# GlassPDF WhatsApp pilot backend

Status: implemented and unit-tested, **not connected to a live WhatsApp account or deployed**. Browser GlassPDF remains local-only; this separate bot receives files through Meta and processes them in backend memory.

## Supported pilot jobs

- Send JPG/PNG with caption `pdf` → A4 PDF.
- Send PDF with caption `rotate 90`, `rotate 180`, or `rotate 270`.
- Send PDF with caption `extract 1-3,5`.
- Default caption `pdf` copies a PDF into a new output.
- Five jobs per sender per UTC day; reserve before processing, refund on failure.
- 25 MB input/output; up to 100 source PDF pages.
- Server-wide 500 outbound sends/day maximum, plus configured estimated monetary cap.
- No live checkout. Limit replies identify Free and direct users to request Pro; no paid entitlement is implied.

## Accounts needed — owner steps

1. Create Render account and connect the existing `nymav/glasspdf` repository. Accept account terms yourself.
2. Create a durable PostgreSQL database. A separate provider is needed; do not use the Render service's temporary filesystem for quotas. Check the chosen provider's actual free allowance and expiry conditions.
3. Create a Meta Business Portfolio and developer app with WhatsApp. Start with the Meta test number. Check coexistence eligibility before changing the existing WhatsApp Business app number; do not delete that account.
4. Keep tokens, app secret and database URL in Render's environment settings. Never put them in Git, browser code, URLs or chat.

## Deploy

Use Render's Blueprint deployment for this repo's `render.yaml`, or create a Node web service with root `services/whatsapp`, build `npm ci`, start `npm start`, and health path `/health`. Select Free explicitly and inspect any billing prompts before proceeding.

Copy keys from `.env.example` into the service settings. Choose the currently supported Graph API version in Meta and set `META_API_VERSION`; this is intentionally not hardcoded. Set a long random webhook verification token. Set `OUTBOUND_COST_MICRO` only after verifying applicable message costs. One million micro-units equals one unit of the chosen currency. For a verified ₹0.10 conservative reply estimate, cost=100000; a ₹10 daily estimated cap=10000000. These are examples, not current Meta prices. Set zero only when that message type is verified free. Limits estimate outbound-message cost; they do not cap every infrastructure or provider charge.

Leave `ENABLE_OUTBOUND=false` until credentials, database, cost policy and test recipient are configured. `/health` returns `setup-required` until required settings exist. The free service can sleep and delay webhook handling.

In Meta set callback `https://YOUR-SERVICE.onrender.com/webhook`, the matching verify token, and subscribe to `messages`. Use the test recipient flow. Verify image conversion, PDF extraction, duplicate webhook handling and quota exhaustion before considering the real number.

## Validation

```sh
cd services/whatsapp
npm ci
npm test
npm start
```

Without secrets, the service serves `/health` as setup-required and rejects webhook POST requests with 503. Unit tests cover signatures, commands, page ranges and PDF transformations. No real messages are sent by tests. PostgreSQL queries and live Meta interoperability still require integration testing after account setup.

## Data and reliability boundaries

Files are buffered in process memory, not written to disk. Processed outbound media is deleted from Meta via API on a best-effort basis after sending; Meta and recipients may retain copies. Sender IDs are HMAC-pseudonymised in usage records. Deduplication IDs and counters are cleaned after seven days on startup. Do not claim immediate universal deletion or end-to-end privacy beyond these boundaries.

This pilot has one in-process worker and no durable job queue: a process interruption after webhook acknowledgement can lose a job or leave an allowance reservation. Duplicate IDs prevent straightforward replay but do not guarantee exactly-once delivery. Provider send failures can have uncertain delivery status. Upgrade to a durable queue, reconciliation, isolated resource-limited conversion workers, monitoring and real billing-webhook verification before broader production use. Files can consume substantial resources despite byte/page limits; this is not a hardened public conversion service.
