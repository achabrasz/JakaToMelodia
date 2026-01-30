# 🚀 START HERE - Jaka To Melodia

## Zacznij tutaj! 👇

### Krok 1: Spotify API (5 minut) ⚙️

1. Wejdź na: **https://developer.spotify.com/dashboard**
2. Zaloguj się kontem Spotify
3. Kliknij **"Create an app"**
4. Wypełnij:
   - App name: `Jaka To Melodia`
   - App description: `Music quiz game`
5. Zaakceptuj regulamin → **Create**
6. W ustawieniach aplikacji:
   - Kliknij **"Edit Settings"**
   - W polu "Redirect URIs" dodaj: `http://localhost:5000/api/spotify/callback`
   - Kliknij **"Add"** → **"Save"**
7. Wróć do Dashboard aplikacji:
   - Skopiuj **Client ID**
   - Kliknij **"Show Client Secret"** → Skopiuj **Client Secret**

### Krok 2: Konfiguracja (2 minuty) 📝

1. Otwórz plik: `JakaToMelodiaBackend\appsettings.Development.json`
2. Zastąp:
   ```json
   {
     "Spotify": {
       "ClientId": "TUTAJ_WKLEJ_TWOJ_CLIENT_ID",
       "ClientSecret": "TUTAJ_WKLEJ_TWOJ_CLIENT_SECRET",
       "RedirectUri": "http://localhost:5000/api/spotify/callback"
     }
   }
   ```
3. Zapisz plik

### Krok 3: Uruchomienie (automatyczne) 🎮

**Opcja A - Automatyczny setup (polecane):**
```powershell
.\setup.ps1
```

Następnie uruchom w dwóch osobnych terminalach:
```powershell
.\run-backend.ps1    # Terminal 1
.\run-frontend.ps1   # Terminal 2
```

**Opcja B - Ręczny setup:**

Terminal 1 - Backend:
```powershell
cd JakaToMelodiaBackend
dotnet restore
dotnet run
```
Poczekaj aż zobaczysz: `Now listening on: http://localhost:5000`

Terminal 2 - Frontend:
```powershell
cd Frontend
npm install
npm run dev
```
Poczekaj aż zobaczysz: `Local: http://localhost:5173`

### Krok 4: Graj! 🎉

1. Otwórz przeglądarkę: **http://localhost:5173**
2. Wpisz swoje imię → **"Utwórz pokój"**
3. Skopiuj kod pokoju (np. `ABC123`)
4. Znajdź playlistę na Spotify:
   - Otwórz Spotify → znajdź dowolną playlistę
   - Kliknij ⋯ (trzy kropki) → Udostępnij → **Kopiuj link do playlisty**
5. Wklej link w pole **"Dodaj playlistę Spotify"** → **"Załaduj playlistę"**
6. Kliknij **"Rozpocznij grę"**
7. Zgaduj utwory! 🎵

---

## 🎯 Szybki test z przyjaciółmi

1. Ty: Utwórz pokój → otrzymasz kod (np. `XYZ789`)
2. Przyjaciel: Otwórz **http://localhost:5173** w INNYM oknie/urządzeniu
3. Przyjaciel: Wpisz kod `XYZ789` → **"Dołącz do pokoju"**
4. Obaj powinniście widzieć się w liście graczy!
5. Ty (jako host): Dodaj playlistę → Rozpocznij grę
6. Zgadujcie równocześnie! 🏆

---

## ⚠️ Rozwiązywanie problemów

### "Cannot find module 'react-router-dom'"
```powershell
cd Frontend
npm install
```

### "Port 5000 is already in use"
Zakończ proces na porcie 5000:
```powershell
netstat -ano | findstr :5000
taskkill /PID [numer_PID] /F
```

### "Playlista się nie ładuje"
- Sprawdź czy Client ID i Secret są poprawne
- Upewnij się że playlista jest **publiczna**
- Sprawdź czy backend działa (http://localhost:5000/swagger)

### "Audio się nie odtwarza"
- ~30% utworów Spotify nie ma 30-sekundowego preview
- Spróbuj inną playlistę (np. "Top 50 Poland")

---

## 📚 Więcej informacji

| Dokument | Co zawiera |
|----------|------------|
| `README.md` | Pełna dokumentacja (EN) |
| `QUICKSTART.md` | Szybki przewodnik |
| `INSTRUKCJA.md` | Szczegółowa instrukcja (PL) |
| `PODSUMOWANIE.md` | Pełne podsumowanie projektu |
| `API_DOCUMENTATION.md` | Dokumentacja API |
| `ARCHITECTURE.md` | Architektura systemu |

---

## 🎮 Punktacja

- 🏆 **Tytuł utworu**: 100 punktów
- 🎤 **Wykonawca**: 50 punktów

---

## 🌟 Gotowe!

Jeśli dotarłeś tutaj i wszystko działa - **gratulacje!** 🎉

Teraz możesz:
- ✅ Grać z przyjaciółmi
- ✅ Eksperymentować z kodem
- ✅ Dodawać nowe funkcje
- ✅ Deployować na serwer

**Miłej zabawy!** 🎵🎊

---

Masz pytania? Sprawdź dokumentację lub otwórz issue na GitHubie.

Last update: 2026-01-30
