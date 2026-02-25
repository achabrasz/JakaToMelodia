import * as signalR from '@microsoft/signalr';
import type { Song, MusicSource } from '../types';
import { MusicSourceValues } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? '';

class SignalRService {
  private connection: signalR.HubConnection | null = null;
  private roomCode: string = '';

  async connect(): Promise<void> {
    if (this.connection?.state === signalR.HubConnectionState.Connected ||
        this.connection?.state === signalR.HubConnectionState.Connecting) {
      return;
    }

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_BASE_URL}/gameHub`)
      .withAutomaticReconnect()
      .build();

    await this.connection.start();
    console.log('SignalR Connected');
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.stop();
      this.connection = null;
    }
  }

  async createRoom(playerName: string, musicSource: MusicSource = MusicSourceValues.Spotify, maxRounds: number = 0): Promise<string> {
    if (!this.connection) throw new Error('Not connected');
    this.roomCode = await this.connection.invoke('CreateRoom', playerName, musicSource, maxRounds);
    return this.roomCode;
  }

  async getRoom(roomCode: string): Promise<any> {
    if (!this.connection) throw new Error('Not connected');
    return await this.connection.invoke('GetRoom', roomCode);
  }

  async joinRoom(roomCode: string, playerName: string): Promise<boolean> {
    if (!this.connection) throw new Error('Not connected');
    this.roomCode = roomCode;
    return await this.connection.invoke('JoinRoom', roomCode, playerName);
  }

  async leaveRoom(playerId: string): Promise<void> {
    if (!this.connection) return;
    await this.connection.invoke('LeaveRoom', this.roomCode, playerId);
  }

  async setPlaylist(playlistUrl: string): Promise<void> {
    if (!this.connection) throw new Error('Not connected');
    await this.connection.invoke('SetPlaylist', this.roomCode, playlistUrl);
  }

  async playlistLoaded(songs: Song[]): Promise<void> {
    if (!this.connection) throw new Error('Not connected');
    await this.connection.invoke('PlaylistLoaded', this.roomCode, songs);
  }

  async startGame(): Promise<void> {
    if (!this.connection) throw new Error('Not connected');
    await this.connection.invoke('StartGame', this.roomCode);
  }

  async submitGuess(playerId: string, guess: string): Promise<void> {
    if (!this.connection) throw new Error('Not connected');
    await this.connection.invoke('SubmitGuess', this.roomCode, playerId, guess);
  }

  async endRound(): Promise<void> {
    if (!this.connection) throw new Error('Not connected');
    await this.connection.invoke('EndRound', this.roomCode);
  }

  async nextRound(): Promise<void> {
    if (!this.connection) throw new Error('Not connected');
    await this.connection.invoke('NextRound', this.roomCode);
  }

  on(eventName: string, callback: (...args: any[]) => void): void {
    this.connection?.on(eventName, callback);
  }

  off(eventName: string, callback?: (...args: any[]) => void): void {
    if (callback) {
      this.connection?.off(eventName, callback);
    } else {
      this.connection?.off(eventName);
    }
  }

  isConnected(): boolean {
    return this.connection?.state === signalR.HubConnectionState.Connected;
  }

  getConnectionId(): string | null {
    return this.connection?.connectionId ?? null;
  }
}

export const signalRService = new SignalRService();
