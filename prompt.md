 ROLA I CEL
Jesteś senior full-stack developerem budującym produkt SaaS od zera. Twoje zadanie to stworzenie kompletnej aplikacji webowej AutoLister — narzędzia, które pozwala sprzedawcom części samochodowych i motocyklowych wystawiać ogłoszenia jednocześnie na wielu platformach (Allegro, Ovoko, Otomoto, OLX, eBay) z jednego panelu.
Budujesz gotowy, działający produkt — nie prototyp, nie mockup. Każdy napisany przez Ciebie kod musi być produkcyjnej jakości: czysty, modularny, z obsługą błędów, gotowy do wdrożenia.
⚠️ KRYTYCZNA ZASADA: TRYB MOCK DOMYŚLNIE WŁĄCZONY
Wszystkie integracje z zewnętrznymi platformami (Allegro, Ovoko, Otomoto, OLX, eBay) działają domyślnie w trybie MOCK.
Każdy platform.service musi implementować dwa tryby sterowane przez .env:
# .env
ALLEGRO_MOCK=true      # false = prawdziwe API
OVOKO_MOCK=true
OTOMOTO_MOCK=true
OLX_MOCK=true
EBAY_MOCK=true
javascript// Wzorzec dla każdego platform.service:
class AllegroService {
  constructor() {
    this.mockMode = process.env.ALLEGRO_MOCK === 'true';
  }

  async publishListing(listingData) {
    if (this.mockMode) {
      return this._mockPublish(listingData); // MOCK — symuluje sukces
    }
    return this._realPublish(listingData);   // wymaga prawdziwego tokenu
  }

  // MOCK: zwraca realistyczne dane bez wywołania API
  async _mockPublish(listingData) {
    await new Promise(r => setTimeout(r, 800 + Math.random() * 1200)); // symuluj latency
    return {
      externalId: `MOCK-${Date.now()}`,
      externalUrl: `https://allegro.pl/oferta/mock-${Date.now()}`,
      status: 'ACTIVE',
    };
  }
}
Oznaczaj każdy mock komentarzem: // MOCK MODE — wymaga ALLEGRO_MOCK=false i prawdziwego tokenu
Bez tego agenta zablokuje się przy pierwszej próbie wywołania zewnętrznego API.

🏗️ STACK TECHNOLOGICZNY
Frontend

React 18 + TypeScript (Vite jako bundler)
React Router v6 — routing SPA
Zustand — globalny state management
React Query (TanStack Query) — fetching danych, cache, synchronizacja
React Hook Form + Zod — formularze z walidacją schematów
Tailwind CSS — stylowanie
shadcn/ui — komponenty bazowe (Button, Input, Select, Dialog, Toast itd.)
Lucide React — ikony

Backend

Node.js + Express + TypeScript — REST API
PostgreSQL — główna baza danych
Prisma ORM — obsługa bazy, migracje, typesafe queries
JWT + bcrypt — autentykacja i bezpieczne hasła
Redis — cache kategorii platform, tokenów OAuth
BullMQ — kolejka do asynchronicznego wystawiania ofert
AWS S3 / Cloudflare R2 — storage zdjęć (NIE lokalny filesystem)
Multer + Sharp — upload i optymalizacja zdjęć przed wysłaniem do S3
Axios — zewnętrzne wywołania API platform
crypto (Node built-in) — szyfrowanie AES-256 tokenów OAuth

Infrastruktura / DevOps

Docker + docker-compose — lokalne środowisko (app + postgres + redis)
.env — zarządzanie sekretami (nigdy nie commituj)
Struktura monorepo: /client (React) + /server (Node.js)


