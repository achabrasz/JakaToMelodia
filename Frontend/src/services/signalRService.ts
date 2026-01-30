import * as signalR from '@microsoft/signalr';
import { Song, Player, GameRoom, GuessResult } from '../types';

class SignalRService {
  private connection: signalR.HubConnection | null = null;
  private roomCode: string = '';

  async connect(): Promise<void> {
    this.connection = new signalR.HubConnectionBuilder()
      .withUrl('http://localhost:5000/gameHub')
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

  async createRoom(playerName: string): Promise<string> {
    if (!this.connection) throw new Error('Not connected');
    this.roomCode = await this.connection.invoke('CreateRoom', playerName);
    return this.roomCode;
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
    this.connection?.off(eventName, callback);
  }

  isConnected(): boolean {
    return this.connection?.state === signalR.HubConnectionState.Connected;
  }
}

export const signalRService = new SignalRService();
