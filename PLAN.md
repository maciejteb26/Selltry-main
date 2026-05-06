# AutoLister SaaS — Plan pozostałych etapów (3–7)

## Kontekst projektu

**Co to jest:** SaaS do wystawiania ogłoszeń części samochodowych na wielu platformach (Allegro, Ovoko, Otomoto, OLX, eBay) z jednego panelu.

**Lokalizacja:** `C:\Users\domin\OneDrive\Pulpit\PROJEKTY\Seltry`

**Stack:**
- Frontend: `client/` — React 18 + TypeScript + Vite + Tailwind + shadcn/ui + Zustand + TanStack Query + React Hook Form + Zod
- Backend: `server/` — Node.js + Express + TypeScript + Prisma (PostgreSQL) + Redis + BullMQ + AWS S3 SDK (MinIO lokalnie) + Anthropic SDK
- Infra: Docker (postgres:5432, redis:6379, minio:9000)
- Monorepo: npm workspaces root `package.json`

**Uruchamianie:**
```bash
docker-compose up -d                        # infrastruktura
cd server && npm run dev                    # backend :3001
cd client && npm run dev                    # frontend :5173
```

---

## Status etapów

| Etap | Status | Co zostało zbudowane |
|------|--------|---------------------|
| 1 | ✅ DONE | Monorepo, Docker, Prisma schema+seed, Auth (JWT httpOnly), Layout, Login/Register |
| 2 | ✅ DONE | CRUD ogłoszeń, upload zdjęć (MinIO), wizard 4-krokowy, lista ogłoszeń |
| 3 | ⏳ TODO | System kategorii + mapowania platform + generator tytułów |
| 4 | ⏳ TODO | AI Parser (Anthropic API) |
| 5 | ⏳ TODO | Integracje platform (MOCK) + BullMQ publish queue + frontend polling |
| 6 | ⏳ TODO | Marże + Dashboard ze statystykami |
| 7 | ⏳ TODO | Zamówienia + finalizacja |

---

## Istniejąca struktura plików

```
server/src/
  index.ts                          # Express app entry
  routes/
    index.ts                        # Router główny (/api/auth, /api/listings, /categories, /vehicles)
    auth.routes.ts
    listing.routes.ts               # GET/POST /listings, GET/PUT/DELETE /:id, POST /:id/images
    category.routes.ts              # GET /categories, GET /vehicles/makes, /makes/:id/models, /models/:id/generations
  controllers/
    auth.controller.ts
    listing.controller.ts
    category.controller.ts
  services/
    auth.service.ts
    listing.service.ts              # CRUD + duplikowanie + cursor pagination
    image.service.ts                # S3 upload (Sharp→WebP) + presigned URLs
    category.service.ts             # getCategoryTree, getVehicleMakes/Models/Generations
  middleware/
    auth.middleware.ts              # JWT verify → req.userId
    error.middleware.ts             # AppError class
    rate-limit.middleware.ts
  utils/
    env.ts                          # Walidacja zmiennych środowiskowych przy starcie
    prisma.ts                       # Singleton PrismaClient
    redis.ts                        # Singleton ioredis
    s3.ts                           # Singleton S3Client (MinIO forcePathStyle)
    crypto.ts                       # AES-256 encrypt/decrypt

client/src/
  App.tsx                           # BrowserRouter + Routes
  api/
    client.ts                       # Axios z interceptorem refresh token
    auth.api.ts
    listings.api.ts                 # createListing, getListings, uploadImages, itd.
    categories.api.ts               # getCategories, getVehicleMakes/Models/Generations
  store/
    auth.store.ts                   # Zustand: user, isLoading
  components/
    ui/button.tsx, input.tsx, label.tsx, toast.tsx
    layout/Layout.tsx, Sidebar.tsx, Navbar.tsx
    listings/StatusBadge.tsx
    shared/ProtectedRoute.tsx, ImageUploader.tsx
  pages/
    Auth/Login.tsx, Register.tsx
    Dashboard/index.tsx             # Placeholder statystyki
    Listings/index.tsx              # Lista ogłoszeń z filtrowaniem
    Listings/New.tsx                # Wizard container
    Listings/wizard/
      types.ts                      # WizardData interface
      Step1Vehicle.tsx              # Marka/model/generacja/VIN
      Step2Details.tsx              # Kategoria/stan/tytuł/opis
      Step3Images.tsx               # Drag & drop upload
      Step4Submit.tsx               # Cena + podsumowanie
```

