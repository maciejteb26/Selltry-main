1. Zasady startu projektu
Każdy projekt powinien zaczynać się od spisania zasad pracy. Minimum wejściowe to:
CLAUDE.md
Cursor Rules
Są to dokumenty, które definiują sposób pracy nad repozytorium i stanowią punkt odniesienia zarówno dla człowieka, jak i dla narzędzi wspierających development.
Co powinno znaleźć się w tych zasadach
Założenia architektoniczne - Jak zbudowany jest projekt, jakie są moduły, jakie są granice odpowiedzialności.
Zasady implementacji - Jak pisać kod, gdzie dodawać nowe elementy, jak nazywać pliki, klasy, funkcje i katalogi.
Zasady weryfikacji - Co musi zostać sprawdzone po każdym tasku, jakie testy uruchamiamy i kiedy.
Zasady bezpieczeństwa -  Które obszary wymagają podwyższonej uwagi, np. auth, logowanie, uprawnienia, sekrety, integracje.
Zasady pracy z PR-ami - Każda zmiana powinna przechodzić przez Pull Request, nawet jeśli autor sam ją później merguje.

Bez tego bardzo szybko pojawia się chaos: AI generuje kod niespójnie, człowiek wdraża różne style i skróty, a projekt zaczyna się rozjeżdżać.
2. Własność repozytorium i standard jego tworzenia 
Repozytorium powinno być tworzone w organizacji a nie na prywatnym koncie developera. Zapewnia to kontrolę, ciągłość projektu i bezpieczeństwo dostępu.
Standard tworzenia repo
Repo powstaje w organizacji na GitHubie
Ustawiony jest właściciel projektu (owner)
Skonfigurowane są zespoły i uprawnienia:
Admin
Maintainer
Developer
Read-only (np. dla interesariuszy)
Włączone są branch protections dla main/master
Wymagane są Pull Requesty do merge’a
Wymagane przejście CI przed merge’em
3. Stack i sposób weryfikacji muszą być zaprojektowane przed pierwszym feature’em
To jest punkt krytyczny. Jeszcze przed rozpoczęciem developmentu należy określić:
stack technologiczny,
strukturę aplikacji,
sposób uruchamiania projektu,
sposób testowania,
sposób weryfikacji zmian.
To nie może być decyzja odkładana na później. Jeżeli ten etap zostanie potraktowany luźno, to każdy kolejny feature będzie zwiększał chaos i koszt utrzymania.

Największy błąd to założenie, że raz ustalony stack i sposób weryfikacji “same się utrzymają”. Nie utrzymają się.
W praktyce trzeba regularnie wracać do pytania:
czy obecny sposób testowania dalej wystarcza,
czy struktura katalogów nadal jest czytelna,
czy moduły mają sensowne granice,
czy zasady wpisane do CLAUDE.md i Cursor Rules są aktualne,
czy AI nadal działa zgodnie z oczekiwanym procesem.
To jest punkt, który najłatwiej zepsuć i którego konsekwencje wychodzą dopiero później. Jeśli ten obszar się rozjedzie, to później rozjedzie się wszystko: struktura kodu, wdrożenia, review i utrzymanie.
Dlaczego to jest tak ważne
Każdy task powinien kończyć się możliwością szybkiej odpowiedzi na pytanie:
czy to działa i czy niczego nie zepsuło?
Żeby to było możliwe, trzeba z góry ustalić:
jakie typy testów mamy,
gdzie są umieszczone,
jak je uruchamiać,
które testy są obowiązkowe przy danym typie zmiany,
jakie są kryteria uznania tasku za zamknięty.
W praktyce
Po każdym tasku wykonawca - człowiek albo AI - powinien wiedzieć dokładnie:
co ma sprawdzić,
jak ma to sprawdzić,
jak udokumentować wynik.
To powinno być wpisane bezpośrednio do CLAUDE.md i Cursor Rules, tak aby narzędzie działało według tego samego schematu przy każdym zadaniu.
4. Weryfikacja po każdym tasku
Po zakończeniu każdego tasku musi następować kontrola jakości. Najlepiej, jeśli jest to wymuszone procesowo.
Oczekiwane poziomy testów
Testy jednostkowe
Sprawdzają pojedyncze funkcje, klasy i moduły.
 Powinny pokrywać logikę biznesową i elementy o wysokim ryzyku regresji.