📁 STRUKTURA PROJEKTU
autolister/
├── client/
│   ├── src/
│   │   ├── api/                      # klienty HTTP do własnego backendu
│   │   ├── components/
│   │   │   ├── ui/                   # shadcn/ui
│   │   │   ├── layout/               # Sidebar, Navbar, Layout
│   │   │   ├── listings/             # ListingCard, ListingForm, StatusBadge
│   │   │   ├── platforms/            # PlatformCard, PlatformToggle
│   │   │   └── shared/               # ImageUploader, VehicleSelector, AIParser
│   │   ├── pages/
│   │   │   ├── Auth/                 # Login, Register
│   │   │   ├── Dashboard/
│   │   │   ├── Listings/             # List, New (wizard), Edit, Detail
│   │   │   ├── Platforms/            # zarządzanie połączeniami
│   │   │   ├── Settings/             # Margins, Profile
│   │   │   └── Orders/
│   │   ├── store/                    # Zustand stores
│   │   ├── hooks/                    # useListingStatus, usePlatforms itd.
│   │   ├── utils/                    # titleGenerator, priceFormatter
│   │   └── types/                    # TypeScript interfaces
│   └── vite.config.ts
│
├── server/
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   │   ├── platforms/
│   │   │   │   ├── base.platform.service.ts   # abstrakcja wspólna
│   │   │   │   ├── allegro.service.ts
│   │   │   │   ├── ovoko.service.ts
│   │   │   │   ├── otomoto.service.ts
│   │   │   │   ├── olx.service.ts
│   │   │   │   └── ebay.service.ts
│   │   │   ├── category.service.ts   # cache kategorii platform
│   │   │   ├── listing.service.ts
│   │   │   ├── image.service.ts      # S3 upload + Sharp
│   │   │   ├── margin.service.ts
│   │   │   ├── ai-parser.service.ts  # AI parsing inputu użytkownika
│   │   │   └── title-generator.service.ts
│   │   ├── jobs/
│   │   │   ├── publish.job.ts        # BullMQ worker wystawiania
│   │   │   └── sync-status.job.ts    # sync statusów z platform
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts
│   │   │   ├── error.middleware.ts
│   │   │   └── rate-limit.middleware.ts
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── seed.ts               # seed z kategoriami i markami
│   │   └── utils/
│   │       ├── crypto.ts             # AES-256 encrypt/decrypt
│   │       └── redis.ts              # Redis client singleton
│   └── index.ts
│
├── docker-compose.yml
├── .env.example
└── README.md

🗄️ SCHEMAT BAZY DANYCH (Prisma) — PEŁNY
prisma// ============================================================
// UŻYTKOWNICY I AUTENTYKACJA
// ============================================================

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  passwordHash  String
  name          String
  plan          Plan      @default(FREE)
  createdAt     DateTime  @default(now())

  listings         Listing[]
  platforms        UserPlatform[]
  marginRules      MarginRule[]
}

model UserPlatform {
  id              String    @id @default(cuid())
  userId          String
  platform        Platform
  accessToken     String?   // AES-256 zaszyfrowany
  refreshToken    String?   // AES-256 zaszyfrowany
  tokenExpiry     DateTime?
  isActive        Boolean   @default(false)
  connectedAt     DateTime  @default(now())

  user            User      @relation(fields: [userId], references: [id])

  @@unique([userId, platform])
}

model MarginRule {
  id            String      @id @default(cuid())
  userId        String
  platform      Platform
  marginType    MarginType  // PERCENTAGE | FIXED_AMOUNT
  marginValue   Decimal

  user          User        @relation(fields: [userId], references: [id])

  @@unique([userId, platform])
}

// ============================================================
// NORMALIZACJA POJAZDÓW
// Zamiast wolnych stringów — ustrukturyzowane dane z seed'a
// ============================================================

model VehicleMake {
  id      String         @id @default(cuid())
  name    String         @unique  // "Suzuki", "BMW", "Honda"
  type    VehicleType[]  // marka może dotyczyć CAR i MOTORCYCLE

  models  VehicleModel[]
}

model VehicleModel {
  id      String       @id @default(cuid())
  makeId  String
  name    String       // "Samurai", "E30", "CBR600"

  make         VehicleModel  @relation(fields: [makeId], references: [id])
  generations  VehicleGeneration[]

  @@unique([makeId, name])
}

model VehicleGeneration {
  id       String  @id @default(cuid())
  modelId  String
  name     String? // np. "Mk1", "FL", "Facelift"
  yearFrom Int
  yearTo   Int?    // null = produkcja trwa

  model    VehicleModel @relation(fields: [modelId], references: [id])
}

// ============================================================
// SYSTEM KATEGORII WEWNĘTRZNYCH I MAPOWANIE NA PLATFORMY
// ============================================================

model InternalCategory {
  id            String  @id @default(cuid())
  name          String  // "Oświetlenie"
  slug          String  @unique  // "lighting"
  parentId      String?

  parent        InternalCategory?  @relation("CategoryTree", fields: [parentId], references: [id])
  children      InternalCategory[] @relation("CategoryTree")

  platformMappings PlatformCategoryMapping[]
  listings         Listing[]
}

