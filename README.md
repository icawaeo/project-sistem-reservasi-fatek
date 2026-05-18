This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Database Seed

To seed room data for the landing page availability popup and the building room lists, run:

```bash
npm run db:seed
```

## LibreOffice (DOCX -> PDF Preview)

Fitur preview template surat mengonversi file `.docx` menjadi `.pdf` menggunakan LibreOffice (perintah `soffice`) di server.

- Pastikan LibreOffice sudah terpasang dan `soffice` tersedia di PATH, atau set environment variable `LIBREOFFICE_PATH` ke path executable `soffice` (mis. `C:\Program Files\LibreOffice\program\soffice.exe`).

## Deploy via GitHub Actions + Dokploy

Build image dilakukan di GitHub Actions, lalu Dokploy hanya menjalankan image yang sudah jadi dari GitHub Container Registry (GHCR). Dengan alur ini, server Dokploy tidak perlu membangun aplikasi lagi.

### 1. Konfigurasi GitHub

Workflow ada di `.github/workflows/docker-image.yml`.

Tambahkan **Repository Variables** berikut di GitHub bila fitur Firebase client dipakai:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_FIREBASE_VAPID_KEY`

Saat ada push ke branch `main`, workflow akan:

1. build Docker image,
2. push ke GHCR,
3. memberi tag `latest`, nama branch, dan short SHA.

Format image:

```text
ghcr.io/<owner>/<repo>:latest
```

Jika package GHCR dibuat **private**, hubungkan credential registry di Dokploy dengan token GitHub yang punya izin `read:packages`.

### 2. Konfigurasi di Dokploy

1. Buat app dari **Docker image / Registry**, bukan source repo Git.
2. Isi image dengan:

```text
ghcr.io/<owner>/<repo>:latest
```

3. Expose port `3000` (atau set env `PORT`).
4. Set environment variables runtime di Dokploy (lihat daftar di bawah).
5. Tambahkan database Postgres lalu set `DATABASE_URL`.
6. Mount volume agar file upload tidak hilang saat redeploy:
	- `/app/public/uploads` (template surat, TTD admin, dan dokumen reservasi)
7. Deploy. Saat container start, `docker-entrypoint.sh` menjalankan `prisma migrate deploy` (bisa dimatikan dengan `RUN_MIGRATIONS=0`).

### Environment variables minimal

- `DATABASE_URL` (PostgreSQL)
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL` (contoh: `https://domain-anda.com`)

### Environment variables opsional (fitur tertentu)

- Email via MailerSend SMTP relay (reset/verification): `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_SENDER_EMAIL`, `SMTP_SENDER_NAME`
- Firebase Storage (jika dipakai di fitur upload tertentu): `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_STORAGE_BUCKET`
- Firebase client / FCM web: `NEXT_PUBLIC_FIREBASE_*` diset sebagai **Repository Variables** GitHub karena nilainya ikut ditanam saat image dibuild.
- LibreOffice path (umumnya tidak perlu di Linux container karena `soffice` sudah ada di PATH): `LIBREOFFICE_PATH` / `SOFFICE_PATH`

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

