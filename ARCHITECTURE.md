# Architecture Diagram - Jaka To Melodia

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            CLIENT SIDE                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │                    React Frontend (Vite)                        │    │
│  │                    http://localhost:5173                        │    │
│  ├────────────────────────────────────────────────────────────────┤    │
│  │                                                                  │    │
│  │  Pages:                    Components:                          │    │
│  │  ├─ HomePage               ├─ PlayerList                        │    │
│  │  └─ GameRoomPage           ├─ PlaylistInput                     │    │
│  │                            ├─ GamePlay                           │    │
│  │  Services:                 └─ Leaderboard                        │    │
│  │  ├─ signalRService                                               │    │
│  │  └─ spotifyService         State Management:                     │    │
│  │                            └─ Zustand (gameStore)                │    │
│  │                                                                  │    │
│  └──────────────┬──────────────────────────┬─────────────────────┘    │
│                 │                          │                            │
│                 │ SignalR WebSocket        │ HTTP REST                  │
│                 │ /gameHub                 │ /api/*                     │
└─────────────────┼──────────────────────────┼─────────────────────────┘
                  │                          │
┌─────────────────┼──────────────────────────┼─────────────────────────┐
│                 │                          │                            │
│  ┌──────────────▼──────────────────────────▼───────────────────────┐  │
│  │                    ASP.NET Core Web API                          │  │
│  │                    http://localhost:5000                         │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │                                                                   │  │
│  │  SignalR Hub:             Controllers:                           │  │
│  │  └─ GameHub               ├─ RoomController                      │  │
│  │     ├─ CreateRoom         └─ SpotifyController                   │  │
│  │     ├─ JoinRoom                                                  │  │
│  │     ├─ StartGame          Services:                              │  │
│  │     ├─ SubmitGuess        ├─ GameService (Singleton)             │  │
│  │     └─ EndRound           │   ├─ Room management                 │  │
│  │                           │   ├─ Guess validation                │  │
│  │  Models:                  │   └─ Score calculation               │  │
│  │  ├─ GameRoom              │                                       │  │
│  │  ├─ Player                └─ SpotifyService (Singleton)           │  │
│  │  ├─ Song                      ├─ Playlist fetching               │  │
│  │  └─ GuessResult               └─ Track details                   │  │
│  │                                                                   │  │
│  │  In-Memory Storage:                                              │  │
│  │  └─ Dictionary<RoomCode, GameRoom>                               │  │
│  │                                                                   │  │
│  └───────────────────────────────────┬───────────────────────────────┘  │
│                                      │                                   │
│                                      │ HTTPS API Calls                   │
│                          SERVER SIDE │                                   │
└──────────────────────────────────────┼───────────────────────────────────┘
                                       │
                                       │
                          ┌────────────▼──────────────┐
                          │    Spotify Web API        │
                          │  api.spotify.com          │
                          ├───────────────────────────┤
                          │                           │
                          │  ├─ Get Playlist          │
                          │  ├─ Get Tracks            │
                          │  └─ OAuth Token           │
                          │                           │
                          └───────────────────────────┘


DATA FLOW - Game Start to End
═══════════════════════════════

1. CREATE ROOM
   Client → SignalR → GameHub.CreateRoom()
                    → GameService.CreateRoom()
                    → Generate 6-char code
                    → Store in Dictionary
                    ← Return room code
          ← Broadcast "RoomUpdated"

2. JOIN ROOM
   Client → SignalR → GameHub.JoinRoom()
                    → GameService.JoinRoom()
                    → Add player to room.Players
                    ← Broadcast "PlayerJoined"
                    ← Broadcast "RoomUpdated"

3. SET PLAYLIST
   Client → SignalR → GameHub.SetPlaylist(url)
                    → Extract playlist ID
                    ← Send "PlaylistId" to client
   
   Client → HTTP → SpotifyController.GetPlaylist(id)
                 → SpotifyService.GetPlaylistTracks()
                 → Call Spotify API
                 ← Return Song[]
   
   Client → SignalR → GameHub.PlaylistLoaded(songs)
                    → GameService.SetPlaylist()
                    → Filter songs with preview URLs
                    ← Broadcast "PlaylistSet"
                    ← Broadcast "RoomUpdated"

4. START GAME
   Client → SignalR → GameHub.StartGame()
                    → GameService.StartGame()
                    → Shuffle playlist
                    → Set first song
                    ← Broadcast "GameStarted"
                    ← Broadcast "RoundStarted" + song preview URL

5. SUBMIT GUESS
   Client → SignalR → GameHub.SubmitGuess(guess)
                    → GameService.ProcessGuess()
                    → Normalize & compare strings
                    → Award points if correct
                    ← Send "CorrectGuess" or "IncorrectGuess"
                    ← Broadcast "RoomUpdated" (scores)

6. END ROUND
   Client → SignalR → GameHub.EndRound()
                    ← Broadcast "RoundEnded" + correct answer

7. NEXT ROUND
   Client → SignalR → GameHub.NextRound()
                    → GameService.StartNextRound()
                    → Increment song index
                    → Clear guesses
                    ← Broadcast "RoundStarted" + next song
   
   OR if no more songs:
                    ← Broadcast "GameOver" + final leaderboard


TECHNOLOGY STACK
═════════════════

Backend:
├─ .NET 10
├─ ASP.NET Core Web API
├─ SignalR (WebSocket)
├─ SpotifyAPI.Web 7.2.2
└─ Swagger/OpenAPI

Frontend:
├─ React 19
├─ TypeScript
├─ Vite 7
├─ @microsoft/signalr 8.0
├─ Axios 1.6
├─ Zustand 5.0
└─ React Router 7.1

External Services:
└─ Spotify Web API


DEPLOYMENT CONSIDERATIONS
══════════════════════════

Production Backend:
├─ Azure App Service / AWS Elastic Beanstalk
├─ Use HTTPS (Let's Encrypt)
├─ Environment variables for secrets
├─ Redis for distributed state (multiple instances)
├─ Application Insights / CloudWatch for logging
└─ CDN for static assets

Production Frontend:
├─ Vercel / Netlify / Azure Static Web Apps
├─ Environment variables for API URLs
├─ Minification & tree-shaking
├─ Lazy loading routes
└─ Service Worker for offline support (optional)

Database (Future):
├─ PostgreSQL / MongoDB for persistence
├─ Entity Framework Core (if SQL)
└─ Store: rooms, players, game history, stats
```
