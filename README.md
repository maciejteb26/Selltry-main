# AutoLister

Wieloplatformowe narzedzie SaaS do publikacji ogloszen czesci samochodowych.

## Szybki start

`docker-compose up -d && npm run dev`

## Wymagania

- Node.js 20+
- Docker Desktop

## Uruchomienie (dev)

1. Skopiuj `server/.env.example` do `server/.env`.
2. Uruchom infrastrukture: `docker-compose up -d`.
3. Wykonaj migracje i seed:
   - `cd server`
   - `npm run prisma:migrate`
   - `npm run prisma:seed`
4. W root projektu uruchom: `npm run dev`.

## Architektura

- `client/` React + TypeScript + Vite
- `server/` Express + TypeScript + Prisma + BullMQ
- Integracje platform dzialaja domyslnie w MOCK mode
- Mleko
