import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { signalRService } from '../services/signalRService';
import { spotifyService } from '../services/spotifyService';
import { useGameStore } from '../store/gameStore';
import { GameState, RoundData, RoundEndData, Song } from '../types';
import { PlayerList } from '../components/PlayerList';
import { PlaylistInput } from '../components/PlaylistInput';
import { GamePlay } from '../components/GamePlay';
import { Leaderboard } from '../components/Leaderboard';
import './GameRoomPage.css';

export const GameRoomPage = () => {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const { room, currentPlayer, setRoom } = useGameStore();
  const [gameState, setGameState] = useState<GameState>(GameState.Lobby);
  const [currentRound, setCurrentRound] = useState<RoundData | null>(null);
  const [roundEndData, setRoundEndData] = useState<RoundEndData | null>(null);
  const [isLoadingPlaylist, setIsLoadingPlaylist] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (!signalRService.isConnected()) {
      navigate('/');
      return;
    }

    // Set up SignalR event listeners
    signalRService.on('RoomUpdated', (updatedRoom) => {
      setRoom(updatedRoom);
      setGameState(updatedRoom.state);
    });

    signalRService.on('PlaylistId', async (playlistId: string) => {
      setIsLoadingPlaylist(true);
      try {
        const songs = await spotifyService.getPlaylistTracks(playlistId);
        await signalRService.playlistLoaded(songs);
      } catch (error) {
        console.error('Failed to load playlist:', error);
      } finally {
        setIsLoadingPlaylist(false);
      }
    });

    signalRService.on('PlaylistSet', (songCount: number) => {
      console.log(`Playlist set with ${songCount} songs`);
    });

    signalRService.on('GameStarted', () => {
      setGameState(GameState.Playing);
    });

    signalRService.on('RoundStarted', (data: RoundData) => {
      setCurrentRound(data);
      setRoundEndData(null);
      setGameState(GameState.Playing);
      
      // Play audio
      if (audioRef.current && data.song.previewUrl) {
        audioRef.current.src = data.song.previewUrl;
        audioRef.current.play();
      }
    });

    signalRService.on('CorrectGuess', (data: any) => {
      console.log(`${data.playerName} guessed correctly! +${data.points} points`);
    });

    signalRService.on('IncorrectGuess', () => {
      console.log('Incorrect guess');
    });

    signalRService.on('RoundEnded', (data: RoundEndData) => {
      setRoundEndData(data);
      setGameState(GameState.RoundEnd);
      
      // Stop audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    });

    signalRService.on('GameOver', () => {
      setGameState(GameState.GameOver);
      
      // Stop audio
      if (audioRef.current) {
        audioRef.current.pause();
      }
    });

    signalRService.on('Error', (message: string) => {
      alert(message);
    });

    return () => {
      signalRService.off('RoomUpdated');
      signalRService.off('PlaylistId');
      signalRService.off('PlaylistSet');
      signalRService.off('GameStarted');
      signalRService.off('RoundStarted');
      signalRService.off('CorrectGuess');
      signalRService.off('IncorrectGuess');
      signalRService.off('RoundEnded');
      signalRService.off('GameOver');
      signalRService.off('Error');
    };
  }, [navigate, setRoom]);

  const handleStartGame = async () => {
    await signalRService.startGame();
  };

  const handleEndRound = async () => {
    await signalRService.endRound();
  };

  const handleNextRound = async () => {
    await signalRService.nextRound();
  };

  const handleLeaveRoom = async () => {
    if (currentPlayer) {
      await signalRService.leaveRoom(currentPlayer.id);
      await signalRService.disconnect();
      navigate('/');
    }
  };

  if (!room || !currentPlayer) {
    return <div>Loading...</div>;
  }

  const isHost = currentPlayer.isHost;

  return (
    <div className="game-room-page">
      <audio ref={audioRef} />
      
      <div className="room-header">
        <h1>Pokój: {roomCode}</h1>
        <button onClick={handleLeaveRoom} className="leave-button">
          Wyjdź
        </button>
      </div>

      <div className="room-content">
        <div className="sidebar">
          <PlayerList players={room.players} currentPlayerId={currentPlayer.id} />
        </div>

        <div className="main-area">
          {gameState === GameState.Lobby && (
            <div className="lobby">
              <h2>Poczekalnia</h2>
              
              {isHost && (
                <>
                  <PlaylistInput isLoading={isLoadingPlaylist} />
                  
                  {room.playlist.length > 0 && (
                    <div className="playlist-info">
                      <p>✓ Playlista załadowana: {room.playlist.length} utworów</p>
                      <button onClick={handleStartGame} className="start-button">
                        Rozpocznij grę
                      </button>
                    </div>
                  )}
                </>
              )}
              
              {!isHost && room.playlist.length === 0 && (
                <p>Oczekiwanie na gospodarza...</p>
              )}
              
              {!isHost && room.playlist.length > 0 && (
                <p>Oczekiwanie na rozpoczęcie gry...</p>
              )}
            </div>
          )}

          {(gameState === GameState.Playing || gameState === GameState.RoundEnd) && currentRound && (
            <GamePlay
              round={currentRound}
              roundEndData={roundEndData}
              isHost={isHost}
              currentPlayerId={currentPlayer.id}
              onEndRound={handleEndRound}
              onNextRound={handleNextRound}
            />
          )}

          {gameState === GameState.GameOver && (
            <Leaderboard players={room.players} onPlayAgain={() => navigate('/')} />
          )}
        </div>
      </div>
    </div>
  );
};
