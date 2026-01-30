import axios from 'axios';
import { Song } from '../types';

const API_BASE_URL = 'http://localhost:5000/api';

class SpotifyService {
  async getPlaylistTracks(playlistId: string): Promise<Song[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/spotify/playlist/${playlistId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching playlist:', error);
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
