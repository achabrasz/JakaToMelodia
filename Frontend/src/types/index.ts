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

export const MusicSource = {
  Spotify: 0,
  YouTube: 1,
} as const;

export type MusicSource = typeof MusicSource[keyof typeof MusicSource];

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
}

export const GameState = {
  Lobby: 0,
  Playing: 1,
  RoundEnd: 2,
  GameOver: 3,
} as const;

export type GameState = typeof GameState[keyof typeof GameState];

export interface GuessResult {
  isCorrect: boolean;
  type: GuessType;
  pointsAwarded: number;
  playerName: string;
}

export const GuessType = {
  None: 0,
  Title: 1,
  Artist: 2,
} as const;

export type GuessType = typeof GuessType[keyof typeof GuessType];

export interface RoundData {
  song: {
    id: string;
    previewUrl: string;
    albumImageUrl: string;
    durationMs: number;
  };
  roundNumber: number;
  totalRounds: number;
}

export interface RoundEndData {
  title: string;
  artist: string;
  albumImageUrl: string;
}
