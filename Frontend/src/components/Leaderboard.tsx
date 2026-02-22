import type {Player} from '../types';
import './Leaderboard.css';

interface LeaderboardProps {
  players: Player[];
  onPlayAgain: () => void;
}

export const Leaderboard = ({ players, onPlayAgain }: LeaderboardProps) => {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const winner = sortedPlayers[0];

  return (
    <div className="leaderboard">
      <h1>🏆 Koniec gry!</h1>
      
      {winner && (
        <div className="winner-section">
          <h2>Zwycięzca</h2>
          <div className="winner-card">
            <div className="trophy">👑</div>
            <h3>{winner.name}</h3>
            <p className="winner-score">{winner.score} punktów</p>
          </div>
        </div>
      )}

      <div className="final-rankings">
        <h3>Końcowa tabela</h3>
        {sortedPlayers.map((player, index) => (
          <div key={player.id} className={`ranking-row ${index === 0 ? 'first' : ''}`}>
            <span className="position">
              {index === 0 && '🥇'}
              {index === 1 && '🥈'}
              {index === 2 && '🥉'}
              {index > 2 && `#${index + 1}`}
            </span>
            <span className="player-name">{player.name}</span>
            <span className="score">{player.score} pkt</span>
          </div>
        ))}
      </div>

      <button onClick={onPlayAgain} className="play-again-button">
        Zagraj ponownie
      </button>
    </div>
  );
};
