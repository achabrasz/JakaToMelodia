import type {Player} from '../types';
import './PlayerList.css';

interface PlayerListProps {
  players: Player[];
  currentPlayerId: string;
}

export const PlayerList = ({ players, currentPlayerId }: PlayerListProps) => {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="player-list">
      <h3>Gracze ({players.length})</h3>
      <div className="players">
        {sortedPlayers.map((player, index) => (
          <div 
            key={player.id} 
            className={`player-card ${player.id === currentPlayerId ? 'current' : ''}`}
          >
            <div className="player-info">
              <span className="rank">#{index + 1}</span>
              <span className="player-name">
                {player.name} 
                {player.isHost && ' 👑'}
                {player.id === currentPlayerId && ' (Ty)'}
              </span>
            </div>
            <span className="player-score">{player.score} pkt</span>
          </div>
        ))}
      </div>
    </div>
  );
};
