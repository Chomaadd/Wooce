---
name: Midtrans payment integration
description: How Midtrans Snap is wired up in the WOOCE Novel platform — model, routes, frontend, env vars.
---

## Architecture
- Payment model: `server/paymentModel.ts` — TopupOrderModel + COIN_PACKAGES constant
- Type declaration: `server/midtrans.d.ts` — midtrans-client has no @types package
- Backend routes in `server/routes.ts` (after the coin routes section):
  - `GET /api/payment/config` — serves clientKey + isSandbox flag to frontend
  - `GET /api/payment/packages` — lists coin packages
  - `POST /api/payment/topup/create` — creates Snap transaction, saves TopupOrder
  - `POST /api/payment/topup/notification` — Midtrans webhook, adds coins on success
  - `GET /api/payment/topup/status/:orderId` — polls order status
- Frontend modal: `client/src/components/payment/TopupModal.tsx`
  - Loads Snap.js dynamically using clientKey from /api/payment/config
  - Calls `window.snap.pay(token, { onSuccess, onPending, onError, onClose })`

## Required env vars
- `MIDTRANS_SERVER_KEY` — server-side secret key from Midtrans dashboard
- `MIDTRANS_CLIENT_KEY` — client-side key (NOT secret, used in Snap.js)
- `MIDTRANS_IS_PRODUCTION` — set to "true" for production; default is sandbox

## Webhook
Midtrans must be configured to POST to: `https://<domain>/api/payment/topup/notification`
In Midtrans dashboard → Settings → Configuration → Payment Notification URL

## Coin packages (defined in paymentModel.ts)
pkg_10: 10 coins / Rp 5.000
pkg_30: 30 coins / Rp 12.000
pkg_50: 50 coins / Rp 18.000 (marked POPULER)
pkg_100: 100 coins / Rp 30.000

**Why:** Using Snap API (not Core API) because it handles GoPay/OVO/QRIS/bank transfer with one simple token flow.
