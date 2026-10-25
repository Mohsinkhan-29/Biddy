# Biddy website

Landing page, extension download, account (plan + upgrade requests) and admin. Talks to `biddy-backend`.

```bash
cp .env.example .env.local   # fill in NEXT_PUBLIC_API_URL and NEXT_PUBLIC_GOOGLE_CLIENT_ID
npm install
npm run dev                  # http://localhost:3000
```

- Payment details shown on the account page: `src/lib/config.ts` → `PAYMENT_METHODS`
- Extension download: build the extension, zip its `dist/` folder, save as `public/downloads/biddy-extension.zip`
- Admin page: `/admin`, for Google accounts listed in the backend's `ADMIN_EMAILS`
