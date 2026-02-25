import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { signalRService } from '../services/signalRService';
import { useGameStore } from '../store/gameStore';
import { generateId } from '../utils/helpers';
import type { MusicSource } from '../types';
import { MusicSourceValues } from '../types';
import './HomePage.css';

const API_BASE_URL = (import.meta.env.VITE_API_URL ?? '') + '/api';

export const HomePage = () => {
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');
  const [selectedMusicSource, setSelectedMusicSource] = useState<MusicSource>(MusicSourceValues.Spotify);
  const [maxRounds, setMaxRounds] = useState<number>(10);
  const [spotifyAuthed, setSpotifyAuthed] = useState<boolean | null>(null);
  const [spotifyRedirectUri, setSpotifyRedirectUri] = useState<string>('');

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setCurrentPlayer = useGameStore((s) => s.setCurrentPlayer);
  const setMusicSource = useGameStore((s) => s.setMusicSource);

  // Check Spotify auth status on mount, poll until authenticated
  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    const checkAuth = async () => {
      try {
        const resp = await fetch(`${API_BASE_URL}/spotify/status`);
        const data = await resp.json();
        if (!cancelled) {
          setSpotifyAuthed(data.authenticated);
          if (data.redirectUri) setSpotifyRedirectUri(data.redirectUri);
          // Keep polling until authenticated (backend may still be initializing)
          if (!data.authenticated) {
            timeoutId = setTimeout(checkAuth, 2000);
          }
        }
      } catch {
        if (!cancelled) {
          setSpotifyAuthed(false);
          timeoutId = setTimeout(checkAuth, 3000);
        }
      }
    };

    checkAuth();

    if (searchParams.get('spotify') === 'authenticated') {
      window.history.replaceState({}, '', '/');
    }

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [searchParams]);

  const handleSpotifyLogin = async () => {
    const resp = await fetch(`${API_BASE_URL}/spotify/auth`);
    const data = await resp.json();
    window.location.href = data.url;
  };

  const handleCreateRoom = async () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    setIsCreating(true);
    setError('');

    try {
      await signalRService.connect();
      const code = await signalRService.createRoom(playerName, selectedMusicSource, maxRounds);
      
      setCurrentPlayer({
        id: generateId(),
        name: playerName,
        connectionId: '',
        score: 0,
        isHost: true
      });
      
      setMusicSource(selectedMusicSource);

      navigate(`/room/${code}`);
    } catch (err) {
      setError('Failed to create room');
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!roomCode.trim()) {
      setError('Please enter room code');
      return;
    }

    setIsJoining(true);
    setError('');

    try {
      await signalRService.connect();
      const success = await signalRService.joinRoom(roomCode.toUpperCase(), playerName);
      
      if (success) {
        setCurrentPlayer({
          id: generateId(),
          name: playerName,
          connectionId: '',
          score: 0,
          isHost: false
        });

        navigate(`/room/${roomCode.toUpperCase()}`);
      } else {
        setError('Failed to join room');
      }
    } catch (err) {
      setError('Failed to join room');
      console.error(err);
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="home-page">
      <div className="home-container">
        <h1 className="title">🎵 Jaka To Melodia</h1>
        <p className="subtitle">Gra muzyczna ze Spotify lub YouTube</p>

        <div className="music-source-selector">
          <label>Wybierz źródło muzyki:</label>
          <div className="source-buttons">
            <button
              className={`source-button ${selectedMusicSource === MusicSourceValues.Spotify ? 'active' : ''}`}
              onClick={() => setSelectedMusicSource(MusicSourceValues.Spotify)}
            >
              🎵 Spotify
            </button>
            <button
              className={`source-button ${selectedMusicSource === MusicSourceValues.YouTube ? 'active' : ''}`}
              onClick={() => setSelectedMusicSource(MusicSourceValues.YouTube)}
            >
              📺 YouTube
            </button>
          </div>
        </div>

        <div className="input-section">
          <input
            type="text"
            placeholder="Wpisz swoje imię"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="input"
          />
        </div>

        <div className="max-rounds-section">
          <label className="max-rounds-label" htmlFor="maxRounds">
            Liczba rund:
          </label>
          <div className="max-rounds-controls">
            <button
              className="rounds-btn"
              onClick={() => setMaxRounds(r => Math.max(1, r - 1))}
              type="button"
            >−</button>
            <input
              id="maxRounds"
              type="number"
              min={1}
              max={50}
              value={maxRounds}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                if (!isNaN(v) && v >= 1 && v <= 50) setMaxRounds(v);
              }}
              className="rounds-input"
            />
            <button
              className="rounds-btn"
              onClick={() => setMaxRounds(r => Math.min(50, r + 1))}
              type="button"
            >+</button>
          </div>
        </div>
        {error && <div className="error">{error}</div>}

        <div className="actions">
          <button 
            onClick={handleCreateRoom}
            disabled={isCreating}
            className="button button-primary"
          >
            {isCreating ? 'Tworzenie...' : 'Utwórz pokój'}
          </button>

          <div className="divider">lub</div>

          <div className="join-section">
            <input
              type="text"
              placeholder="Kod pokoju"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              className="input"
              maxLength={6}
            />
            <button 
              onClick={handleJoinRoom}
              disabled={isJoining}
              className="button button-secondary"
            >
              {isJoining ? 'Dołączanie...' : 'Dołącz do pokoju'}
            </button>
          </div>
        </div>

        <div className="spotify-auth">
          {selectedMusicSource === MusicSourceValues.Spotify && spotifyAuthed === false && (
            <div className="spotify-auth-container">
              <span className="spotify-auth-text">⚠️ Backend Spotify nie jest autoryzowany:</span>
              <button
                onClick={handleSpotifyLogin}
                className="button button-spotify"
              >
                Zaloguj się przez Spotify
              </button>
              {spotifyRedirectUri && (
                <span className="spotify-auth-uri">
                  Redirect URI: <code>{spotifyRedirectUri}</code><br/>
                  ⚠️ Musi być dodany w <a href="https://developer.spotify.com/dashboard" target="_blank" rel="noreferrer">Spotify Dashboard</a>
                </span>
              )}
            </div>
          )}
          {selectedMusicSource === MusicSourceValues.Spotify && spotifyAuthed === true && (
            <div className="spotify-auth-ok">✅ Spotify połączony</div>
          )}
        </div>
      </div>
    </div>
  );
};
