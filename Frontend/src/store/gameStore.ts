import { create } from 'zustand';
import type { GameRoom, Player, MusicSource } from '../types';
import { MusicSourceValues } from '../types';

interface GameStore {
  room: GameRoom | null;
  currentPlayer: Player | null;
  isConnected: boolean;
  musicSource: MusicSource;
  
  setRoom: (room: GameRoom | null) => void;
  setCurrentPlayer: (player: Player | null) => void;
  setIsConnected: (connected: boolean) => void;
  setMusicSource: (source: MusicSource) => void;
  updatePlayerScore: (playerId: string, score: number) => void;
  reset: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  room: null,
  currentPlayer: null,
  isConnected: false,
  musicSource: MusicSourceValues.Spotify,

  setRoom: (room) => set({ room }),
  
  setCurrentPlayer: (player) => set({ currentPlayer: player }),
  
  setIsConnected: (connected) => set({ isConnected: connected }),
  
  setMusicSource: (source) => set({ musicSource: source }),
  
  updatePlayerScore: (playerId, score) => 
    set((state) => {
      if (!state.room) return state;
      
      const updatedPlayers = state.room.players.map(p => 
        p.id === playerId ? { ...p, score } : p
      );
      
      return {
        room: { ...state.room, players: updatedPlayers }
      };
    }),
  
  reset: () => set({ room: null, currentPlayer: null, isConnected: false }),
}));
