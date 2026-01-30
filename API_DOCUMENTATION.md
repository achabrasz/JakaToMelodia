# API Documentation - Jaka To Melodia

## REST API Endpoints

### Room Management

#### Get Room Details
```
GET /api/room/{roomCode}
```

**Response:**
```json
{
  "roomId": "string",
  "roomCode": "ABC123",
  "players": [...],
  "playlist": [...],
  "state": 0,
  "currentSong": {...},
  "currentSongIndex": 0
}
```

#### Cleanup Inactive Rooms
```
POST /api/room/cleanup
```

### Spotify Integration

#### Get Playlist Tracks
```
GET /api/spotify/playlist/{playlistId}
```

**Response:**
```json
[
  {
    "id": "string",
    "title": "Song Title",
    "artist": "Artist Name",
    "previewUrl": "https://...",
    "albumImageUrl": "https://...",
    "durationMs": 30000
  }
]
```

## SignalR Hub Events

**Hub URL:** `/gameHub`

### Client → Server Methods

#### CreateRoom
```typescript
await connection.invoke('CreateRoom', playerName: string): Promise<string>
```
Creates a new game room and returns the room code.

#### JoinRoom
```typescript
await connection.invoke('JoinRoom', roomCode: string, playerName: string): Promise<boolean>
```
Joins an existing room. Returns true if successful.

#### LeaveRoom
```typescript
await connection.invoke('LeaveRoom', roomCode: string, playerId: string): Promise<void>
```
Removes player from the room.

#### SetPlaylist
```typescript
await connection.invoke('SetPlaylist', roomCode: string, playlistUrl: string): Promise<void>
```
Initiates playlist loading from Spotify URL.

#### PlaylistLoaded
```typescript
await connection.invoke('PlaylistLoaded', roomCode: string, songs: Song[]): Promise<void>
```
Called by client after successfully fetching playlist from Spotify API.

#### StartGame
```typescript
await connection.invoke('StartGame', roomCode: string): Promise<void>
```
Begins the game (host only).

#### SubmitGuess
```typescript
await connection.invoke('SubmitGuess', roomCode: string, playerId: string, guess: string): Promise<void>
```
Submits a player's guess for the current song.

#### EndRound
```typescript
await connection.invoke('EndRound', roomCode: string): Promise<void>
```
Ends the current round and reveals the answer (host only).

#### NextRound
```typescript
await connection.invoke('NextRound', roomCode: string): Promise<void>
```
Starts the next round (host only).

### Server → Client Events

#### RoomUpdated
```typescript
connection.on('RoomUpdated', (room: GameRoom) => void)
```
Sent whenever room state changes.

#### PlayerJoined
```typescript
connection.on('PlayerJoined', (player: Player) => void)
```
Sent when a new player joins the room.

#### PlayerLeft
```typescript
connection.on('PlayerLeft', (playerId: string) => void)
```
Sent when a player leaves the room.

#### PlaylistId
```typescript
connection.on('PlaylistId', (playlistId: string) => void)
```
Sent to client to trigger playlist fetching from Spotify.

#### PlaylistLoading
```typescript
connection.on('PlaylistLoading', (isLoading: boolean) => void)
```
Indicates playlist loading status.

#### PlaylistSet
```typescript
connection.on('PlaylistSet', (songCount: number) => void)
```
Sent when playlist has been successfully loaded.

#### GameStarted
```typescript
connection.on('GameStarted', () => void)
```
Sent when the game begins.

#### RoundStarted
```typescript
connection.on('RoundStarted', (data: RoundData) => void)
```
Sent at the start of each round.

**RoundData:**
```typescript
{
  song: {
    id: string,
    previewUrl: string,
    albumImageUrl: string,
    durationMs: number
  },
  roundNumber: number,
  totalRounds: number
}
```

#### CorrectGuess
```typescript
connection.on('CorrectGuess', (data: GuessResultData) => void)
```
Broadcast when a player guesses correctly.

**GuessResultData:**
```typescript
{
  playerId: string,
  playerName: string,
  type: 'Title' | 'Artist',
  points: number
}
```

#### IncorrectGuess
```typescript
connection.on('IncorrectGuess', () => void)
```
Sent to the guessing player when their guess is incorrect.

#### RoundEnded
```typescript
connection.on('RoundEnded', (data: RoundEndData) => void)
```
Sent when a round ends, revealing the answer.

**RoundEndData:**
```typescript
{
  title: string,
  artist: string,
  albumImageUrl: string
}
```

#### GameOver
```typescript
connection.on('GameOver', (data: GameOverData) => void)
```
Sent when all rounds are completed.

**GameOverData:**
```typescript
{
  players: Player[] // Sorted by score
}
```

#### Error
```typescript
connection.on('Error', (message: string) => void)
```
Sent when an error occurs.

## Data Models

### GameRoom
```typescript
{
  roomId: string,
  roomCode: string,
  players: Player[],
  playlist: Song[],
  state: GameState,
  currentSong: Song | null,
  currentSongIndex: number,
  roundStartTime: string | null,
  playersWhoGuessed: string[]
}
```

### Player
```typescript
{
  id: string,
  name: string,
  connectionId: string,
  score: number,
  isHost: boolean
}
```

### Song
```typescript
{
  id: string,
  title: string,
  artist: string,
  previewUrl: string,
  albumImageUrl: string,
  durationMs: number
}
```

### GameState Enum
```typescript
enum GameState {
  Lobby = 0,
  Playing = 1,
  RoundEnd = 2,
  GameOver = 3
}
```

### GuessType Enum
```typescript
enum GuessType {
  None = 0,
  Title = 1,    // 100 points
  Artist = 2    // 50 points
}
```

## Game Flow

1. **Create Room** → Host creates room, receives room code
2. **Players Join** → Players join using room code
3. **Set Playlist** → Host provides Spotify playlist URL
4. **Start Game** → Host starts the game
5. **Round Loop:**
   - Play song preview (30 seconds)
   - Players submit guesses
   - Host ends round
   - Reveal answer and update scores
   - Host starts next round
6. **Game Over** → Show final leaderboard

## Authentication

Currently uses Spotify's Client Credentials flow for public playlist access. No user authentication required for basic gameplay.

## Rate Limits

- SignalR: No explicit limits (managed by connection)
- Spotify API: Respects Spotify's rate limits (typically 180 requests/minute)

## Error Codes

SignalR errors are sent via the `Error` event with descriptive messages:
- "Room not found"
- "Cannot join room"
- "Failed to load playlist"
- "Cannot start game"
- Invalid playlist URL

## WebSocket Connection

SignalR automatically manages WebSocket connections with fallback to long polling if WebSocket is unavailable.
