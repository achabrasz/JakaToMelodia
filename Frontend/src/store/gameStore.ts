import { create } from 'zustand';
import { GameRoom, Player } from '../types';

interface GameStore {
  room: GameRoom | null;
  currentPlayer: Player | null;
  isConnected: boolean;
  
  setRoom: (room: GameRoom | null) => void;
  setCurrentPlayer: (player: Player | null) => void;
  setIsConnected: (connected: boolean) => void;
  updatePlayerScore: (playerId: string, score: number) => void;
  reset: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  room: null,
  currentPlayer: null,
  isConnected: false,

  setRoom: (room) => set({ room }),
  
  setCurrentPlayer: (player) => set({ currentPlayer: player }),
  
  setIsConnected: (connected) => set({ isConnected: connected }),
  
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