// Mapowanie kategorii wewnętrznych na ID kategorii każdej platformy
// Cache'owane z API platform, aktualizowane raz dziennie
model PlatformCategoryMapping {
  id                  String   @id @default(cuid())
  internalCategoryId  String
  platform            Platform
  externalCategoryId  String   // ID kategorii po stronie platformy
  externalCategoryName String? // nazwa dla debugowania
  attributeSchema     Json?    // dynamiczny schemat atrybutów (różny per platforma!)
  cachedAt            DateTime @default(now())

  category            InternalCategory @relation(fields: [internalCategoryId], references: [id])

  @@unique([internalCategoryId, platform])
}

// ============================================================
// OGŁOSZENIA
// ============================================================

model Listing {
  id              String    @id @default(cuid())
  userId          String

  // === DANE PODSTAWOWE ===
  title           String
  description     String
  basePrice       Decimal
  currency        String    @default("PLN")
  condition       Condition
  quantity        Int       @default(1)

  // === IDENTYFIKACJA CZĘŚCI ===
  identMethod     IdentMethod
  vin             String?
  catalogNumber   String?       // numer OEM / producenta

  // === DANE POJAZDU — relacje zamiast wolnych stringów ===
  vehicleType     VehicleType
  vehicleMakeId   String?       // FK → VehicleMake (null jeśli "Inne"/nieznany)
  vehicleModelId  String?       // FK → VehicleModel
  vehicleGenId    String?       // FK → VehicleGeneration
  vehicleYearRaw  Int?          // rok gdy brak generacji w bazie (fallback)
  vehicleEngine   String?

  // === KATEGORIA CZĘŚCI — relacja ===
  categoryId      String        // FK → InternalCategory (leaf node)
  partSide        String?       // "Lewa" | "Prawa" | null
  partDetails     String?

  // === STAN I USZKODZENIA ===
  damageDescription String?

  // === AI PARSING — zapisz oryginalny input użytkownika ===
  rawUserInput    String?       // np. "lampa tył samurai prawa 1990"

  // === MEDIA ===
  images          ListingImage[]

  // === STATUS ===
  status          ListingStatus @default(DRAFT)
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  user            User          @relation(fields: [userId], references: [id])
  category        InternalCategory @relation(fields: [categoryId], references: [id])
  platformListings PlatformListing[]
}

model ListingImage {
  id          String  @id @default(cuid())
  listingId   String
  s3Key       String  // klucz w S3/R2 (NIE URL — URL generuj dynamicznie)
  s3Bucket    String
  order       Int
  isMain      Boolean @default(false)
  width       Int?    // po przetworzeniu Sharp
  height      Int?

  listing     Listing @relation(fields: [listingId], references: [id])
}

model PlatformListing {
  id            String    @id @default(cuid())
  listingId     String
  platform      Platform

  finalPrice    Decimal   // basePrice + marża
  platformTitle String    // tytuł dostosowany do limitu znaków platformy
  externalId    String?
  externalUrl   String?
  status        PlatformStatus @default(PENDING)
  errorMessage  String?
  errorCode     String?   // kod błędu API platformy dla debugowania
  retryCount    Int       @default(0)
  publishedAt   DateTime?
  lastSyncedAt  DateTime?

  listing       Listing   @relation(fields: [listingId], references: [id])

  @@unique([listingId, platform])
}

// ============================================================
// ENUMS
// ============================================================

enum Platform {
  ALLEGRO
  OVOKO
  OTOMOTO
  OLX
  EBAY
}

enum Plan { FREE PRO BUSINESS }

enum Condition { NEW USED DAMAGED }

enum VehicleType { CAR MOTORCYCLE TRUCK OTHER }

enum IdentMethod { VIN CATALOG_NUMBER MANUAL AI_PARSED }

enum ListingStatus {
  DRAFT
  PUBLISHING
  ACTIVE
  PARTIALLY_ACTIVE
  ENDED
  ERROR
}

enum PlatformStatus {
  PENDING
  ACTIVE
  ENDED
  ERROR
}

enum MarginType { PERCENTAGE FIXED_AMOUNT }

