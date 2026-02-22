import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { signalRService } from '../services/signalRService';
import { spotifyService } from '../services/spotifyService';
import { youtubeService } from '../services/youtubeService';
import { useGameStore } from '../store/gameStore';
import type { RoundData, RoundEndData, Song, GameState } from '../types';
import { GameStateValues, MusicSourceValues } from '../types';
import { PlayerList } from '../components/PlayerList';
import { PlaylistInput } from '../components/PlaylistInput';
import { GamePlay } from '../components/GamePlay';
import { Leaderboard } from '../components/Leaderboard';
import './GameRoomPage.css';

export const GameRoomPage = () => {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const { room, currentPlayer, setRoom, setCurrentPlayer } = useGameStore();
  const [gameState, setGameState] = useState<GameState>(GameStateValues.Lobby);
  const [currentRound, setCurrentRound] = useState<RoundData | null>(null);
  const [roundEndData, setRoundEndData] = useState<RoundEndData | null>(null);
  const [isLoadingPlaylist, setIsLoadingPlaylist] = useState(false);
  const [playlistError, setPlaylistError] = useState<string>('');
  
  // Note: audioRef and currentTrackId moved to GamePlay component

  useEffect(() => {
    if (!signalRService.isConnected()) {
      navigate('/');
      return;
    }

    // Fetch current room state immediately to avoid missing the RoomUpdated event
    // that fires right after CreateRoom/JoinRoom (before this effect runs).
    signalRService.getRoom(roomCode!).then((fetchedRoom) => {
      if (!fetchedRoom) {
        navigate('/');
        return;
      }
      setRoom(fetchedRoom);
      setGameState(fetchedRoom.state);

      // Resolve the current player by connection ID (server assigns the real ID)
      const connectionId = signalRService.getConnectionId();
      const me = fetchedRoom.players.find((p: any) => p.connectionId === connectionId);
      if (me) {
        setCurrentPlayer(me);
      }
    }).catch(() => navigate('/'));

    // Set up SignalR event listeners
    signalRService.on('RoomUpdated', (updatedRoom) => {
      setRoom(updatedRoom);
      setGameState(updatedRoom.state);
    });

    signalRService.on('PlaylistId', async (playlistId: string) => {
      setIsLoadingPlaylist(true);
      setPlaylistError('');
      try {
        let songs: Song[];
        const musicSource = useGameStore.getState().room?.musicSource;
        if (musicSource === MusicSourceValues.YouTube) {
          songs = await youtubeService.getPlaylistTracks(playlistId);
        } else {
          songs = await spotifyService.getPlaylistTracks(playlistId);
        }
        await signalRService.playlistLoaded(songs);
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Nie udało się załadować playlisty';
        setPlaylistError(msg);
        console.error('Failed to load playlist:', error);
      } finally {
        setIsLoadingPlaylist(false);
      }
    });

    signalRService.on('PlaylistSet', (songCount: number) => {
      console.log(`Playlist set with ${songCount} songs`);
    });

    signalRService.on('GameStarted', () => {
      setGameState(GameStateValues.Playing);
    });

    signalRService.on('RoundStarted', (data: RoundData) => {
      setCurrentRound(data);
      setRoundEndData(null);
      setGameState(GameStateValues.Playing);
    });

    signalRService.on('CorrectGuess', (data: any) => {
      console.log(`${data.playerName} guessed correctly! +${data.points} points`);
    });

    signalRService.on('IncorrectGuess', () => {
      console.log('Incorrect guess');
    });

    signalRService.on('RoundEnded', (data: RoundEndData) => {
      setRoundEndData(data);
      setGameState(GameStateValues.RoundEnd);
    });

    signalRService.on('GameOver', () => {
      setGameState(GameStateValues.GameOver);
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
  }, [navigate, roomCode, setRoom, setCurrentPlayer]);

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
          {gameState === GameStateValues.Lobby && (
            <div className="lobby">
              <h2>🎮 Poczekalnia</h2>

              {isHost && (
                <>
                  <PlaylistInput
                    isLoading={isLoadingPlaylist}
                    musicSource={room.musicSource}
                    error={playlistError}
                  />

                  {room.playlist.length > 0 && (
                    <div className="playlist-info">
                      <div className="playlist-info-icon">🎵</div>
                      <p className="playlist-info-title">Playlista załadowana!</p>
                      <p className="playlist-info-count">
                        <strong>{room.playlist.length}</strong> utworów gotowych do gry
                      </p>
                      <button onClick={handleStartGame} className="start-button">
                        ▶ Rozpocznij grę
                      </button>
                    </div>
                  )}
                </>
              )}

              {!isHost && room.playlist.length === 0 && (
                <p className="waiting-text">⏳ Oczekiwanie na załadowanie playlisty przez gospodarza...</p>
              )}

              {!isHost && room.playlist.length > 0 && (
                <div className="playlist-info">
                  <div className="playlist-info-icon">🎵</div>
                  <p className="playlist-info-title">Playlista załadowana!</p>
                  <p className="playlist-info-count">
                    <strong>{room.playlist.length}</strong> utworów · Oczekiwanie na start...
                  </p>
                </div>
              )}
            </div>
          )}

          {(gameState === GameStateValues.Playing || gameState === GameStateValues.RoundEnd) && currentRound && (
            <GamePlay
              round={currentRound}
              roundEndData={roundEndData}
              isHost={isHost}
              currentPlayerId={currentPlayer.id}
              onEndRound={handleEndRound}
              onNextRound={handleNextRound}
            />
          )}

          {gameState === GameStateValues.GameOver && (
            <Leaderboard players={room.players} onPlayAgain={() => navigate('/')} />
          )}
        </div>
      </div>
    </div>
  );
};
