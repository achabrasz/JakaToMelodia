import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signalRService } from '../services/signalRService';
import { useGameStore } from '../store/gameStore';
import './HomePage.css';

export const HomePage = () => {
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const setCurrentPlayer = useGameStore(state => state.setCurrentPlayer);

  const handleCreateRoom = async () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    setIsCreating(true);
    setError('');

    try {
      await signalRService.connect();
      const code = await signalRService.createRoom(playerName);
      
      setCurrentPlayer({
        id: crypto.randomUUID(),
        name: playerName,
        connectionId: '',
        score: 0,
        isHost: true
      });

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
          id: crypto.randomUUID(),
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
        <p className="subtitle">Gra muzyczna ze Spotify</p>

        <div className="input-section">
          <input
            type="text"
            placeholder="Wpisz swoje imię"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="input"
          />
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
      </div>
    </div>
  );
};