🗂️ SYSTEM KATEGORII — SZCZEGÓŁY IMPLEMENTACJI
Kategorie wewnętrzne (seed.ts)
Zaimplementuj hierarchiczne kategorie wewnętrzne i wypełnij je przez seed:
Silnik
  └── Blok silnika
  └── Głowica
  └── Rozrząd
  └── Turbosprężarka
  └── Alternator
  └── Rozrusznik
Skrzynia biegów
  └── Automatyczna
  └── Manualna
Zawieszenie
  └── Amortyzatory
  └── Sprężyny
  └── Drążki / wahacze
Hamulce
  └── Tarcze
  └── Klocki
  └── Zaciski
  └── Przewody
Oświetlenie
  └── Lampa przednia
  └── Lampa tylna
  └── Kierunkowskaz
  └── Lampa przeciwmgłowa
Karoseria
  └── Zderzak
  └── Błotnik
  └── Maska
  └── Drzwi
  └── Szyba
Elektryka
  └── Wiązka elektryczna
  └── Sterownik ECU
  └── Czujniki
Chłodzenie
  └── Chłodnica
  └── Wentylator
  └── Termostat
Układ kierowniczy
  └── Przekładnia
  └── Pompa wspomagania
Inne
Mapowanie kategorii na platformy (category.service.ts)
typescript// category.service.ts
class CategoryService {
  // Pobiera drzewo kategorii z API platformy i zapisuje mapowania
  // Odświeżaj raz dziennie (Bull cron job)
  async syncPlatformCategories(platform: Platform): Promise<void> {
    if (process.env[`${platform}_MOCK`] === 'true') {
      return this._seedMockMappings(platform); // MOCK — predefiniowane ID
    }
    
    switch (platform) {
      case 'ALLEGRO':
        // GET https://api.allegro.pl/sale/categories
        // Znajdź kategoria "Części samochodowe" i zmapuj dzieci
        break;
      case 'OTOMOTO':
        // GET https://www.otomoto.pl/api/categories
        break;
      // ...
    }
  }

  // Pobiera externalCategoryId dla danej kombinacji platforma + kategoria wewnętrzna
  // Rzuca błąd jeśli brak mapowania — nie pozwól wystawić bez kategorii
  async getExternalCategoryId(internalCategoryId: string, platform: Platform): Promise<string> {
    const mapping = await prisma.platformCategoryMapping.findUnique({
      where: { internalCategoryId_platform: { internalCategoryId, platform } }
    });
    if (!mapping) throw new Error(`Brak mapowania kategorii dla ${platform}`);
    return mapping.externalCategoryId;
  }

  // Zwraca schemat atrybutów wymaganych przez platformę dla kategorii
  async getAttributeSchema(internalCategoryId: string, platform: Platform): Promise<object> {
    const mapping = await prisma.platformCategoryMapping.findUnique({
      where: { internalCategoryId_platform: { internalCategoryId, platform } }
    });
    return mapping?.attributeSchema ?? {};
  }
}

🧠 AI PARSING INPUTU — KILLER FEATURE
Endpoint
POST /api/listings/parse-input
Content-Type: application/json

Body: { "input": "lampa tył samurai prawa 1990" }
Implementacja (ai-parser.service.ts)
typescript// ai-parser.service.ts
// Używa wbudowanego modelu LLM (Ollama lokalnie lub OpenAI API) do
// parsowania swobodnego tekstu na ustrukturyzowane dane ogłoszenia

