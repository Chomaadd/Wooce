---
name: Midtrans payment integration
description: How Midtrans Snap is wired up in the WOOCE Novel platform — model, routes, frontend, async DB config pattern.
---

## Architecture
- Payment model: `server/paymentModel.ts` — TopupOrderModel + COIN_PACKAGES constant
- Type declaration: `server/midtrans.d.ts` — midtrans-client has no @types package
- Backend routes in `server/routes.ts` (after the coin routes section):
  - `GET /api/payment/config` — async; serves clientKey + isSandbox flag from DB via getEffectiveConfig()
  - `GET /api/payment/packages` — lists coin packages
  - `POST /api/payment/topup/create` — creates Snap transaction, saves TopupOrder
  - `POST /api/payment/notification` — Midtrans webhook, adds coins on success
  - `GET /api/payment/topup/status/:orderId` — polls order status
- Frontend modal: `client/src/components/payment/TopupModal.tsx`
  - Loads Snap.js dynamically using clientKey from /api/payment/config
  - Calls `window.snap.pay(token, { onSuccess, onPending, onError, onClose })`

## CRITICAL: getMidtransSnap() must be async + use getEffectiveConfig()
`getMidtransSnap()` MUST be `async` and call `await getEffectiveConfig()` to fetch keys from DB.
Never read `process.env.MIDTRANS_*` directly — admin can set keys via Credentials dashboard (MongoDB).
If the function reads only process.env, Midtrans returns "Access denied unauthorized transaction" (HTTP 401).

## Admin settings (DB-backed, overrides env vars)
Fields in `server/site-config.ts`: `midtransServerKey`, `midtransClientKey`, `midtransIsProduction` (string "true" or "").
`getEffectiveConfig()` merges DB value over `process.env` fallback.
Admin UI: `Credentials.tsx` → "payment" group with setup guide and Notification URL helper.

## Webhook
Midtrans must be configured to POST to: `https://<domain>/api/payment/notification`
In Midtrans dashboard → Settings → Configuration → Payment Notification URL

## Coin packages (defined in paymentModel.ts)
pkg_10: 10 coins / Rp 5.000
pkg_30: 30 coins / Rp 12.000
pkg_50: 50 coins / Rp 18.000 (marked POPULER)
pkg_100: 100 coins / Rp 30.000

**Why Snap API:** Handles GoPay/OVO/QRIS/bank transfer with one simple token flow.
