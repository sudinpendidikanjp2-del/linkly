# Linkly

Pemendek tautan lengkap: alamat pendek kustom, kode QR yang terlacak, statistik klik, koleksi, dan halaman bio publik (blok konten, gambar, video, elemen melayang, tema dan warna kustom). Antarmuka dua bahasa (Indonesia, Inggris), mode terang dan gelap.

## Stack

- React 19, React Router, TanStack Query, react-hook-form + zod
- shadcn/ui pattern di atas Radix UI (`src/components/ui`), Tailwind CSS 4
- Express, Prisma, PostgreSQL
- Halaman publik (gerbang kata sandi, halaman perantara, halaman bio) dirender server dengan React, tanpa JavaScript klien

## Menjalankan

```bash
cp .env.example .env        # isi DATABASE_URL dan SESSION_SECRET
npm install
npx prisma migrate deploy   # buat tabel
npm run dev                 # http://localhost:3000
```

Akun pertama otomatis menjadi administrator. Produksi: `npm run build && npm start` (menjalankan migrasi lebih dulu), atau `docker compose up --build`.

## Struktur

| Path | Isi |
| --- | --- |
| `server/` | API Express, autentikasi sesi (cookie bertanda tangan, scrypt), halaman publik |
| `src/features/*` | Fitur UI: auth, dashboard, links, collections, bio, settings |
| `src/shared/` | Skema zod, tipe, tema bio, dan komponen `BioView` yang dipakai klien dan server |
| `src/i18n/` | Kamus `id` dan `en` bertipe |
| `prisma/` | Skema dan migrasi |

## Perilaku penting

- Semua endpoint `/api/*` memerlukan sesi dan memeriksa kepemilikan data.
- Kata sandi tautan disimpan sebagai hash, diverifikasi lewat form POST (tidak muncul di URL).
- IP pengunjung tidak disimpan. Pengunjung unik dihitung dari hash harian.
- Pindaian QR memakai `?qr=1` dan dihitung terpisah.
- Lokasi diambil dari header edge (`cf-ipcountry`, `x-vercel-ip-country`, dll.), tanpa layanan GeoIP pihak ketiga.
- `npm run lint` (tsc) dan `npm run check:contrast` (WCAG AA untuk tema bio).

## Aplikasi (PWA)

Linkly bisa dipasang seperti aplikasi native di Android, iOS, dan desktop: `manifest.webmanifest`, service worker (`public/sw.js`), ikon maskable, tampilan standalone, bilah navigasi bawah di ponsel, dan area aman layar berlekuk. Aplikasi tetap terbuka saat offline (cangkang aplikasi di-cache; data, tautan pendek, dan halaman bio selalu dari jaringan).

- Android Chrome: menu atau tombol **Pasang aplikasi** di Pengaturan. Berbagi URL dari aplikasi lain ke Linkly membuka dialog tautan baru (Web Share Target).
- Pintasan ikon: Tautan baru, Semua tautan, Halaman bio.
- Service worker hanya aktif pada build produksi dan lewat HTTPS (atau localhost).

## Docker untuk linux/arm64/v8

`Dockerfile` mendukung multi-arsitektur. Stage `builder` selalu berjalan di mesin build (hasilnya JavaScript, bebas arsitektur), sedangkan stage `runner` dibangun untuk platform target, termasuk mesin Prisma arm64.

```bash
npm run docker:arm64                          # arsip ./out/linkly-arm64.tar
scripts/docker-build.sh --load                # muat ke Docker lokal
scripts/docker-build.sh --push ghcr.io/akun/linkly:1.0.0
DOCKER_DEFAULT_PLATFORM=linux/arm64/v8 docker compose up --build
```

Di mesin x86, pasang emulasi sekali: `docker run --privileged --rm tonistiigi/binfmt --install arm64`. Di mesin arm64 (Apple Silicon, Graviton, Raspberry Pi 4/5) tidak perlu emulasi. Pindahkan arsip ke target dengan `docker load -i linkly-arm64.tar`.