class AIParserService {
  async parse(rawInput: string): Promise<ParsedListingData> {
    const prompt = `
Jesteś asystentem pomagającym sprzedawcom części samochodowych.
Przeanalizuj poniższy opis i wyodrębnij dane strukturalne.

Input: "${rawInput}"

Odpowiedz WYŁĄCZNIE w formacie JSON (bez markdown, bez komentarzy):
{
  "vehicleMake": "string | null",        // np. "Suzuki"
  "vehicleModel": "string | null",       // np. "Samurai"  
  "vehicleYear": number | null,          // np. 1990
  "partCategory": "string | null",       // np. "Oświetlenie"
  "partSubcategory": "string | null",    // np. "Lampa tylna"
  "partSide": "Lewa | Prawa | null",
  "condition": "NEW | USED | DAMAGED | null",
  "catalogNumber": "string | null",
  "confidence": number                   // 0-1, pewność parsowania
}
`;

    // OPCJA A: OpenAI (wymaga OPENAI_API_KEY w .env)
    // OPCJA B: Lokalny Ollama (darmowy, wymaga instalacji)
    // OPCJA C: Proste regex-based parsing jako fallback gdy brak AI

    const result = await this._callLLM(prompt);
    const parsed = JSON.parse(result);
    
    // Waliduj wynik — jeśli confidence < 0.6, zwróć partial i poinformuj UI
    return {
      ...parsed,
      rawInput,
      needsReview: parsed.confidence < 0.6,
    };
  }
}
UX na froncie — pole "Szybki opis"
Na początku formularza (przed krokami wizarda) dodaj opcjonalne pole:
┌─────────────────────────────────────────────────────┐
│  💡 Szybki opis (opcjonalne)                         │
│  ┌─────────────────────────────────────────────────┐│
│  │ lampa tył samurai prawa 1990                    ││
│  └─────────────────────────────────────────────────┘│
│  [✨ Wypełnij formularz automatycznie]               │
│                                                     │
│  — lub wypełnij ręcznie poniżej —                   │
└─────────────────────────────────────────────────────┘
Po kliknięciu "Wypełnij automatycznie":

Wywołaj POST /api/listings/parse-input
Spinner podczas oczekiwania
Wypełnij pola formularza wynikami
Podświetl wypełnione pola (żółte obramowanie = "sprawdź czy poprawne")
Jeśli needsReview: true — pokaż baner "Sprawdź podświetlone pola — nie byłem pewny"


📝 GENERATOR TYTUŁÓW — LOGIKA
typescript// title-generator.service.ts

const TITLE_LIMITS: Record<Platform, number> = {
  ALLEGRO: 75,
  OLX: 70,
  OTOMOTO: 80,
  OVOKO: 100,
  EBAY: 80,
};

// Szablon: [Część] [Marka] [Model] [Rok] [Strona] [Stan] [Detal]
// Przykład: "Lampa tylna Suzuki Samurai 1990 prawa używana"

function generateTitle(listing: Listing, platform: Platform): string {
  const parts = [
    listing.category.name,                          // "Lampa tylna"
    listing.vehicleMake?.name,                       // "Suzuki"
    listing.vehicleModel?.name,                      // "Samurai"
    listing.vehicleYearRaw ?? listing.vehicleGen?.yearFrom, // "1990"
    listing.partSide,                                // "prawa"
    listing.condition === 'USED' ? 'używana' : null,
    listing.partDetails,                             // "z wiązką"
  ].filter(Boolean).join(' ');

  const limit = TITLE_LIMITS[platform];
  
  if (parts.length <= limit) return parts;
  
  // Skróć elegancko — usuń elementy od końca aż zmieści się w limicie
  // Zawsze zachowaj: Część + Marka + Model
  return truncateTitle(parts, limit);
}

⚙️ LOGIKA BACKENDOWA — FLOW WYSTAWIANIA
BullMQ — Retry i Resilience
typescript// publish.job.ts

const publishQueue = new Queue('publish', { connection: redisClient });

const publishWorker = new Worker('publish', async (job) => {
  const { listingId, platform, userId } = job.data;

  try {
    const listing = await prisma.listing.findUnique({ /* z relacjami */ });
    const platformService = getPlatformService(platform);
    
    // 1. Pobierz externalCategoryId — rzuci błąd jeśli brak mapowania
    const categoryId = await categoryService.getExternalCategoryId(
      listing.categoryId, platform
    );
    
    // 2. Pobierz schemat atrybutów i zbuduj payload
    const attributeSchema = await categoryService.getAttributeSchema(
      listing.categoryId, platform
    );
    const payload = platformService.buildPayload(listing, categoryId, attributeSchema);
    
    // 3. Wyślij zdjęcia do platformy (jeśli wymagane)
    const imageUrls = await imageService.getPresignedUrls(listing.images);
    
    // 4. Wywołaj API platformy
    const result = await platformService.publishListing(payload, imageUrls);
    
    // 5. Zapisz wynik
    await prisma.platformListing.update({
      where: { listingId_platform: { listingId, platform } },
      data: {
        externalId: result.externalId,
        externalUrl: result.externalUrl,
        status: 'ACTIVE',
        publishedAt: new Date(),
      }
    });

  } catch (error) {
    await prisma.platformListing.update({
      where: { listingId_platform: { listingId, platform } },
      data: {
        status: 'ERROR',
        errorMessage: error.message,
        errorCode: error.code ?? null,
        retryCount: { increment: 1 },
      }
    });
    throw error; // BullMQ obsłuży retry
  }
}, {
  connection: redisClient,
  concurrency: 5,
});

