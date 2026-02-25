import { useState, useEffect, useRef } from 'react';
import { signalRService } from '../services/signalRService';
import type {RoundData, RoundEndData} from '../types';
import './GamePlay.css';

type GuessStatus = 'idle' | 'incorrect' | 'guessedTitle' | 'guessedArtist' | 'guessedBoth';

interface GamePlayProps {
  round: RoundData;
  roundEndData: RoundEndData | null;
  isHost: boolean;
  currentPlayerId: string;
  onEndRound: () => void;
  onNextRound: () => void;
}

// Add proper types for the Spotify IFrame API to avoid TS errors
declare global {
  interface Window {
    onSpotifyIframeApiReady: (IFrameAPI: SpotifyIframeApi) => void;
  }
}

interface SpotifyIframeApi {
  createController: (
    element: HTMLElement,
    options: { uri: string; width?: string; height?: string },
    callback: (EmbedController: SpotifyEmbedController) => void
  ) => void;
}

interface SpotifyEmbedController {
  loadUri: (uri: string) => void;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  seek: (seconds: number) => void;
  destroy: () => void;
  addListener: (event: string, callback: (data: any) => void) => void;
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
  const [guessStatus, setGuessStatus] = useState<GuessStatus>('idle');
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(20);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerFiredRef = useRef(false);
  // Keep a ref to the latest onEndRound/isHost so the interval can call it without stale closures
  const onEndRoundRef = useRef(onEndRound);
  const isHostRef = useRef(isHost);
  useEffect(() => { onEndRoundRef.current = onEndRound; }, [onEndRound]);
  useEffect(() => { isHostRef.current = isHost; }, [isHost]);
  
  // Refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const embedContainerRef = useRef<HTMLDivElement>(null);
  const embedControllerRef = useRef<SpotifyEmbedController | null>(null);

  const { id: trackId, previewUrl } = round.song;

  // Initialize Spotify IFrame API
  useEffect(() => {
    if (!trackId || previewUrl) return;

    const scriptId = 'spotify-iframe-api';
    if (!document.getElementById(scriptId)) {
        const script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://open.spotify.com/embed-podcast/iframe-api/v1';
        script.async = true;
        document.body.appendChild(script);
    }

    window.onSpotifyIframeApiReady = (IFrameAPI: SpotifyIframeApi) => {
        if (!embedContainerRef.current) return;
        
        const element = embedContainerRef.current;
        const options = {
            uri: `spotify:track:${trackId}`,
            width: '100%',
            height: '152',
        };
        
        IFrameAPI.createController(element, options, (EmbedController) => {
            embedControllerRef.current = EmbedController;
            
            EmbedController.addListener('playback_update', (e) => {
                if (e.data && e.data.isPaused === false) {
                     setIsPlaying(true);
                } else {
                     setIsPlaying(false);
                }
            });

            // Attempt auto-play once controller is ready
            console.log("🎮 Spotify Embed Controller Ready. Attempting Play...");
            setTimeout(() => {
                EmbedController.play();
            }, 500); 
        });
    };
    
    // If API is already loaded but component re-mounted
    // (This part is tricky because onSpotifyIframeApiReady might have fired already.
    // Ideally we'd need a more robust loader, but let's stick to simple implementation first.)

    return () => {
        // Cleanup if needed
    }
  }, []); // Run once on mount to set up the global callback

  // Effect to load new track when trackId changes
  useEffect(() => {
      if (!trackId || previewUrl) return;

      if (embedControllerRef.current) {
          console.log(`🎵 Loading new track: ${trackId}`);
          embedControllerRef.current.loadUri(`spotify:track:${trackId}`);
          
          // Try to auto-play after a short delay to allow loading
          setTimeout(() => {
              embedControllerRef.current?.play();
          }, 800);
      }
  }, [trackId, previewUrl]);


  // Auto-play effect for Audio Preview (unchanged)
  useEffect(() => {
    setGuess('');
    setGuessStatus('idle');
    setIsPlaying(false);
    setTimeLeft(20);
    timerFiredRef.current = false;

    // Start countdown timer — fires onEndRound directly when it hits 0 (host only)
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          if (isHostRef.current && !timerFiredRef.current) {
            timerFiredRef.current = true;
            onEndRoundRef.current();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    // Try to autoplay if previewUrl is available
    if (previewUrl && audioRef.current) {
        audioRef.current.volume = 0.5;
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                setIsPlaying(true);
            }).catch(error => {
                console.log("Autoplay prevented (browser policy):", error);
                setIsPlaying(false);
            });
        }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [round.roundNumber, previewUrl]);

  // Handle clean up or round end
  useEffect(() => {
      if (roundEndData) {
          if (audioRef.current) {
              audioRef.current.pause();
          }
          if (embedControllerRef.current) {
              embedControllerRef.current.pause();
          }
          setIsPlaying(false);
          if (timerRef.current) clearInterval(timerRef.current);
      }
  }, [roundEndData]);


