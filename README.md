# Buma · Wedding Planner

Aplikasi perencana pernikahan. Semua fitur terbuka, tanpa paket berbayar.

## Railway

1. Buat project, hubungkan repo ini.
2. Add plugin **PostgreSQL**. Railway mengisi `DATABASE_URL` sendiri.
3. Set variables:
   - `AUTH_SECRET` — string acak, minimal 32 karakter
   - `APP_URL` — `https://domain-kamu.up.railway.app` (atau domain custom)
4. Deploy. `npm start` menjalankan `prisma migrate deploy` lalu `next start`.
5. **Jangan** jalankan seed di production. User daftar sendiri lewat `/register`.

## Localhost

Postgres lokal (Docker):

```bash
docker compose up -d
```

Salin `.env.example` ke `.env`, lalu:

```bash
npm install
npx prisma migrate deploy
npx tsx prisma/seed.ts
npm run dev
```

Akun seed (hanya local): `demo@buma.local` / `Demo@123321`