Testy integracyjne
Sprawdzają współpracę między modułami, bazą danych, kolejkami, API i innymi komponentami systemu.
Testy end-to-end
Walidują pełne ścieżki użytkownika i najważniejsze scenariusze biznesowe.
Smoke testy
Szybki zestaw testów uruchamiany po zmianach, który daje odpowiedź, czy aplikacja w ogóle wstała i działa na podstawowym poziomie.
Organizacja testów
Testy powinny być ułożone w sposób czytelny i łatwy do uruchamiania, np. według katalogów:
tests/unit
tests/integration
tests/e2e
tests/smoke
Dzięki temu można szybko odpalać tylko to, co jest potrzebne w danym momencie, zamiast każdorazowo uruchamiać cały zestaw.
Zasada operacyjna
Po każdym tasku wykonawca powinien:
uruchomić testy adekwatne do zakresu zmiany,
dopisać brakujące testy, jeśli zmiana wprowadza nową logikę,
sprawdzić, czy nic nie narusza kontraktów między modułami,
upewnić się, że build i podstawowe flow nadal działają.
Ten punkt nie może być pominięty. To jest fundament stabilnego developmentu.
5. Struktura modułów i architektura modular monolith
W dokumentacji zasad należy jasno opisać strukturę modułów. Najlepszym podejściem na starcie wielu projektów jest modular monolith.
Dlaczego modular monolith
To podejście daje kilka bardzo praktycznych korzyści:
pozwala utrzymać porządek bez przedwczesnego rozbijania systemu na mikroserwisy,
ogranicza skakanie po całym kodzie przy realizacji jednego tasku,
buduje naturalne granice odpowiedzialności,
ułatwia onboarding,
dobrze współpracuje z narzędziami AI, które mogą działać w obrębie jednego modułu lub kontekstu.
Zasada
Każdy moduł powinien mieć jasno określone:
odpowiedzialności,
publiczne API,
zależności,
miejsce na testy,
miejsce na dokumentację wewnętrzną.
Dzięki temu, gdy trzeba wykonać określoną pracę, nie analizuje się całego repozytorium, tylko działa w ramach konkretnego obszaru systemu.
To bardzo mocno poprawia jakość developmentu i zmniejsza ryzyko przypadkowego psucia innych części aplikacji.
6. Spec-driven development
Development powinien być prowadzony w modelu spec-driven development. Oznacza to, że implementacja nie startuje od “pisania kodu”, tylko od zdefiniowania, co dokładnie ma powstać i jak to zweryfikować.
Narzędzia
Można wykorzystać rozwiązania takie jak:
SpecKit
Get Shit Done
Oba podejścia dobrze integrują się z Claude i Cursor, więc mogą stać się warstwą sterującą dla całego procesu.
Co daje spec-driven development
zmniejsza ryzyko błędnej interpretacji tasku,
porządkuje zakres pracy,
ułatwia delegowanie zadań do AI,
pozwala budować powtarzalny workflow,
poprawia jakość review i testów, bo wiadomo, do czego odnosimy zmianę.
Zalecany przepływ
Opis celu i zakresu zmiany.
Spis wymagań funkcjonalnych i niefunkcjonalnych.
Określenie wpływu na architekturę i moduły.
Określenie planu testów.
Dopiero potem implementacja.
To podejście szczególnie dobrze działa wtedy, gdy projekt ma rosnąć i być utrzymywany długoterminowo.
7. Agentic Development Environment