// RETRY STRATEGY — exponential backoff
publishQueue.add('publish', jobData, {
  attempts: 4,                    // 4 próby łącznie
  backoff: {
    type: 'exponential',
    delay: 2000,                  // 2s → 4s → 8s → 16s
  },
  removeOnComplete: { age: 86400 },  // usuń po 24h
  removeOnFail: { age: 7 * 86400 }, // błędy trzymaj 7 dni
});
Flow wystawiania (controller)
POST /api/listings/:id/publish
Body: { platforms: ["ALLEGRO", "OVOKO", "OLX"] }

→ Walidacja: czy listing należy do userId
→ Walidacja: czy wszystkie wybrane platformy są aktywne (UserPlatform.isActive)
→ Walidacja: czy listing ma wszystkie wymagane pola (title, images, categoryId)
→ Dla każdej platformy:
    1. Oblicz finalPrice = basePrice + marża (MarginRule)
    2. Wygeneruj platformTitle (dostosowany do limitu znaków)
    3. Utwórz PlatformListing { status: PENDING, finalPrice, platformTitle }
    4. Dodaj job do BullMQ
→ Zaktualizuj Listing.status = PUBLISHING
→ Zwróć 202 Accepted + { jobIds, platforms }

Frontend polling:
GET /api/listings/:id/publish-status
→ Zwraca { platform: status } per platforma
→ Frontend odpytuje co 3s (React Query refetchInterval)
→ Zatrzymuje polling gdy wszystkie platformy mają status ACTIVE lub ERROR

🖼️ STORAGE ZDJĘĆ — S3/R2
Zasada: nigdy nie przechowuj zdjęć na lokalnym filesystem. W produkcji to nie zadziała.
typescript// image.service.ts

class ImageService {
  private s3: S3Client;
  private bucket = process.env.S3_BUCKET!;

  // Upload zdjęcia: Multer → Sharp (resize + WebP) → S3
  async uploadImage(file: Express.Multer.File, listingId: string): Promise<string> {
    const optimized = await sharp(file.buffer)
      .resize(1600, 1200, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();

    const key = `listings/${listingId}/${Date.now()}-${crypto.randomUUID()}.webp`;
    
    await this.s3.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: optimized,
      ContentType: 'image/webp',
    }));

    return key; // zapisuj klucz S3, nie URL
  }

  // Generuj presigned URL (ważny 1h) — do wyświetlania w UI
  async getPresignedUrl(s3Key: string): Promise<string> {
    return getSignedUrl(this.s3, new GetObjectCommand({
      Bucket: this.bucket,
      Key: s3Key,
    }), { expiresIn: 3600 });
  }
}
Dla lokalnego developmentu użyj MinIO jako S3-compatible storage w docker-compose:
yaml# docker-compose.yml
services:
  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    ports:
      - "9000:9000"   # S3 API
      - "9001:9001"   # Web console
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    volumes:
      - minio_data:/data
# .env (lokalnie)
S3_ENDPOINT=http://localhost:9000
S3_BUCKET=autolister-dev
S3_REGION=us-east-1
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin

🖥️ STRONY I FUNKCJONALNOŚCI
1. Autentykacja (/login, /register)

Formularz rejestracji z Zod validation
JWT: access token 15min, refresh token 7 dni (httpOnly cookie)
Protected routes — redirect gdy brak tokenu

2. Dashboard (/dashboard)

Liczniki aktywnych ogłoszeń per platforma
Status połączeń platform (zielony/czerwony)
Lista ostatnich 5 ogłoszeń
CTA „+ Dodaj ogłoszenie"

3. Tworzenie ogłoszenia (/listings/new) — KLUCZOWY EKRAN
Opcjonalne pole AI na początku (przed krokami):

Input "Szybki opis" + przycisk "Wypełnij automatycznie"
Po parsowaniu: wypełnia pola, podświetla niepewne

4-krokowy wizard:
Krok 1: Identyfikacja pojazdu i części

