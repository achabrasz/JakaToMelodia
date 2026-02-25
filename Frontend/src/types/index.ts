export interface Player {
  id: string;
  name: string;
  connectionId: string;
  score: number;
  isHost: boolean;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  previewUrl: string;
  albumImageUrl: string;
  durationMs: number;
}

export type MusicSource = 0 | 1;
export type GameState = 0 | 1 | 2 | 3;
export type GuessType = 0 | 1 | 2 | 3;

export interface GameRoom {
  roomId: string;
  roomCode: string;
  players: Player[];
  playlist: Song[];
  state: GameState;
  currentSong: Song | null;
  currentSongIndex: number;
  roundStartTime: string | null;
  playersWhoGuessed: string[];
  musicSource: MusicSource;
  maxRounds: number;
}

export interface GuessResult {
  isCorrect: boolean;
  type: GuessType;
  pointsAwarded: number;
  playerName: string;
}

export interface RoundData {
  song: {
    id: string;
    previewUrl: string;
    albumImageUrl: string;
    durationMs: number;
  };
  maskedTitle: string;
  maskedArtist: string;
  roundNumber: number;
  totalRounds: number;
}

export interface RoundEndData {
  title: string;
  artist: string;
  albumImageUrl: string;
}

// Const values - use different names to avoid conflicts
export const MusicSourceValues = {
  Spotify: 0 as MusicSource,
  YouTube: 1 as MusicSource,
} as const;

export const GameStateValues = {
  Lobby: 0 as GameState,
  Playing: 1 as GameState,
  RoundEnd: 2 as GameState,
  GameOver: 3 as GameState,
} as const;

export const GuessTypeValues = {
  None: 0 as GuessType,
  Title: 1 as GuessType,
  Artist: 2 as GuessType,
  Both: 3 as GuessType,
} as const;