W projektach intensywnie wykorzystujących agentów AI do generowania kodu zaleca się stosowanie narzędzi typu Agentic Development Environment (ADE), takich jak Kintsugi.
Kintsugi jest narzędziem rozwijanym przez Sonar, które umożliwia zarządzanie pracą agentów CLI (np. Claude Code) oraz kontrolę jakości i bezpieczeństwa generowanych zmian przed ich wprowadzeniem do repozytorium.
Cel użycia
Zapewnienie kontroli nad kodem generowanym przez AI poprzez:
strukturalne review zmian,
analizę planów działania agenta,
wbudowane mechanizmy jakości i bezpieczeństwa,
zarządzanie wieloma równoległymi zadaniami AI,
ograniczenie ryzyka wprowadzenia wadliwego kodu.
Zakres zastosowania
Kintsugi pełni rolę dodatkowej warstwy weryfikacji pomiędzy etapem generowania kodu przez AI a formalnym procesem Pull Request.
Może być stosowane szczególnie w sytuacjach:
intensywnego użycia agentów CLI,
równoległej pracy wielu sesji AI,
projektów o wysokich wymaganiach jakościowych i bezpieczeństwa,
zespołów pracujących w modelu AI-first.
8. Code review jako obowiązkowy etap procesu
Review kodu nie jest opcjonalne. Nawet jeśli zespół jest mały albo jedna osoba finalnie sama merguje własne zmiany, review nadal ma sens.
Po co robić review
widać historię zmian per branch i per Pull Request,
łatwiej przeanalizować zakres zmian,
łatwiej wrócić do decyzji projektowych,
można wychwycić niespójności architektoniczne,
można wykryć błędy zanim trafią na main.
Szczególna uwaga: security review
Nie wolno odpuszczać review w obszarach związanych z bezpieczeństwem. Dotyczy to zwłaszcza:
logowania,
autoryzacji i uwierzytelniania,
zarządzania sesją i tokenami,
uprawnień,
logowania zdarzeń,
przetwarzania danych wrażliwych,
integracji z zewnętrznymi usługami.
W tych miejscach review powinno być bardziej rygorystyczne niż w standardowych taskach.
Wsparcie AI w review
Copilot, Cursor czy inne narzędzia mogą wspierać review, ale nie powinny być jedynym mechanizmem oceny jakości. Ich review bywa pomocne, ale zazwyczaj jest zbyt płytkie, szczególnie przy aspektach architektury i bezpieczeństwa.
9. Wszystko przez Pull Requesty
Każda zmiana powinna powstawać w branchu i przechodzić przez Pull Request.
Nawet jeśli autor sam wykonuje merge, PR daje:
historię decyzji,
możliwość komentarzy,
czytelny diff,
łatwiejszy rollback,
spójność procesu.
To szczególnie ważne w projektach wspieranych przez AI. PR staje się wtedy nie tylko miejscem merge’a, ale też jednostką kontroli jakości.
10. GitHub Actions i spójność lokalnej oraz zdalnej weryfikacji
Do repozytorium należy dodać pipeline CI, np. w pliku:
/.github/workflows/ci.yml
Pipeline powinien uruchamiać ten sam zestaw kontroli, który jest używany lokalnie.
Dlaczego to jest ważne
Częsty problem polega na tym, że coś działa lokalnie, ale nie działa w CI. Powody bywają różne:
lokalne zmiany niecommitowane,
inne wersje środowiska,
brakujące zależności,
inne sekrety lub konfiguracja,
przypadkowe pominięcie części testów.
Jeśli lokalny i zdalny proces weryfikacji są spójne, to ryzyko takich sytuacji mocno spada.
Minimum dla CI
Pipeline powinien wykonywać przynajmniej:
instalację zależności,
linting,
testy jednostkowe,
testy integracyjne, jeśli są szybkie i stabilne,
smoke testy lub build,
ewentualnie podstawowe kontrole bezpieczeństwa.
W idealnym układzie komendy uruchamiane lokalnie i w CI powinny być takie same.

11. Observability i monitoring
System powinien od początku posiadać podstawową obserwowalność (monitoring błędów, logi, alerty).
Sentry - monitoring aplikacji
Sentry powinno być skonfigurowane:
w organizacji,
w odpowiednim projekcie,
z integracją z aplikacją frontendową i backendową,
z release trackingiem,
z mapami źródeł (source maps) dla produkcji,
z alertami dla zespołu.
Sentry pozwala wykrywać błędy runtime, regresje i problemy użytkowników, które nie są widoczne w testach.
Monitoring Supabase
Jeżeli projekt korzysta z Supabase, należy zapewnić:
dostęp zespołowy do projektu w Supabase,
monitoring logów:
database logs
auth logs
edge functions logs
API logs
alerty dla krytycznych błędów
backup strategy (jeśli wymagane)
Logi z Supabase stanowią kluczowe źródło informacji przy debugowaniu problemów produkcyjnych.
12. Deployment i środowiska (Vercel)
Deployment powinien być wykonywany w ramach zespołu na Vercelu, a nie z prywatnego konta.
Konfiguracja
Projekt przypisany do teamu 
Podpięte repo z organizacji
Automatyczne deploymenty z branchy:
main → production
preview deployments dla PR
Zarządzanie zmiennymi środowiskowymi w Vercel
Oddzielne konfiguracje dla środowisk:
development
preview/staging
production
Dlaczego to ważne
Zapewnia:
spójność deploymentów,
możliwość debugowania środowisk preview,
bezpieczeństwo sekretów,
niezależność od pojedynczego developera.
