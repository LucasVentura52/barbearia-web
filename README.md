# Barbearia Web (Vue + Vite)

## Env Vars

- `VITE_API_URL` (example: `https://barbearia-api-uhux.onrender.com`)
- `VITE_COMPANY_SLUG` (example: `default`)

Local development example: `.env.example`

Production defaults: `.env.production`

## Run Local

```bash
npm install
npm run dev
```

## Deploy (Render)

Create a **Static Site** on Render:

- Build Command: `npm ci && npm run build`
- Publish Directory: `dist`

Set env vars (at least):

- `VITE_API_URL=https://barbearia-api-uhux.onrender.com`
- `VITE_COMPANY_SLUG=default`