---

## Prisma Schema (kluczowe modele — już istnieją)

Plik: `server/prisma/schema.prisma`

Modele: `User`, `RefreshToken`, `UserPlatform`, `MarginRule`, `VehicleMake`, `VehicleModel`, `VehicleGeneration`, `InternalCategory`, `PlatformCategoryMapping`, `Listing`, `ListingImage`, `PlatformListing`

Enums: `Platform (ALLEGRO|OVOKO|OTOMOTO|OLX|EBAY)`, `Plan`, `Condition`, `VehicleType`, `IdentMethod`, `ListingStatus`, `PlatformStatus`, `MarginType`

Seed już uruchomiony — baza zawiera marki/modele aut i motocykli, drzewo kategorii (10 root + subkategorie), mock mapowania PlatformCategoryMapping dla wszystkich 5 platform.

---

## ETAP 3 — System kategorii + Generator tytułów

### Cel
Serwis kategorii zwraca externalCategoryId per platforma. Generator tytułów tworzy tytuł dostosowany do limitu znaków każdej platformy.

### Pliki do stworzenia

#### `server/src/services/title-generator.service.ts`
```typescript
// Limity znaków per platforma
const TITLE_LIMITS: Record<Platform, number> = {
  ALLEGRO: 75, OLX: 70, OTOMOTO: 80, OVOKO: 100, EBAY: 80,
};

// Szablon: [Kategoria] [Marka] [Model] [Rok] [Strona] [Stan] [Detal]
// Przykład: "Lampa tylna Suzuki Samurai 1990 prawa używana"
// Logika skracania: usuwa elementy od końca aż zmieści się w limicie
// Zawsze zachowuje: Kategoria + Marka + Model

function generateTitle(listing: ListingWithRelations, platform: Platform): string
function generateTitleForAllPlatforms(listing: ListingWithRelations): Record<Platform, string>
```

#### `server/src/services/category.service.ts` — rozszerz istniejący plik
Dodaj funkcje:
```typescript
// Pobiera externalCategoryId dla kombinacji kategoria + platforma
// Rzuca AppError(400) jeśli brak mapowania
async function getExternalCategoryId(internalCategoryId: string, platform: Platform): Promise<string>

// Zwraca schemat atrybutów wymaganych przez platformę
async function getAttributeSchema(internalCategoryId: string, platform: Platform): Promise<object>

// Synchronizuje kategorie z API platformy (w MOCK mode używa danych z bazy)
// Wywoływany przez Bull cron job raz dziennie
async function syncPlatformCategories(platform: Platform): Promise<void>
```

#### `server/src/controllers/listing.controller.ts` — dodaj endpoint
```
GET /api/listings/:id/titles
→ Zwraca wygenerowane tytuły per platforma dla istniejącego ogłoszenia
Response: { ALLEGRO: "...", OLX: "...", ... }
```

#### `client/src/components/listings/TitlePreview.tsx`
Komponent wyświetlający podgląd tytułów per platforma z oznaczeniem czy tytuł został obcięty:
```tsx
// Wyświetla tytuł per platforma z ikoną ostrzeżenia gdy obcięty
// Używany w Step4Submit wizarda i na stronie edycji
interface Props { titles: Record<string, string>; limits: Record<string, number>; }
```

### Trasy do dodania w `server/src/routes/listing.routes.ts`
```
GET /api/listings/:id/titles
```

---

## ETAP 4 — AI Parser (Anthropic API)

### Cel
Pole "Szybki opis" na początku wizarda — użytkownik wpisuje np. "lampa tył samurai prawa 1990" i AI wypełnia formularz.

### Pliki do stworzenia

