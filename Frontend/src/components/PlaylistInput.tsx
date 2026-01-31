import { useState } from 'react';
import { signalRService } from '../services/signalRService';
import { MusicSource } from '../types';
import './PlaylistInput.css';

interface PlaylistInputProps {
  isLoading: boolean;
  musicSource: MusicSource;
}

export const PlaylistInput = ({ isLoading, musicSource }: PlaylistInputProps) => {
  const [playlistUrl, setPlaylistUrl] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playlistUrl.trim()) return;

    await signalRService.setPlaylist(playlistUrl);
    setPlaylistUrl('');
  };

  const getPlaceholder = () => {
    if (musicSource === MusicSource.Spotify) {
      return 'Wklej link do playlisty Spotify...';
    }
    return 'Wklej link do playlisty YouTube...';
  };

  const getTitle = () => {
    if (musicSource === MusicSource.Spotify) {
      return 'Dodaj playlistę Spotify';
    }
    return 'Dodaj playlistę YouTube';
  };

  const getHint = () => {
    if (musicSource === MusicSource.Spotify) {
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
        {getHint()}
      </p>
    </div>
  );
};
