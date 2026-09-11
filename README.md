# Circular — Material Passports

Photograph a supplier receipt during construction. Circular logs what was purchased, then calculates embodied carbon and salvage value. The output is a digital birth certificate for the building.

Accounts, projects, and invoices are stored in MongoDB behind an Express API. Carbon factors are indicative, not a certified LCA.

## Run locally

A MongoDB server must be listening on `127.0.0.1:27017` (or set `DATABASE_URL` to your Atlas URI).

```bash
npm install
npm run dev
```

The API listens on `http://127.0.0.1:8787`. Vite proxies `/api` from the frontend.

Create an account, open a project, then log a receipt. Photos, PDFs, and pasted invoice text are read by OpenAI (`OPENAI_API_KEY`). Example tickets on Capture are templates — they post to your project in the database.

## Production

```bash
npm run build
npm start
```

Express serves the built app and the API together. Set `JWT_SECRET` to a long random value before exposing the server. Point `DATABASE_URL` at a MongoDB replica set or Atlas cluster.

Copy `.env.example` to `.env` and fill in secrets. Do not commit `.env`.
