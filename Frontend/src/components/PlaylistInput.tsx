import { useState } from 'react';
import { signalRService } from '../services/signalRService';
import type { MusicSource } from '../types';
import { MusicSourceValues } from '../types';
import './PlaylistInput.css';

interface PlaylistInputProps {
  isLoading: boolean;
  musicSource: MusicSource;
  error?: string;
}

export const PlaylistInput = ({ isLoading, musicSource, error }: PlaylistInputProps) => {
  const [playlistUrl, setPlaylistUrl] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playlistUrl.trim()) return;

    await signalRService.setPlaylist(playlistUrl);
    setPlaylistUrl('');
  };

  const getPlaceholder = () => {
    if (musicSource === MusicSourceValues.Spotify) {
      return 'Wklej link do playlisty Spotify...';
    }
    return 'Wklej link do playlisty YouTube...';
  };

  const getTitle = () => {
    if (musicSource === MusicSourceValues.Spotify) {
      return 'Dodaj playlistę Spotify';
    }
    return 'Dodaj playlistę YouTube';
  };

  const getHint = () => {
    if (musicSource === MusicSourceValues.Spotify) {
      return 'Skopiuj link do playlisty Spotify (np. https://open.spotify.com/playlist/...)';
    }
    return 'Skopiuj link do playlisty YouTube (np. https://www.youtube.com/playlist?list=...)';
  };

  return (
    <div className="playlist-input">
      <h3>{getTitle()}</h3>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder={getPlaceholder()}
          value={playlistUrl}
          onChange={(e) => setPlaylistUrl(e.target.value)}
          disabled={isLoading}
          className={`playlist-url-input${error ? ' playlist-url-input--error' : ''}`}
        />
        <button
          type="submit"
          disabled={isLoading || !playlistUrl.trim()}
          className="load-playlist-button"
        >
          {isLoading ? 'Ładowanie...' : 'Załaduj playlistę'}
        </button>
      </form>
      {error && <p className="playlist-error">⚠️ {error}</p>}
      <p className="hint">{getHint()}</p>
    </div>
  );
};