#### `server/src/services/ai-parser.service.ts`
```typescript
import Anthropic from '@anthropic-ai/sdk';
// Model: claude-haiku-4-5-20251001 (szybki i tani)

interface ParsedListingData {
  vehicleMake: string | null;
  vehicleModel: string | null;
  vehicleYear: number | null;
  partCategory: string | null;      // musi pasować do slug z InternalCategory
  partSubcategory: string | null;   // musi pasować do slug z InternalCategory
  partSide: 'Lewa' | 'Prawa' | null;
  condition: 'NEW' | 'USED' | 'DAMAGED' | null;
  catalogNumber: string | null;
  confidence: number;               // 0-1
  needsReview: boolean;             // true gdy confidence < 0.6
}

// Prompt wysyła do Claude listę dostępnych kategorii z bazy (slugi)
// żeby model zwracał dokładne wartości które istnieją w systemie
async function parseInput(rawInput: string): Promise<ParsedListingData>

// Fallback gdy brak ANTHROPIC_API_KEY — prosty regex
function parseWithRegex(rawInput: string): ParsedListingData
```

#### `server/src/controllers/ai-parser.controller.ts`
```typescript
// POST /api/listings/parse-input
// Body: { input: string }
// Rate limit: 10 req/min (aiParserRateLimit middleware już istnieje)
// Walidacja Zod: input min 3 znaki, max 500
// Zwraca ParsedListingData
```

#### `server/src/routes/listing.routes.ts` — dodaj przed `/:id`
```
POST /api/listings/parse-input   → ai-parser controller (z aiParserRateLimit)
```

#### `client/src/components/shared/AIParser.tsx`
Komponent umieszczony NA POCZĄTKU wizarda (przed Step1):
```tsx
// Pole "Szybki opis" z przyciskiem "Wypełnij automatycznie"
// Po parsowaniu: wypełnia WizardData + podświetla pola żółtym obramowaniem
// Jeśli needsReview: true → banner "Sprawdź podświetlone pola"
// Podczas ładowania: spinner na przycisku

interface Props {
  onParsed: (data: Partial<WizardData>) => void;
}
```

#### `client/src/api/ai-parser.api.ts`
```typescript
async function parseListingInput(input: string): Promise<ParsedListingData>
```

### Import w `client/src/pages/Listings/New.tsx`
Dodaj `AIParser` komponent nad paskiem kroków wizarda. Po `onParsed` — wywołaj `patch()` z wynikami i przeskocz do kroku 1.

---

## ETAP 5 — Integracje platform (MOCK) + BullMQ

### Cel
Wystawianie ogłoszeń na platformy przez kolejkę BullMQ. MOCK mode domyślnie włączony. Frontend polling co 3s.

### Pliki do stworzenia

#### `server/src/services/platforms/base.platform.service.ts`
```typescript
abstract class BasePlatformService {
  abstract platform: Platform;
  abstract mockMode: boolean;

  async publishListing(listing: ListingWithRelations, categoryId: string): Promise<PublishResult>
  async endListing(externalId: string): Promise<void>
  
  protected abstract _mockPublish(listing: ListingWithRelations): Promise<PublishResult>
  protected abstract _realPublish(listing: ListingWithRelations, categoryId: string): Promise<PublishResult>
  
  buildPayload(listing: ListingWithRelations, categoryId: string, attributeSchema: object): object
}

interface PublishResult {
  externalId: string;
  externalUrl: string;
  status: 'ACTIVE';
}
```

#### `server/src/services/platforms/allegro.service.ts`
```typescript
// MOCK MODE — wymaga ALLEGRO_MOCK=false i prawdziwego tokenu
class AllegroService extends BasePlatformService {
  platform = Platform.ALLEGRO;
  mockMode = env.ALLEGRO_MOCK;

  async _mockPublish(listing) {
    await delay(800 + Math.random() * 1200); // symuluj latency
    return {
      externalId: `MOCK-ALLEGRO-${Date.now()}`,
      externalUrl: `https://allegro.pl/oferta/mock-${Date.now()}`,
      status: 'ACTIVE',
    };
  }

  async _realPublish(listing, categoryId) {
    // GET https://api.allegro.pl/sale/offers
    // Wymaga: accessToken z UserPlatform (zdecryptowany)
    throw new Error('Real Allegro API not implemented yet');
  }
}
```

Analogicznie: `ovoko.service.ts`, `otomoto.service.ts`, `olx.service.ts`, `ebay.service.ts`

Każdy serwis:
- Mock delay: 800–2000ms (symulacja)
- Mock externalId: `MOCK-{PLATFORM}-{Date.now()}`
- Mock externalUrl: URL platformy z "mock" w ścieżce
- Komentarz `// MOCK MODE` na każdej metodzie mock

