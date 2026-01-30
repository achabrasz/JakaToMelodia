# 🎵 Jaka To Melodia - Instrukcja

## Opis projektu

"Jaka To Melodia" to wieloosobowa gra muzyczna inspirowana popularnym teleturniejem. Gracze dołączają do pokoi, słuchają fragmentów utworów z playlist Spotify i zgadują tytuły lub wykonawców, zdobywając punkty.

## Architektura

### Backend (.NET 10)
- **Web API**: ASP.NET Core z kontrolerami REST
- **SignalR**: Komunikacja w czasie rzeczywistym
- **Spotify API**: Integracja z biblioteką SpotifyAPI.Web
- **Zarządzanie stanem**: In-memory (bez bazy danych)

### Frontend (React + TypeScript)
- **React 19**: Najnowsza wersja z hooki
- **TypeScript**: Typowanie statyczne
- **Vite**: Szybkie narzędzie build
- **SignalR Client**: Klient WebSocket
- **Zustand**: Lekkie zarządzanie stanem
- **React Router**: Routing między stronami

## Struktura projektu

### Backend

```
JakaToMelodiaBackend/
├── Controllers/
│   ├── RoomController.cs       # Endpoints do zarządzania pokojami
│   └── SpotifyController.cs    # Endpoints Spotify API
├── Hubs/
│   └── GameHub.cs              # SignalR hub (WebSocket)
├── Models/
│   ├── GameRoom.cs             # Model pokoju gry
│   ├── Player.cs               # Model gracza
│   ├── Song.cs                 # Model utworu
│   ├── GuessResult.cs          # Wynik zgadywania
│   └── SpotifySettings.cs      # Konfiguracja Spotify
├── Services/
│   ├── GameService.cs          # Logika gry
│   └── SpotifyService.cs       # Integracja Spotify
├── Properties/
│   └── launchSettings.json     # Konfiguracja uruchamiania
├── appsettings.json            # Konfiguracja aplikacji
└── Program.cs                  # Punkt wejścia aplikacji
```

### Frontend

```
Frontend/
├── src/
│   ├── components/
│   │   ├── PlayerList.tsx      # Lista graczy
│   │   ├── PlaylistInput.tsx   # Input playlisty
│   │   ├── GamePlay.tsx        # Główna rozgrywka
│   │   └── Leaderboard.tsx     # Tabela wyników
│   ├── pages/
│   │   ├── HomePage.tsx        # Strona główna
│   │   └── GameRoomPage.tsx    # Strona pokoju gry
│   ├── services/
│   │   ├── signalRService.ts   # Serwis SignalR
│   │   └── spotifyService.ts   # Serwis Spotify
│   ├── store/
│   │   └── gameStore.ts        # Zustand store
│   ├── types/
│   │   └── index.ts            # Typy TypeScript
│   ├── App.tsx                 # Komponent główny
│   └── main.tsx                # Punkt wejścia
├── package.json
└── vite.config.ts
```

## Funkcje szczegółowe

### 1. Tworzenie i zarządzanie pokojami
- Generowanie unikalnych 6-znakowych kodów
- Pierwszy gracz staje się gospodarzem
- Automatyczne usuwanie nieaktywnych pokoi (2h)

### 2. System zgadywania
- **Fuzzy matching**: Tolerancja na drobne błędy
- **Normalizacja**: Ignorowanie wielkości liter, znaków specjalnych
- **Podobieństwo**: Wymóg 60% podobieństwa dla częściowych odpowiedzi

### 3. Punktacja
- Tytuł utworu: **100 punktów**
- Wykonawca: **50 punktów**
- Jeden gracz może zgadnąć tylko raz na rundę

### 4. Integracja Spotify
- Pobieranie playlist przez ID
- Filtrowanie utworów z preview URL (30s)
- Obsługa obrazów albumów
- Client Credentials flow (bez logowania użytkownika)

### 5. Real-time komunikacja
- SignalR z automatycznym reconnect
- Broadcasting zmian stanu do wszystkich graczy
- Synchronizacja odtwarzania audio

## Przepływ gry

```
┌─────────────────┐
│  Strona Główna  │
│  - Wpisz imię   │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼───┐ ┌──▼────┐
│Utwórz │ │Dołącz │
│ pokój │ │pokoju │
└───┬───┘ └──┬────┘
    │        │
    └────┬───┘
         │
┌────────▼────────┐
│   Poczekalnia   │
│ - Host dodaje   │
│   playlistę     │
└────────┬────────┘
         │
┌────────▼────────┐
│      Gra        │
│ - Odtwarzanie   │
│ - Zgadywanie    │
│ - Punktacja     │
└────────┬────────┘
         │
┌────────▼────────┐
│  Tabela Wyników │
│  - Ranking      │
│  - Zwycięzca    │
└─────────────────┘
```

## Konfiguracja Spotify API

### Krok 1: Tworzenie aplikacji
1. Wejdź na https://developer.spotify.com/dashboard
2. Kliknij "Create an app"
3. Wypełnij formularz:
   - App name: "Jaka To Melodia"
   - App description: "Music quiz game"
   - Redirect URI: `http://localhost:5000/api/spotify/callback`

