import { useState, useEffect } from 'react';
import { signalRService } from '../services/signalRService';
import { RoundData, RoundEndData } from '../types';
import './GamePlay.css';

interface GamePlayProps {
  round: RoundData;
  roundEndData: RoundEndData | null;
  isHost: boolean;
  currentPlayerId: string;
  onEndRound: () => void;
  onNextRound: () => void;
}

export const GamePlay = ({ 
  round, 
  roundEndData, 
  isHost, 
  currentPlayerId,
  onEndRound,
  onNextRound 
}: GamePlayProps) => {
  const [guess, setGuess] = useState('');
  const [hasGuessed, setHasGuessed] = useState(false);

  useEffect(() => {
    // Reset guess state when new round starts
    setGuess('');
    setHasGuessed(false);
  }, [round.roundNumber]);

  const handleSubmitGuess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guess.trim() || hasGuessed) return;

    await signalRService.submitGuess(currentPlayerId, guess);
    setHasGuessed(true);
  };

  if (roundEndData) {
    return (
      <div className="round-end">
        <h2>Koniec rundy!</h2>
        <div className="song-reveal">
          {roundEndData.albumImageUrl && (
            <img src={roundEndData.albumImageUrl} alt="Album cover" className="album-cover" />
          )}
          <h3>{roundEndData.title}</h3>
          <p className="artist">{roundEndData.artist}</p>
        </div>
        
        {isHost && (
          <button onClick={onNextRound} className="next-round-button">
            Następna runda
          </button>
        )}
        {!isHost && <p>Oczekiwanie na gospodarza...</p>}
      </div>
    );
  }

  return (
    <div className="game-play">
      <div className="round-info">
        <h2>Runda {round.roundNumber} / {round.totalRounds}</h2>
      </div>

      <div className="song-player">
        {round.song.albumImageUrl && (
          <div className="album-art">
            <img src={round.song.albumImageUrl} alt="Album" className="album-image pulsing" />
          </div>
        )}
        <div className="now-playing">
          🎵 Odtwarzanie...
        </div>
      </div>

      <form onSubmit={handleSubmitGuess} className="guess-form">
        <input
          type="text"
          placeholder="Wpisz tytuł utworu lub wykonawcę..."
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          disabled={hasGuessed}
          className="guess-input"
          autoFocus
        />
        <button 
          type="submit" 
          disabled={!guess.trim() || hasGuessed}
          className="submit-guess-button"
        >
          {hasGuessed ? '✓ Wysłano' : 'Zgadnij'}
        </button>
      </form>

      {hasGuessed && (
        <div className="guess-status">
          Wysłałeś swoją odpowiedź! Czekaj na koniec rundy...
        </div>
      )}

      {isHost && (
        <button onClick={onEndRound} className="end-round-button">
          Zakończ rundę
        </button>
      )}

      <div className="scoring-info">
        <p><strong>Punktacja:</strong></p>
        <p>✓ Tytuł utworu: 100 punktów</p>
        <p>✓ Wykonawca: 50 punktów</p>
      </div>
    </div>
  );
};
