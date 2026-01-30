import { useState } from 'react';
import { signalRService } from '../services/signalRService';
import './PlaylistInput.css';

interface PlaylistInputProps {
  isLoading: boolean;
}

export const PlaylistInput = ({ isLoading }: PlaylistInputProps) => {
  const [playlistUrl, setPlaylistUrl] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playlistUrl.trim()) return;

    await signalRService.setPlaylist(playlistUrl);
    setPlaylistUrl('');
  };

  return (
    <div className="playlist-input">
      <h3>Dodaj playlistę Spotify</h3>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Wklej link do playlisty Spotify..."
          value={playlistUrl}
          onChange={(e) => setPlaylistUrl(e.target.value)}
          disabled={isLoading}
          className="playlist-url-input"
        />
        <button 
          type="submit" 
          disabled={isLoading || !playlistUrl.trim()}
          className="load-playlist-button"
        >
          {isLoading ? 'Ładowanie...' : 'Załaduj playlistę'}
        </button>
      </form>
      <p className="hint">
        Skopiuj link do playlisty Spotify (np. https://open.spotify.com/playlist/...)
      </p>
    </div>
  );
};