### Krok 2: Pobranie danych
- Skopiuj **Client ID**
- Skopiuj **Client Secret** (kliknij "Show Client Secret")

### Krok 3: Konfiguracja
Wklej dane do `JakaToMelodiaBackend/appsettings.Development.json`

## Uruchamianie projektu

### Backend
```powershell
cd JakaToMelodiaBackend
dotnet restore
dotnet run
```

Backend: http://localhost:5000
Swagger: http://localhost:5000/swagger

### Frontend
```powershell
cd Frontend
npm install
npm run dev
```

Frontend: http://localhost:5173

## Testowanie

### Test 1: Tworzenie pokoju
1. Otwórz http://localhost:5173
2. Wpisz imię i kliknij "Utwórz pokój"
3. Sprawdź czy otrzymałeś kod pokoju

### Test 2: Dołączanie do pokoju
1. Otwórz nową kartę przeglądarki (tryb incognito)
2. Wpisz imię i kod pokoju
3. Kliknij "Dołącz do pokoju"
4. Sprawdź czy oba okna widzą się nawzajem

### Test 3: Ładowanie playlisty
1. Znajdź playlistę na Spotify (np. "Top 50 Poland")
2. Skopiuj link (Udostępnij → Kopiuj link do playlisty)
3. Wklej w pole "Dodaj playlistę Spotify"
4. Sprawdź czy utwory się załadowały

### Test 4: Rozgrywka
1. Kliknij "Rozpocznij grę"
2. Słuchaj fragmentu utworu
3. Wpisz tytuł lub wykonawcę
4. Sprawdź punktację

## Znane ograniczenia

1. **Brak preview URL**: Niektóre utwory Spotify nie mają 30-sekundowych podglądów
2. **In-memory storage**: Stan gry znika po restarcie serwera
3. **Brak autentykacji**: Każdy może dołączyć znając kod pokoju
4. **Jeden host**: Tylko gospodarz kontroluje przebieg gry
5. **Brak historii**: Nie zapisujemy statystyk graczy

## Możliwe rozszerzenia

### Krótkoterminowe
- [ ] Efekty dźwiękowe (poprawna/błędna odpowiedź)
- [ ] Animacje przejść
- [ ] Timer na rundę
- [ ] Pause/Resume dla gospodarza
- [ ] Kick player (usunięcie gracza)

### Średnioterminowe
- [ ] Baza danych (PostgreSQL/MongoDB)
- [ ] Statystyki graczy
- [ ] Historia gier
- [ ] Różne tryby gry (szybkie/normalne/trudne)
- [ ] Konfigurowalny czas rundy
- [ ] Chat w pokoju

### Długoterminowe
- [ ] System kont użytkowników
- [ ] Rankingi globalne
- [ ] Turnieje
- [ ] Własne playlisty (mix z różnych źródeł)
- [ ] Aplikacja mobilna (React Native)
- [ ] Integracja z innymi serwisami muzycznymi
- [ ] Power-upy i bonusy
- [ ] System osiągnięć

## Rozwiązywanie problemów

### Backend nie kompiluje się
```powershell
# Sprawdź wersję .NET
dotnet --version  # Powinno być 10.x

# Wyczyść i przywróć
dotnet clean
dotnet restore
```

### Frontend - błędy TypeScript
```powershell
# Zainstaluj ponownie node_modules
rm -rf node_modules
npm install

# Sprawdź czy wszystkie pakiety są zainstalowane
npm list
```

### Spotify API nie działa
- Sprawdź czy Client ID i Secret są poprawne
- Upewnij się że Redirect URI jest dokładnie taki sam
- Sprawdź czy playlista jest publiczna

### SignalR się rozłącza
- Sprawdź konsolę przeglądarki (F12)
- Sprawdź logi backendu
- Upewnij się że CORS jest poprawnie skonfigurowany

### Audio się nie odtwarza
- Sprawdź czy utwór ma preview URL
- Sprawdź konsolę przeglądarki dla błędów CORS
- Niektóre przeglądarki blokują autoplay

## Bezpieczeństwo

⚠️ **Ostrzeżenia dla produkcji:**

1. **Nie commituj secretów**: Dodaj `appsettings.Development.json` do `.gitignore`
2. **HTTPS**: Użyj certyfikatów SSL w produkcji
3. **CORS**: Ogranicz dozwolone origin do swoich domen
4. **Rate limiting**: Dodaj ograniczenia żądań API
5. **Walidacja**: Validuj wszystkie inputy użytkownika
6. **Sanityzacja**: Sanityzuj dane przed wyświetlaniem

## Performance

### Optymalizacje Backend
- Używaj `Singleton` dla serwisów
- Cachuj odpowiedzi Spotify API
- Użyj `async/await` dla I/O
- Cleanup nieaktywnych pokoi

### Optymalizacje Frontend
- Lazy loading komponentów
- Memoizacja kalkulacji
- Debounce dla inputów
- Optymalizacja re-renderów React

## Licencja

MIT License - możesz używać w projektach komercyjnych i prywatnych.

## Wsparcie

Problemy? Stwórz issue na GitHubie lub sprawdź dokumentację API.

---

Miłej zabawy! 🎵🎉
