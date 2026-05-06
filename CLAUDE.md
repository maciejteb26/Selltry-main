# AutoLister SaaS — CLAUDE.md

## Opis projektu
Wieloplatformowe narzędzie SaaS do wystawiania ogłoszeń części samochodowych/motocyklowych na Allegro, Ovoko, Otomoto, OLX i eBay z jednego panelu.

## Architektura
Modular monolith — monorepo z dwoma pakietami:
- `/client` — React 18 + TypeScript (Vite)
- `/server` — Node.js + Express + TypeScript

## Stack
**Frontend:** React 18, TypeScript, Vite, React Router v6, Zustand, TanStack Query, React Hook Form, Zod, Tailwind CSS, shadcn/ui, Lucide React
**Backend:** Node.js, Express, TypeScript, PostgreSQL, Prisma ORM, JWT, bcrypt, Redis, BullMQ, AWS S3 (MinIO lokalnie), Multer, Sharp, Anthropic SDK
**Infra:** Docker, docker-compose (postgres + redis + minio)

## Zasady implementacji

### Ogólne
- TypeScript strict mode wszędzie
- Max 250 linii per plik — bezwzględnie wydzielaj moduły
- Brak magic strings — używaj stałych z `constants.ts`
- Walidacja Zod na każdym backendowym endpoincie
- Każdy sekret w `.env`, nigdy w kodzie

### MOCK MODE — krytyczne
Wszystkie integracje platform działają domyślnie w MOCK mode:
```
ALLEGRO_MOCK=true, OVOKO_MOCK=true, OTOMOTO_MOCK=true, OLX_MOCK=true, EBAY_MOCK=true
```
Każdy `platform.service` musi implementować `_mockPublish()` i `_realPublish()`.
Oznaczaj moki komentarzem: `// MOCK MODE — wymaga X_MOCK=false i prawdziwego tokenu`

### Backend
- Każdy endpoint sprawdza `req.userId === resource.userId`
- Tokeny OAuth szyfrowane AES-256 przed zapisem
- JWT w httpOnly cookie (nie localStorage)
- Rate limiting: 100 req/15min per IP
- Sanityzacja HTML na polu `description`

### Frontend
- Skeleton screens zamiast spinnerów
- Empty states dla wszystkich pustych list
- Error boundary na poziomie stron
- Protected routes — redirect gdy brak tokenu

### Storage
- Zdjęcia TYLKO przez S3/MinIO — nigdy lokalny filesystem
- Zapisuj `s3Key` w bazie, URL generuj dynamicznie (presigned)

## Weryfikacja po każdym tasku

### Uruchamianie testów
```bash
# Backend
cd server && npm test              # unit testy
cd server && npm run test:int      # integracyjne

# Frontend
cd client && npm test              # unit testy
```

### Struktura testów
```
server/tests/unit/
server/tests/integration/
client/src/__tests__/
```

### Kryteria zamknięcia tasku
- [ ] Build nie ma błędów TS (`tsc --noEmit`)
- [ ] Testy adekwatne do zmiany przechodzą
- [ ] Nowa logika biznesowa ma testy jednostkowe
- [ ] Endpointy mają Zod validation
- [ ] Brak hardkodowanych sekretów

## Moduły i odpowiedzialności

### server/src/services/platforms/
Każdy plik = jeden serwis platformy. Bazuje na `base.platform.service.ts`.

### server/src/jobs/
BullMQ workery. `publish.job.ts` — wystawianie, `sync-status.job.ts` — synchronizacja.

### server/src/services/
- `auth.service.ts` — logika auth
- `listing.service.ts` — CRUD ogłoszeń
- `image.service.ts` — S3 upload
- `category.service.ts` — cache kategorii platform
- `ai-parser.service.ts` — parsowanie przez Anthropic API
- `title-generator.service.ts` — tytuły per platforma

### client/src/
- `api/` — klienty HTTP do własnego backendu (nie bezpośrednio do platform)
- `store/` — Zustand stores
- `hooks/` — custom React hooks
- `pages/` — komponenty stron
- `components/` — komponenty UI

## Kolejność implementacji (Etapy)
1. **Etap 1**: Monorepo + Docker + Prisma + Auth + Layout
2. **Etap 2**: CRUD ogłoszeń + upload zdjęć + wizard
3. **Etap 3**: System kategorii + mapowania + generator tytułów
4. **Etap 4**: AI Parser (Anthropic API)
5. **Etap 5**: Integracje platform (MOCK) + BullMQ
6. **Etap 6**: Marże + Dashboard
7. **Etap 7**: Zamówienia + finalizacja

## Zmienne środowiskowe
Patrz `.env.example`. Przy starcie serwera waliduj wszystkie wymagane zmienne.

## Git
- Każda zmiana przez branch + Pull Request
- Commit message po angielsku, opisowy
- Nigdy nie commituj `.env`