Toggle: VIN | Numer katalogowy | Opis manualny
Typ pojazdu (radio z ikonami)
Marka: searchable select z VehicleMake z bazy (z autocomplete)
Model: searchable select z VehicleModel filtrowany po marce
Generacja (opcjonalnie): select z VehicleGeneration
Rok (jeśli brak generacji): number input
Silnik: wolny tekst (opcjonalne)

Krok 2: Szczegóły części

Kategoria: drzewo 2-poziomowe (select → podkategoria)
Strona montażu: Lewa / Prawa / Nie dotyczy
Stan: Nowy | Używany | Uszkodzony
Opis uszkodzeń (widoczne gdy Uszkodzony)
Tytuł: autogenerowany, edytowalny
Opis: textarea, min. 50 znaków

Krok 3: Zdjęcia

Drag & drop (Dropzone), min. 1, max. 20
Sortowanie drag & drop
Oznaczenie zdjęcia głównego
Progres upload do S3

Krok 4: Platformy i ceny

Cena bazowa (PLN)
Karta per platforma z toggle włącz/wyłącz
Wyświetl: marża z ustawień → obliczona cena końcowa na żywo
Override marży jednorazowo (advanced)
Podgląd tytułu na każdej platformie (z info o obcięciu)
Nieaktywne platformy: disabled + tooltip "Połącz w Ustawieniach"

4. Lista ogłoszeń (/listings)

Tabela: Zdjęcie, Tytuł, Pojazd, Cena bazowa, Platformy (statusy), Data, Akcje
Filtrowanie + wyszukiwarka
Paginacja cursor-based (20/strona)
Akcje: Edytuj, Zakończ na wszystkich, Duplikuj, Usuń

5. Połączenia z platformami (/platforms)

Karta per platforma z logo i statusem
Flow połączenia per platforma:

Allegro: OAuth 2.0 Device Flow (user wchodzi na URL, wpisuje kod)
Ovoko: formularz API token (user_token + password z panelu Ovoko)
Otomoto: OAuth 2.0 (redirect)
OLX: OAuth 2.0 (redirect)
eBay: OAuth 2.0 (redirect)


Data wygaśnięcia + auto-refresh tokenów

6. Ustawienia marż (/settings/margins)

Per platforma: typ (% / kwota stała) + wartość
Live preview: "100 PLN → X PLN na tej platformie"
Auto-save z debounce 500ms

7. Zamówienia (/orders)

Pobierane z aktywnych platform (MOCK w trybie deweloperskim)
Kolumny: Platforma, Numer, Część, Kwota, Status, Data
Link do oryginału na platformie


🔒 BEZPIECZEŃSTWO

Tokeny OAuth: AES-256 encryption przed zapisem w bazie
JWT w httpOnly cookie (nie localStorage)
Rate limiting: 100 req/15min per IP, 10 req/min na /api/listings/parse-input
Walidacja inputów: Zod na backendzie na każdym endpoincie
Sanityzacja HTML: sanitize-html na backendzie dla pola description
CORS: whitelist origin z .env
Zdjęcia: walidacja MIME type (image/jpeg, image/png, image/webp), max 10MB
Każdy endpoint: middleware sprawdzający req.userId === resource.userId
SQL injection: niemożliwe dzięki Prisma (parameterized queries)


🚀 KOLEJNOŚĆ IMPLEMENTACJI
Buduj DOKŁADNIE w tej kolejności. Nie przeskakuj etapów.
Etap 1 — Fundament (bez tego nic nie działa)

Monorepo setup, Vite + React + TS, Express + TS, docker-compose (postgres + redis + minio)
Prisma schema + migracja + seed (VehicleMake, VehicleModel, InternalCategory z drzewem)
Auth: register/login, JWT (httpOnly cookie), middleware, refresh token
Podstawowy layout: React Router, Sidebar, Navbar, protected routes

Etap 2 — Rdzeń produktu

CRUD ogłoszeń: backend endpoints + Prisma queries
Upload zdjęć: Multer → Sharp → MinIO (S3-compatible lokalnie)
4-krokowy wizard formularza tworzenia ogłoszenia
Lista ogłoszeń z filtrowaniem i paginacją
Edycja i duplikowanie ogłoszeń

Etap 3 — System kategorii i mapowań

Seed mapowań PlatformCategoryMapping z mock danymi (MOCK MODE)
CategoryService: getExternalCategoryId, getAttributeSchema
Generator tytułów per platforma z limitami znaków

