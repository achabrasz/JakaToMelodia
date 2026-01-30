# Changelog - Jaka To Melodia

All notable changes to this project will be documented in this file.

## [1.0.0] - 2026-01-30

### Added - Initial Release

#### Backend (.NET 10)
- ✅ ASP.NET Core Web API setup
- ✅ SignalR hub for real-time communication
- ✅ Spotify API integration (SpotifyAPI.Web)
- ✅ Game room management system
- ✅ Player management with scoring
- ✅ Fuzzy string matching for guesses
- ✅ In-memory game state storage
- ✅ CORS configuration for frontend
- ✅ Swagger documentation
- ✅ Room cleanup for inactive sessions

#### Frontend (React + TypeScript)
- ✅ React 19 with TypeScript setup
- ✅ Vite build configuration
- ✅ SignalR client integration
- ✅ Home page (create/join room)
- ✅ Game room page with live updates
- ✅ Player list component with rankings
- ✅ Playlist input component
- ✅ Gameplay component with audio
- ✅ Leaderboard component
- ✅ Zustand state management
- ✅ React Router navigation
- ✅ Responsive CSS styling

#### Features
- ✅ Multi-room support with 6-character codes
- ✅ Host-controlled game flow
- ✅ Real-time score updates
- ✅ Title guessing (100 points)
- ✅ Artist guessing (50 points)
- ✅ 30-second song previews from Spotify
- ✅ Automatic playlist filtering (preview URLs only)
- ✅ Album artwork display
- ✅ Round-based gameplay
- ✅ Final leaderboard with winner announcement

#### Documentation
- ✅ README.md with setup instructions
- ✅ QUICKSTART.md for fast deployment
- ✅ INSTRUKCJA.md (Polish detailed guide)
- ✅ API_DOCUMENTATION.md
- ✅ ARCHITECTURE.md with diagrams
- ✅ Example configuration files

#### Configuration
- ✅ launchSettings.json for backend
- ✅ appsettings.json structure
- ✅ Environment variable examples
- ✅ .gitignore setup

### Technical Details

#### Backend Architecture
```
Controllers/
├─ RoomController      # Room management endpoints
└─ SpotifyController   # Spotify integration endpoints

Hubs/
└─ GameHub            # SignalR real-time hub

Services/
├─ GameService        # Game logic & state management
└─ SpotifyService     # Spotify API wrapper

Models/
├─ GameRoom           # Room state model
├─ Player             # Player data model
├─ Song               # Track information model
├─ GuessResult        # Guess validation result
└─ SpotifySettings    # Configuration model
```

#### Frontend Architecture
```
pages/
├─ HomePage           # Landing & room creation/join
└─ GameRoomPage       # Main game interface

components/
├─ PlayerList         # Live player rankings
├─ PlaylistInput      # Spotify URL input
├─ GamePlay          # Gameplay & guessing
└─ Leaderboard       # Final results

services/
├─ signalRService     # WebSocket communication
└─ spotifyService     # HTTP API calls

store/
└─ gameStore         # Zustand state management
```

### Dependencies

#### Backend
- Microsoft.AspNetCore.SignalR (1.1.0)
- SpotifyAPI.Web (7.2.2)
- Swashbuckle.AspNetCore (7.2.0)

#### Frontend
- react (19.2.0)
- react-dom (19.2.0)
- react-router-dom (7.1.3)
- @microsoft/signalr (8.0.0)
- axios (1.6.7)
- zustand (5.0.2)
- typescript (5.9.3)
- vite (7.2.4)

### Known Issues
- [ ] Songs without preview URLs are silently filtered
- [ ] No persistence - state lost on server restart
- [ ] No reconnection handling for disconnected players
- [ ] Limited error handling for Spotify API failures
- [ ] No rate limiting on API calls

### Notes
- Uses Spotify Client Credentials flow (no user login required)
- In-memory storage limits scalability
- CORS configured for localhost development only
- Rooms automatically expire after 2 hours

---

## Future Versions (Planned)

### [1.1.0] - Planned
- [ ] Database integration (PostgreSQL)
- [ ] Player reconnection handling
- [ ] Sound effects for correct/incorrect guesses
- [ ] Round timer display
- [ ] Host kick player functionality
- [ ] In-game chat

### [1.2.0] - Planned
- [ ] User accounts & authentication
- [ ] Game history storage
- [ ] Player statistics
- [ ] Global leaderboards
- [ ] Multiple game modes (fast/normal/hard)
- [ ] Custom round duration

### [2.0.0] - Planned
- [ ] Mobile app (React Native)
- [ ] Tournament system
- [ ] Achievement badges
- [ ] Power-ups & bonuses
- [ ] Custom playlist mixing
- [ ] Integration with other music services

---

## Version History

| Version | Date       | Description            |
|---------|------------|------------------------|
| 1.0.0   | 2026-01-30 | Initial release        |

---

Last updated: 2026-01-30
