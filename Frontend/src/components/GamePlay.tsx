import { useState, useEffect, useRef } from 'react';
import { signalRService } from '../services/signalRService';
import type {RoundData, RoundEndData} from '../types';
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
  const [autoplayUnlocked, setAutoplayUnlocked] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { id: trackId, previewUrl } = round.song;

  useEffect(() => {
    setGuess('');
    setHasGuessed(false);
    setIsPlaying(false);
    setAutoplayUnlocked(false);
    
    // Try to autoplay if previewUrl is available
    if (previewUrl && audioRef.current) {
        audioRef.current.volume = 0.5;
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                setIsPlaying(true);
            }).catch(error => {
                console.log("Autoplay prevented:", error);
                setIsPlaying(false);
            });
        }
    }
  }, [round.roundNumber, previewUrl]);

  // Handle clean up or round end
  useEffect(() => {
      if (roundEndData && audioRef.current) {
          audioRef.current.pause();
          setIsPlaying(false);
      }
  }, [roundEndData]);

  const handleSubmitGuess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guess.trim() || hasGuessed) return;
    await signalRService.submitGuess(currentPlayerId, guess);
    setHasGuessed(true);
  };

  const handleUnlockAutoplay = () => {
    if (previewUrl && audioRef.current) {
        audioRef.current.play().then(() => {
            setIsPlaying(true);
            setAutoplayUnlocked(true);
        }).catch(err => {
            console.error(err);
            // Even if it fails, maybe we show controls?
            setAutoplayUnlocked(true);
        });
    } else {
        console.log('🎵 Unlocking autoplay for track:', trackId);
        setAutoplayUnlocked(true);
    }
  };

  const handleIframeLoad = () => {
    console.log('✅ Spotify iframe loaded for track:', trackId);
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
        {previewUrl ? (
          <>
            <div className="custom-player">
              {!autoplayUnlocked ? (
                <button
                  className="unlock-autoplay-button"
                  onClick={handleUnlockAutoplay}
                >
                  ▶ Kliknij żeby odtworzyć
                </button>
              ) : (
                <div className="audio-player-container">
                  <audio
                    ref={audioRef}
                    src={previewUrl}
                    onEnded={() => setIsPlaying(false)}
                    preload="auto"
                  />
                  <div className="player-controls">
                    <button
                      onClick={() => {
                        if (isPlaying) {
                          audioRef.current?.pause();
                          setIsPlaying(false);
                        } else {
                          audioRef.current?.play();
                          setIsPlaying(true);
                        }
                      }}
                      className="play-pause-button"
                    >
                      {isPlaying ? '⏸️' : '▶️'}
                    </button>
                    <div className="player-info-text">
                      🎵 Odtwarzanie pliku audio...
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : trackId ? (
          <>
            <div className="custom-player">
              {!autoplayUnlocked ? (
                <button
                  className="unlock-autoplay-button"
                  onClick={handleUnlockAutoplay}
                >
                  ▶ Kliknij żeby odtworzyć
                </button>
              ) : (
                <div className="spotify-player-container">
                  <iframe
                    ref={iframeRef}
                    key={trackId}
                    src={`https://open.spotify.com/embed/track/${trackId}?utm_source=generator&theme=0`}
                    width="100%"
                    height="152"
                    frameBorder="0"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                    title="Spotify player"
                    onLoad={handleIframeLoad}
                  />
                  <div className="player-info-text">
                    🎵 Odtwarzaj w Spotify playerze powyżej (uwaga: widoczny tytuł!)
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="now-playing">🎵 Odtwarzanie...</div>
        )}
      </div>

      <form onSubmit={handleSubmitGuess} className="guess-form">
        <input
          type="text"
          placeholder="Wpisz tytuł lub wykonawcę..."
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
        <p>✓ Tytuł utworu: 100 pkt &nbsp;|&nbsp; ✓ Wykonawca: 50 pkt</p>
      </div>
    </div>
  );
};