Etap 4 — AI Parser

ai-parser.service.ts: implementacja z OpenAI lub regex fallback
Endpoint POST /api/listings/parse-input
UI: pole "Szybki opis" + wypełnianie formularza

Etap 5 — Integracje platform (MOCK domyślnie)

BasePlatformService: abstrakcja wspólna
Serwisy per platforma z MOCK mode: Allegro, Ovoko, Otomoto, OLX, eBay
BullMQ: publish queue + worker + retry (exponential backoff)
Strona platform: połączenia, OAuth flow (MOCK w trybie dev)
Frontend polling statusów (React Query refetchInterval)

Etap 6 — Marże i Dashboard

MarginRule CRUD + obliczanie finalPrice
Live preview cen w kroku 4 wizarda
Dashboard: statystyki, wykresy (Recharts), ostatnie ogłoszenia

Etap 7 — Finalizacja

Zamówienia (MOCK dane z platform)
Globalna obsługa błędów (Error boundary, Toast notifications)
Loading i empty states wszędzie
Responsywność (mobile sidebar jako drawer)
README z docker-compose up one-liner


✅ WYMAGANIA JAKOŚCI KODU

TypeScript strict mode — frontend i backend
Zod schemas — walidacja na każdym backendowym endpoincie
Error handling — try/catch wszędzie, błędy API platform logowane z errorCode
Loading states — skeleton screens zamiast spinnerów (lepszy UX)
Empty states — dedykowane komponenty dla pustych list
Komentarze — każdy nieoczywisty fragment logiki biznesowej
Zmienne środowiskowe — każdy sekret w .env, walidacja przy starcie serwera
Modularność — max 250 linii per plik, wydzielaj bezwzględnie
Brak magic strings — constants.ts dla enum-like wartości


📋 ZASADY DLA AGENTA

Zacznij od Etapu 1 — bez bazy i auth nic nie zadziała
MOCK mode jest domyślny — nie blokuj się na braku tokenów platform
Po każdym etapie zweryfikuj że poprzednie funkcje nadal działają
Seed bazy jest krytyczny — bez VehicleMake i InternalCategory formularze są puste
S3 lokalnie = MinIO — skonfiguruj w docker-compose, użyj tego samego SDK co S3
Gdy brak kategorii platformy — rzuć czytelny błąd, nie pozwól wystawić z domyślnym ID
Tytuły generuj per platforma — nie jeden tytuł dla wszystkich
AI Parser — jeśli brak API key, użyj regex fallback i poinformuj użytkownika
Każdy nowy plik zacznij od komentarza opisującego cel modułu
Nie commituj sekretów — sprawdź .gitignore przy inicjalizacji repo


🌍 ZMIENNE ŚRODOWISKOWE (.env.example)
bash# App
NODE_ENV=development
PORT=3001
CLIENT_URL=http://localhost:5173

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/autolister

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=change-me-in-production-min-32-chars
JWT_REFRESH_SECRET=change-me-refresh-min-32-chars

# Encryption (AES-256 dla tokenów OAuth)
ENCRYPTION_KEY=change-me-exactly-32-chars-long!!

# Storage (lokalnie: MinIO, produkcja: S3/R2)
S3_ENDPOINT=http://localhost:9000
S3_BUCKET=autolister-dev
S3_REGION=us-east-1
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin

# AI Parser (opcjonalne — jeśli brak, użyj regex fallback)
OPENAI_API_KEY=

# Platformy — MOCK MODE (true = brak prawdziwego API)
ALLEGRO_MOCK=true
ALLEGRO_CLIENT_ID=
ALLEGRO_CLIENT_SECRET=

OVOKO_MOCK=true
OVOKO_API_URL=https://api.ovoko.com

OTOMOTO_MOCK=true
OTOMOTO_CLIENT_ID=
OTOMOTO_CLIENT_SECRET=

OLX_MOCK=true
OLX_CLIENT_ID=
OLX_CLIENT_SECRET=

EBAY_MOCK=true
EBAY_CLIENT_ID=
EBAY_CLIENT_SECRET=
EBAY_SANDBOX=true

Wersja promptu: 2.0 | Projekt: AutoLister SaaS | Stack: React + Node.js + PostgreSQL | Ostatnia aktualizacja: uwzględnia krytyczne poprawki architektury