# Jaka To Melodia - Quick Start Guide

## 🚀 Szybki Start

### 1. Konfiguracja Spotify API

1. Przejdź na https://developer.spotify.com/dashboard
2. Zaloguj się i utwórz nową aplikację
3. Skopiuj **Client ID** i **Client Secret**
4. W ustawieniach aplikacji dodaj Redirect URI: `http://localhost:5000/api/spotify/callback`

### 2. Backend (.NET 10)

```powershell
# Przejdź do folderu backendu
cd JakaToMelodiaBackend

# Edytuj appsettings.Development.json i wklej swoje dane Spotify:
# "ClientId": "TWOJE_CLIENT_ID",
# "ClientSecret": "TWOJE_CLIENT_SECRET"

# Przywróć pakiety
dotnet restore

# Uruchom serwer
dotnet run
```

Backend uruchomi się na: **http://localhost:5000**

### 3. Frontend (React + TypeScript)

```powershell
# Przejdź do folderu frontendu
cd Frontend

# Zainstaluj zależności
npm install

# Uruchom serwer deweloperski
npm run dev
```

Frontend uruchomi się na: **http://localhost:5173**

### 4. Graj!

1. Otwórz http://localhost:5173 w przeglądarce
2. Wpisz swoje imię i utwórz pokój
3. Udostępnij kod pokoju znajomym
4. Gospodarz wkleja link do playlisty Spotify
5. Rozpocznijcie grę i zgadujcie piosenki!

## 📝 Punktacja

- **Tytuł utworu**: 100 punktów
- **Wykonawca**: 50 punktów

## 🎮 Funkcje

- ✅ Pokoje gier z unikalnymi kodami
- ✅ Ładowanie playlist ze Spotify
- ✅ Multiplayer w czasie rzeczywistym
- ✅ Live ranking graczy
- ✅ Końcowa tabela wyników
- ✅ Responsywny interfejs

## 🔧 Rozwiązywanie problemów

### Backend nie startuje
- Sprawdź czy masz zainstalowany .NET 10 SDK
- Upewnij się, że port 5000 jest wolny

### Frontend nie znajduje modułów
```powershell
cd Frontend
npm install
```

### Playlista nie ładuje się
- Sprawdź czy dane Spotify API są poprawne
- Upewnij się, że playlista jest publiczna
- Niektóre utwory mogą nie mieć preview URL

### SignalR nie łączy się
- Sprawdź czy backend działa na http://localhost:5000
- Upewnij się, że CORS jest poprawnie skonfigurowany

## 📚 Więcej informacji

Zobacz główny README.md dla pełnej dokumentacji.

Miłej zabawy! 🎵🎉