#### `server/src/services/platforms/index.ts`
```typescript
// Factory — zwraca właściwy serwis per platforma
function getPlatformService(platform: Platform): BasePlatformService
```

#### `server/src/jobs/publish.job.ts`
```typescript
import { Queue, Worker } from 'bullmq';

// Queue name: 'publish'
// Job data: { listingId, platform, userId }

// Worker flow:
// 1. Pobierz listing z relacjami
// 2. getExternalCategoryId(listing.categoryId, platform) — rzuć błąd jeśli brak
// 3. getAttributeSchema(listing.categoryId, platform)
// 4. platformService.publishListing(listing, categoryId)
// 5. Update PlatformListing: { externalId, externalUrl, status: ACTIVE, publishedAt }
// 6. On error: update PlatformListing { status: ERROR, errorMessage, retryCount++ }

// Retry strategy: exponential backoff
// attempts: 4, delay: 2000ms (2s → 4s → 8s → 16s)
// removeOnComplete: { age: 86400 }
// removeOnFail: { age: 7 * 86400 }

// Po zakończeniu wszystkich jobów dla listingId:
// → sprawdź statusy wszystkich PlatformListing
// → Update Listing.status: ACTIVE / PARTIALLY_ACTIVE / ERROR
```

#### `server/src/jobs/index.ts`
```typescript
// Inicjalizacja kolejek i workerów
// Eksportuje publishQueue do użycia w kontrolerze
export { publishQueue, startWorkers }
```

#### `server/src/controllers/listing.controller.ts` — dodaj endpointy
```
POST /api/listings/:id/publish
Body: { platforms: Platform[] }
Flow:
  1. Sprawdź czy listing należy do userId
  2. Sprawdź czy listing ma title, images, categoryId
  3. Sprawdź czy każda platforma z platforms jest aktywna (UserPlatform.isActive)
  4. Dla każdej platformy:
     a. Oblicz finalPrice = basePrice (marże w Etap 6)
     b. Wygeneruj platformTitle przez title-generator.service
     c. Upsert PlatformListing { status: PENDING, finalPrice, platformTitle }
     d. publishQueue.add('publish', { listingId, platform, userId })
  5. Update Listing.status = PUBLISHING
  6. Return 202 { jobCount: N }

GET /api/listings/:id/publish-status
Response: { [platform]: PlatformStatus }
Używany przez frontend polling
```

#### `server/src/controllers/platform.controller.ts`
```
GET /api/platforms                    → lista UserPlatform dla zalogowanego usera
POST /api/platforms/:platform/connect → inicjuj OAuth flow (MOCK: od razu isActive=true)
DELETE /api/platforms/:platform       → rozłącz platformę
```

#### `server/src/routes/platform.routes.ts`
```
GET    /api/platforms
POST   /api/platforms/:platform/connect
DELETE /api/platforms/:platform
```

#### `client/src/api/platforms.api.ts`
```typescript
async function getPlatforms(): Promise<UserPlatform[]>
async function connectPlatform(platform: Platform): Promise<UserPlatform>
async function disconnectPlatform(platform: Platform): Promise<void>
async function publishListing(listingId: string, platforms: Platform[]): Promise<{ jobCount: number }>
async function getPublishStatus(listingId: string): Promise<Record<Platform, PlatformStatus>>
```

#### `client/src/pages/Platforms/index.tsx`
Strona z kartami per platforma:
```
- Logo platformy + nazwa
- Status: Połączona (zielony) / Rozłączona (szary)
- MOCK mode: przycisk "Połącz" → od razu aktywuje (bez OAuth)
- Data połączenia + data wygaśnięcia tokenu
- Przycisk "Rozłącz"
```

