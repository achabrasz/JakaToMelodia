import { useState } from 'react';
import { signalRService } from '../services/signalRService';
import type { MusicSource } from '../types';
import { MusicSourceValues } from '../types';
import './PlaylistInput.css';

interface PlaylistInputProps {
  isLoading: boolean;
  musicSource: MusicSource;
  error?: string;
  totalSongs?: number;
}

export const PlaylistInput = ({ isLoading, musicSource, error, totalSongs = 0 }: PlaylistInputProps) => {
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [loadedPlaylists, setLoadedPlaylists] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playlistUrl.trim()) return;

    const url = playlistUrl.trim();
    await signalRService.setPlaylist(url);
    setLoadedPlaylists(prev => [...prev, url]);
    setPlaylistUrl('');
  };

  const getPlaceholder = () =>
    musicSource === MusicSourceValues.Spotify
      ? 'Wklej link do playlisty Spotify...'
      : 'Wklej link do playlisty YouTube...';

  const getTitle = () =>
    musicSource === MusicSourceValues.Spotify
      ? 'Dodaj playlisty Spotify'
      : 'Dodaj playlisty YouTube';

  const getHint = () =>
    musicSource === MusicSourceValues.Spotify
      ? 'Możesz dodać wiele playlist — ich piosenki zostaną połączone'
      : 'Możesz dodać wiele playlist — ich piosenki zostaną połączone';

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
          {isLoading ? 'Ładowanie...' : 'Dodaj playlistę'}
        </button>
      </form>

      {error && <p className="playlist-error">⚠️ {error}</p>}

      {loadedPlaylists.length > 0 && (
        <div className="loaded-playlists">
          <p className="loaded-playlists-header">
            ✅ Załadowane playlisty ({loadedPlaylists.length}) — łącznie <strong>{totalSongs}</strong> utworów:
          </p>
          <ul className="loaded-playlists-list">
            {loadedPlaylists.map((url, i) => (
              <li key={i} className="loaded-playlist-item" title={url}>
                🎵 {url.length > 50 ? url.slice(0, 50) + '…' : url}
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="hint">{getHint()}</p>
    </div>
  );
};
