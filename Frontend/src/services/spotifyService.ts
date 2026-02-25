import axios from 'axios';
import type { Song } from '../types';

const API_BASE_URL = (import.meta.env.VITE_API_URL ?? '') + '/api';

class SpotifyService {
  async getPlaylistTracks(playlistId: string): Promise<Song[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/spotify/playlist/${playlistId}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw error;
    }
  }

  extractPlaylistId(url: string): string | null {
    try {
      const match = url.match(/playlist\/([a-zA-Z0-9]+)/);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  }
}

export const spotifyService = new SpotifyService();
