# 🎵 Jaka To Melodia - Spotify Music Quiz Game

Multiplayer music guessing game using Spotify API with .NET 10 backend and React TypeScript frontend.

## Features

- 🎮 Create and join game rooms with unique codes
- 🎵 Load playlists from Spotify URLs
- 🎯 Guess song titles (100 points) or artists (50 points)
- 👥 Real-time multiplayer with SignalR
- 🏆 Live leaderboard and final rankings
- 🎨 Modern, responsive UI

## Tech Stack

### Backend
- .NET 10 Web API
- SignalR for real-time communication
- SpotifyAPI.Web for Spotify integration
- In-memory game state management

### Frontend
- React 19 with TypeScript
- Vite for build tooling
- SignalR client for real-time updates
- Zustand for state management
- React Router for navigation

## Setup

### Prerequisites
- .NET 10 SDK
- Node.js 18+
- Spotify Developer Account

### Spotify API Setup

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Note your **Client ID** and **Client Secret**
4. Add redirect URI: `http://localhost:5000/api/spotify/callback`

### Backend Setup

1. Navigate to backend directory:
```powershell
cd JakaToMelodiaBackend
```

2. Update `appsettings.Development.json` with your Spotify credentials:
```json
{
  "Spotify": {
    "ClientId": "YOUR_SPOTIFY_CLIENT_ID",
    "ClientSecret": "YOUR_SPOTIFY_CLIENT_SECRET",
    "RedirectUri": "http://localhost:5000/api/spotify/callback"
  }
}
```

3. Restore packages and run:
```powershell
dotnet restore
dotnet run
```

Backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
```powershell
cd Frontend
```

2. Install dependencies:
```powershell
npm install
```

3. Run development server:
```powershell
npm run dev
```

Frontend will run on `http://localhost:5173`

### Quick Run Scripts (Windows PowerShell)

After setup, you can use these scripts:

**Backend:**
```powershell
.\run-backend.ps1
```

**Frontend:**
```powershell
.\run-frontend.ps1
```

## How to Play

1. **Create a Room**
   - Enter your name and click "Utwórz pokój"
   - Share the room code with friends

2. **Join a Room**
   - Enter your name and the room code
   - Click "Dołącz do pokoju"

3. **Host: Set Playlist**
   - Paste a Spotify playlist URL
   - Click "Załaduj playlistę"
   - Click "Rozpocznij grę" when ready

4. **Play the Game**
   - Listen to the 30-second preview
   - Type the song title or artist name
   - Submit your guess
   - Host ends the round to reveal the answer

5. **Win!**
   - Score points for correct guesses
   - Compete with friends
   - Check the final leaderboard

## Project Structure

```
JakaToMelodia/
├── JakaToMelodiaBackend/
│   ├── Controllers/       # API endpoints
│   ├── Hubs/             # SignalR hub
│   ├── Models/           # Data models
│   ├── Services/         # Business logic
│   └── Program.cs        # App configuration
│
├── Frontend/
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── pages/        # Page components
│   │   ├── services/     # API services
│   │   ├── store/        # State management
│   │   └── types/        # TypeScript types
│   └── package.json
│
└── README.md
```

## API Endpoints

### REST API
- `GET /api/room/{roomCode}` - Get room details
- `GET /api/spotify/playlist/{playlistId}` - Get playlist tracks

### SignalR Hub (`/gameHub`)
- `CreateRoom(playerName)` - Create new game room
- `JoinRoom(roomCode, playerName)` - Join existing room
- `SetPlaylist(roomCode, playlistUrl)` - Load Spotify playlist
- `StartGame(roomCode)` - Begin the game
- `SubmitGuess(roomCode, playerId, guess)` - Submit a guess
- `EndRound(roomCode)` - End current round
- `NextRound(roomCode)` - Start next round

## Development Notes

- Songs without preview URLs are automatically filtered out
- Room codes are 6-character alphanumeric strings
- Rooms auto-expire after 2 hours of inactivity
- Fuzzy matching algorithm for guess validation
- First player to join becomes the host

## Future Improvements

- [ ] Persistent storage with database
- [ ] User authentication
- [ ] Custom game settings (round duration, points)
- [ ] Sound effects and animations
- [ ] Mobile app version
- [ ] Multiple playlists per game
- [ ] Player avatars
- [ ] Chat system

## License

MIT

## Credits

Built with ❤️ using Spotify Web API