#### `client/src/pages/Listings/wizard/Step4Submit.tsx` — rozszerz
Dodaj sekcję wyboru platform (toggle per platforma):
- Tylko aktywne platformy są klikalne
- Nieaktywne: disabled + tooltip "Połącz w Ustawieniach → Platformy"
- Po zapisaniu ogłoszenia: jeśli wybrano platformy → wywołaj publishListing

#### `client/src/hooks/usePublishStatus.ts`
```typescript
// React Query z refetchInterval: 3000ms
// Zatrzymuje polling gdy wszystkie platformy mają status ACTIVE lub ERROR
function usePublishStatus(listingId: string | null)
```

### Uruchamianie workerów
W `server/src/index.ts` po starcie serwera:
```typescript
import { startWorkers } from './jobs';
startWorkers(); // uruchamia BullMQ workery
```

---

## ETAP 6 — Marże + Dashboard

### Cel
Reguły marż per platforma. Dashboard ze statystykami. Live preview cen w kroku 4 wizarda.

### Pliki do stworzenia

#### `server/src/services/margin.service.ts`
```typescript
interface MarginRule {
  platform: Platform;
  marginType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  marginValue: number;
}

// Pobiera reguły marż użytkownika
async function getMarginRules(userId: string): Promise<MarginRule[]>

// Zapisuje/aktualizuje regułę
async function upsertMarginRule(userId: string, rule: MarginRule): Promise<MarginRule>

// Oblicza cenę końcową na podstawie ceny bazowej i reguły
function calculateFinalPrice(basePrice: number, rule: MarginRule | null): number
// PERCENTAGE: basePrice * (1 + marginValue/100)
// FIXED_AMOUNT: basePrice + marginValue
// Brak reguły: basePrice (bez marży)
```

#### `server/src/controllers/margin.controller.ts`
```
GET  /api/settings/margins     → lista reguł marż użytkownika
PUT  /api/settings/margins     → body: { platform, marginType, marginValue }[], upsert all
```

#### `server/src/services/listing.service.ts` — rozszerz publish flow
W `POST /api/listings/:id/publish`:
Zamiast `finalPrice = basePrice` używaj `margin.service.calculateFinalPrice(basePrice, rule)`

#### `server/src/controllers/listing.controller.ts` — dodaj dashboard endpoint
```
GET /api/dashboard/stats
Response: {
  totalListings: number,
  activeListings: number,
  draftListings: number,
  listingsByPlatform: { platform: Platform, active: number }[],
  recentListings: Listing[5],        // ostatnie 5
}
```

#### `client/src/api/margins.api.ts`
```typescript
async function getMarginRules(): Promise<MarginRule[]>
async function saveMarginRules(rules: MarginRule[]): Promise<MarginRule[]>
```

#### `client/src/api/dashboard.api.ts`
```typescript
async function getDashboardStats(): Promise<DashboardStats>
```

#### `client/src/pages/Settings/Margins.tsx`
Strona ustawień marż:
```
Per platforma:
  - Toggle: Procent (%) / Kwota stała (PLN)
  - Input z wartością
  - Live preview: "100 PLN → X PLN na tej platformie"
  - Auto-save z debounce 500ms (useDebounce hook)
```

#### `client/src/pages/Dashboard/index.tsx` — zastąp placeholder
```
- StatCards: Aktywne ogłoszenia, Połączone platformy, Ogłoszenia w tym miesiącu
- Tabela ostatnich 5 ogłoszeń z linkami
- Wykresy (opcjonalnie Recharts): ogłoszenia per platforma
- CTA "Dodaj ogłoszenie" gdy brak ogłoszeń
```

#### `client/src/pages/Listings/wizard/Step4Submit.tsx` — rozszerz
Live preview cen per platforma:
```
Dla każdej wybranej platformy wyświetl:
  "Cena bazowa 100 PLN + marża X% = 110 PLN na Allegro"
Dane marż: useQuery(['margins']) → margin.service.calculateFinalPrice()
```

---

## ETAP 7 — Zamówienia + Finalizacja

### Cel
Widok zamówień (MOCK dane). Globalna obsługa błędów. Responsywność. README.

### Pliki do stworzenia

