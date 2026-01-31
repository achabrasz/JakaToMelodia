# 🚀 INSTRUKCJA URUCHOMIENIA FRONTENDU

## Krok po kroku:

### 1. Otwórz terminal w folderze Frontend
```powershell
cd C:\Users\adamc\Studia\JakaToMelodia\Frontend
```

### 2. Upewnij się że node_modules są zainstalowane
```powershell
npm install
```

### 3. Uruchom serwer deweloperski
```powershell
npm run dev
```

### 4. Otwórz przeglądarkę
- Adres: **http://localhost:5173**
- Powinieneś zobaczyć stronę z gradientowym tłem (fioletowo-niebieskim)
- Tytuł: "🎵 Jaka To Melodia"

## Jeśli strona jest pusta:

### Sprawdź konsolę przeglądarki (F12):
1. Otwórz DevTools (F12)
2. Przejdź do zakładki "Console"
3. Szukaj błędów (czerwone napisy)
4. Powinieneś zobaczyć: `🏠 HomePage rendering...`

### Możliwe problemy:

**Problem 1: Port zajęty**
```
Error: Port 5173 is already in use
```
Rozwiązanie:
```powershell
# Zabij proces na porcie 5173
netstat -ano | findstr :5173
taskkill /PID [numer_PID] /F
```

**Problem 2: Błędy modułów**
```
Cannot find module 'react-router-dom'
```
Rozwiązanie:
```powershell
rm -r node_modules
rm package-lock.json
npm install
```

**Problem 3: Vite cache**
```powershell
rm -r .vite
npm run dev
```

**Problem 4: Backend nie działa**
- Upewnij się że backend działa na http://localhost:5000
- Sprawdź http://localhost:5000/swagger

## Testowanie:

### Test 1: Strona główna
- [ ] Widzę gradient tło (fioletowo-niebieskie)
- [ ] Widzę tytuł "🎵 Jaka To Melodia"
- [ ] Widzę pole "Wpisz swoje imię"
- [ ] Widzę przycisk "Utwórz pokój"
- [ ] Widzę pole "Kod pokoju"
- [ ] Widzę przycisk "Dołącz do pokoju"

### Test 2: Tworzenie pokoju
1. Wpisz imię (np. "Adam")
2. Kliknij "Utwórz pokój"
3. Powinieneś:
   - Zobaczyć komunikat "SignalR Connected" w konsoli
   - Zostać przekierowany do /room/XXXXXX
   - Zobaczyć pokój z listą graczy

### Test 3: Błąd połączenia
Jeśli widzisz błąd:
```
Failed to create room
```
Sprawdź:
- Czy backend działa (http://localhost:5000)
- Czy CORS jest poprawnie skonfigurowany
- Konsole backendu - szukaj błędów

## Szybkie debugowanie:

```powershell
# Terminal 1 - Backend
cd C:\Users\adamc\Studia\JakaToMelodia\JakaToMelodiaBackend
dotnet run

# Terminal 2 - Frontend  
cd C:\Users\adamc\Studia\JakaToMelodia\Frontend
npm run dev

# Otwórz przeglądarkę
start http://localhost:5173
```

## Co powinieneś zobaczyć:

```
┌─────────────────────────────────────┐
│                                     │
│      🎵 Jaka To Melodia             │
│      Gra muzyczna ze Spotify        │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ Wpisz swoje imię              │  │
│  └───────────────────────────────┘  │
│                                     │
│  [  Utwórz pokój  ]                 │
│                                     │
│           lub                       │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ Kod pokoju                    │  │
│  └───────────────────────────────┘  │
│  [  Dołącz do pokoju  ]             │
│                                     │
└─────────────────────────────────────┘
```

## Potrzebujesz pomocy?

1. Sprawdź terminal z `npm run dev` - szukaj błędów
2. Sprawdź konsolę przeglądarki (F12) - szukaj błędów  
3. Sprawdź czy backend odpowiada: http://localhost:5000/swagger
4. Sprawdź logi backendu w terminalu

---

**Ważne:** Frontend MUSI być uruchomiony (`npm run dev` w terminalu). Bez tego strona będzie pusta!