  // Listen to CorrectGuess and IncorrectGuess to manage guess state
  useEffect(() => {
    const handleCorrectGuess = (data: { playerId: string; type: string; points: number; playerName: string }) => {
      // Only update state for the current player's own guesses
      if (data.playerId !== currentPlayerId) return;
      setGuess('');
      setGuessStatus(prev => {
        const type = data.type?.toLowerCase();
        if (type === 'both') return 'guessedBoth';
        if (type === 'title') return prev === 'guessedArtist' ? 'guessedBoth' : 'guessedTitle';
        if (type === 'artist') return prev === 'guessedTitle' ? 'guessedBoth' : 'guessedArtist';
        return prev;
      });
    };

    const handleIncorrectGuess = () => {
      setGuess('');
      setGuessStatus(prev => (prev === 'idle' ? 'incorrect' : prev));
    };

    signalRService.on('CorrectGuess', handleCorrectGuess);
    signalRService.on('IncorrectGuess', handleIncorrectGuess);

    return () => {
      signalRService.off('CorrectGuess', handleCorrectGuess);
      signalRService.off('IncorrectGuess', handleIncorrectGuess);
    };
  }, [currentPlayerId]);

  const handleSubmitGuess = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!guess.trim() || guessStatus === 'guessedBoth') return;
    await signalRService.submitGuess(currentPlayerId, guess);
  };

  const handleManualPlay = () => {
     if (previewUrl && audioRef.current) {
        audioRef.current.play().then(() => {
            setIsPlaying(true);
        }).catch(console.error);
     } else if (embedControllerRef.current) {
         embedControllerRef.current.togglePlay();
     }
  };

  /** Render masked string: each letter→'*', space stays space */
  const renderMasked = (masked: string) =>
    masked.split('').map((ch, i) =>
      ch === ' ' ? (
        <span key={i} className="mask-space"> </span>
      ) : (
        <span key={i} className="mask-char">{ch === '*' ? '*' : ch}</span>
      )
    );



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
        <div className={`round-timer ${timeLeft <= 5 ? 'timer-danger' : timeLeft <= 10 ? 'timer-warning' : ''}`}>
          <svg className="timer-ring" viewBox="0 0 44 44">
            <circle cx="22" cy="22" r="18" className="timer-ring-bg" />
            <circle
              cx="22" cy="22" r="18"
              className="timer-ring-fill"
              strokeDasharray={`${(timeLeft / 20) * 113.1} 113.1`}
            />
          </svg>
          <span className="timer-text">{timeLeft}</span>
        </div>
      </div>

      <div className="song-player">
        {previewUrl ? (
            <div className="custom-player">
              <div className="audio-player-container">
                  <audio
                    ref={audioRef}
                    src={previewUrl}
                    onEnded={() => setIsPlaying(false)}
                    preload="auto"
                  >
                    <track kind="captions" />
                  </audio>
                  
                  <button 
                    className={`giant-play-button ${isPlaying ? 'playing' : ''}`}
                    onClick={handleManualPlay}
                  >
                    {isPlaying ? '⏸️ Zatrzymaj' : '▶️ Odtwórz Utwór'}
                  </button>
              </div>
            </div>
        ) : trackId ? (
            <div className="custom-player">
               {/* Spotify Embed IFrame API Container */}
                <div className="spotify-player-container">
                  
                  <button 
                    className={`giant-play-button ${isPlaying ? 'playing' : ''}`}
                    onClick={handleManualPlay}
                  >
                     {isPlaying ? '⏸️ Pauza' : '▶️ Odtwórz w Spotify'}
                  </button>

                  <div ref={embedContainerRef} style={{ marginTop: '20px', width: '100%' }} />
                  
                  <div className="player-info-text" style={{ marginTop: '10px', fontSize: '0.8em', opacity: 0.7 }}>
                    Jeśli autoodtwarzanie nie działa, użyj przycisku powyżej.
                  </div>
                </div>
            </div>
        ) : (
          <div className="now-playing">🎵 Odtwarzanie...</div>
        )}
      </div>

      <div className="song-hints">
        <div className="hint-row">
          <span className="hint-label">Tytuł:</span>
          <span className="hint-mask">
            {guessStatus === 'guessedTitle' || guessStatus === 'guessedBoth'
              ? <span className="hint-revealed">✓ Odgadnięty!</span>
              : renderMasked(round.maskedTitle)}
          </span>
        </div>
        <div className="hint-row">
          <span className="hint-label">Wykonawca:</span>
          <span className="hint-mask">
            {guessStatus === 'guessedArtist' || guessStatus === 'guessedBoth'
              ? <span className="hint-revealed">✓ Odgadnięty!</span>
              : renderMasked(round.maskedArtist)}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmitGuess} className="guess-form">
        <input
          type="text"
          placeholder="Wpisz tytuł lub wykonawcę..."
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          disabled={guessStatus === 'guessedBoth'}
          className="guess-input"
          autoFocus
        />
        <button
          type="submit"
          disabled={!guess.trim() || guessStatus === 'guessedBoth'}
          className="submit-guess-button"
        >
          {guessStatus === 'guessedBoth' ? '✓ Odgadnięto' : 'Zgadnij'}
        </button>
      </form>

      {guessStatus === 'guessedBoth' && (
        <div className="guess-status">
          Odgadłeś tytuł i wykonawcę! Czekaj na koniec rundy...
        </div>
      )}
      {guessStatus === 'guessedTitle' && (
        <div className="guess-status">
          ✓ Tytuł odgadnięty! Zgadnij teraz wykonawcę...
        </div>
      )}
      {guessStatus === 'guessedArtist' && (
        <div className="guess-status">
          ✓ Wykonawca odgadnięty! Zgadnij teraz tytuł...
        </div>
      )}
      {guessStatus === 'incorrect' && (
        <div className="guess-status incorrect">
          ✗ Niepoprawna odpowiedź. Spróbuj ponownie!
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