#### `server/src/services/order.service.ts`
```typescript
// MOCK MODE — zwraca przykładowe zamówienia per platforma
// Gdy MOCK=false: pobiera z API platformy używając accessToken z UserPlatform

interface Order {
  id: string;
  platform: Platform;
  externalOrderId: string;
  listingTitle: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'PAID' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED';
  buyerName: string;
  createdAt: string;
  externalUrl: string;
}

async function getOrders(userId: string): Promise<Order[]>
```

#### `server/src/controllers/order.controller.ts`
```
GET /api/orders   → lista zamówień (MOCK per default)
```

#### `client/src/pages/Orders/index.tsx`
Tabela zamówień:
```
Kolumny: Platforma (logo), Numer zamówienia, Część, Kwota, Status, Data, Link
Filtry: per platforma, per status
Empty state gdy brak zamówień
```

#### Globalna obsługa błędów (client)

`client/src/components/shared/ErrorBoundary.tsx`:
```tsx
class ErrorBoundary extends Component — łapie błędy React
Wyświetla: "Coś poszło nie tak" + przycisk "Odśwież stronę"
Owijaj każdą stronę w App.tsx
```

#### Responsywność

`client/src/components/layout/Sidebar.tsx` — mobile drawer:
```
Na mobile (< 768px): Sidebar ukryty, otwierany przez hamburger w Navbar
Użyj Radix UI Dialog lub własny overlay
```

`client/src/components/layout/Navbar.tsx`:
```
Dodaj hamburger button (Menu icon) widoczny tylko na mobile
```

#### `README.md` w root projektu
```markdown
# AutoLister

One-liner: docker-compose up -d && cd server && npm run dev & cd client && npm run dev

## Wymagania
- Node.js 20+
- Docker Desktop

## Uruchomienie (dev)
1. cp server/.env.example server/.env
2. docker-compose up -d
3. cd server && npm run prisma:migrate:dev && npm run prisma:seed
4. npm run dev (z root - uruchamia oba serwery)

## Zmienne środowiskowe
[opis każdej zmiennej z .env.example]

## Architektura
[opis modułów]
```

---

## Zasady wspólne dla wszystkich etapów (rules.md)

1. **TypeScript strict mode** — zero błędów `tsc --noEmit` po każdym pliku
2. **Zod validation** — każdy backendowy endpoint waliduje body/query
3. **MOCK mode** — wszystkie integracje platform domyślnie MOCK, sterowane przez `.env`
4. **Max 250 linii per plik** — wydzielaj moduły
5. **Brak magic strings** — używaj enumów/stałych
6. **Error handling** — try/catch w każdym kontrolerze, `next(err)` do error middleware
7. **Presigned URLs** — nigdy nie zwracaj bezpośrednich URL S3 — używaj `getPresignedUrl()`
8. **Auth check** — każdy endpoint sprawdza `req.userId === resource.userId`
9. **Po każdym etapie** — uruchom `tsc --noEmit` na server i client

## Zmienne środowiskowe (server/.env już skonfigurowane)

```env
NODE_ENV=development
PORT=3001
CLIENT_URL=http://localhost:5173
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/autolister
REDIS_URL=redis://localhost:6379
JWT_SECRET=autolister-jwt-secret-dev-min32chars!
JWT_REFRESH_SECRET=autolister-refresh-secret-32chars!!
ENCRYPTION_KEY=autolister-enc-key-32chars-dev!!
S3_ENDPOINT=http://localhost:9000
S3_BUCKET=autolister-dev
S3_REGION=us-east-1
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
ANTHROPIC_API_KEY=         # wymagane dla Etap 4
ALLEGRO_MOCK=true
OVOKO_MOCK=true
OTOMOTO_MOCK=true
OLX_MOCK=true
EBAY_MOCK=true
```

## Kolejność implementacji

Implementuj **ściśle w kolejności** Etap 3 → 4 → 5 → 6 → 7.
Nie przeskakuj etapów — każdy buduje na poprzednim (np. Etap 5 używa title-generator z Etap 3).

Po każdym etapie zweryfikuj:
- [ ] `cd server && npx tsc --noEmit` — 0 błędów
- [ ] `cd client && npx tsc --noEmit` — 0 błędów
- [ ] Główne flow działa w przeglądarce
