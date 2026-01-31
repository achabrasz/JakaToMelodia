using JakaToMelodiaBackend.Models;
using JakaToMelodiaBackend.Services;
using Microsoft.AspNetCore.SignalR;

namespace JakaToMelodiaBackend.Hubs;

public class GameHub : Hub
{
    private readonly IGameService _gameService;

    public GameHub(IGameService gameService)
    {
        _gameService = gameService;
    }

    public async Task<string> CreateRoom(string playerName, MusicSource musicSource = MusicSource.Spotify)
    {
        var room = _gameService.CreateRoom(musicSource);
        var player = new Player
        {
            Name = playerName,
            ConnectionId = Context.ConnectionId,
            IsHost = true
        };

        _gameService.JoinRoom(room.RoomCode, player);
        await Groups.AddToGroupAsync(Context.ConnectionId, room.RoomCode);
        
        await Clients.Group(room.RoomCode).SendAsync("RoomUpdated", room);
        
        return room.RoomCode;
    }

    public async Task<bool> JoinRoom(string roomCode, string playerName)
    {
        var room = _gameService.GetRoom(roomCode);
        if (room == null)
        {
            await Clients.Caller.SendAsync("Error", "Room not found");
            return false;
        }

        var player = new Player
        {
            Name = playerName,
            ConnectionId = Context.ConnectionId
        };

        var joined = _gameService.JoinRoom(roomCode, player);
        if (!joined)
        {
            await Clients.Caller.SendAsync("Error", "Cannot join room");
            return false;
        }

        await Groups.AddToGroupAsync(Context.ConnectionId, roomCode);
        await Clients.Group(roomCode).SendAsync("PlayerJoined", player);
        await Clients.Group(roomCode).SendAsync("RoomUpdated", room);
        
        return true;
    }

    public async Task LeaveRoom(string roomCode, string playerId)
    {
        var room = _gameService.GetRoom(roomCode);
        if (room == null) return;

        _gameService.LeaveRoom(roomCode, playerId);
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, roomCode);
        
        var updatedRoom = _gameService.GetRoom(roomCode);
        if (updatedRoom != null)
        {
            await Clients.Group(roomCode).SendAsync("PlayerLeft", playerId);
            await Clients.Group(roomCode).SendAsync("RoomUpdated", updatedRoom);
        }
    }

    public async Task SetPlaylist(string roomCode, string playlistUrl)
    {
        // Extract playlist ID from URL
        var playlistId = ExtractPlaylistId(playlistUrl);
        if (string.IsNullOrEmpty(playlistId))
        {
            await Clients.Caller.SendAsync("Error", "Invalid playlist URL");
            return;
        }

        await Clients.Caller.SendAsync("PlaylistLoading", true);
        await Clients.Caller.SendAsync("PlaylistId", playlistId);
    }

    public async Task PlaylistLoaded(string roomCode, List<Song> songs)
    {
        var success = _gameService.SetPlaylist(roomCode, songs);
        if (!success)
        {
            await Clients.Caller.SendAsync("Error", "Failed to load playlist");
            return;
        }

        var room = _gameService.GetRoom(roomCode);
        await Clients.Group(roomCode).SendAsync("RoomUpdated", room);
        await Clients.Group(roomCode).SendAsync("PlaylistSet", songs.Count);
    }

    public async Task StartGame(string roomCode)
    {
        var success = _gameService.StartGame(roomCode);
        if (!success)
        {
            await Clients.Caller.SendAsync("Error", "Cannot start game");
            return;
        }

        var room = _gameService.GetRoom(roomCode);
        if (room?.CurrentSong == null) return;

        await Clients.Group(roomCode).SendAsync("GameStarted");
        await Clients.Group(roomCode).SendAsync("RoundStarted", new
        {
            song = new
            {
                room.CurrentSong.Id,
                room.CurrentSong.PreviewUrl,
                room.CurrentSong.AlbumImageUrl,
                room.CurrentSong.DurationMs
            },
            roundNumber = room.CurrentSongIndex + 1,
            totalRounds = room.Playlist.Count
        });
    }

    public async Task SubmitGuess(string roomCode, string playerId, string guess)
    {
        var result = _gameService.ProcessGuess(roomCode, playerId, guess);
        var room = _gameService.GetRoom(roomCode);
        
        if (result.IsCorrect)
        {
            await Clients.Group(roomCode).SendAsync("CorrectGuess", new
            {
                playerId,
                playerName = result.PlayerName,
                type = result.Type.ToString(),
                points = result.PointsAwarded
            });
            
            await Clients.Group(roomCode).SendAsync("RoomUpdated", room);
        }
        else
        {
            await Clients.Caller.SendAsync("IncorrectGuess");
        }
    }

    public async Task EndRound(string roomCode)
    {
        var room = _gameService.GetRoom(roomCode);
        if (room?.CurrentSong == null) return;

        await Clients.Group(roomCode).SendAsync("RoundEnded", new
        {
            title = room.CurrentSong.Title,
            artist = room.CurrentSong.Artist,
            albumImageUrl = room.CurrentSong.AlbumImageUrl
        });
    }

    public async Task NextRound(string roomCode)
    {
        var room = _gameService.GetRoom(roomCode);
        if (room == null) return;

        room.CurrentSongIndex++;
        
        var success = _gameService.StartNextRound(roomCode);
        if (!success)
        {
            // Game over
            await Clients.Group(roomCode).SendAsync("GameOver", new
            {
                players = room.Players.OrderByDescending(p => p.Score).ToList()
            });
            return;
        }

        if (room.CurrentSong == null) return;

        await Clients.Group(roomCode).SendAsync("RoundStarted", new
        {
            song = new
            {
                room.CurrentSong.Id,
                room.CurrentSong.PreviewUrl,
                room.CurrentSong.AlbumImageUrl,
                room.CurrentSong.DurationMs
            },
            roundNumber = room.CurrentSongIndex + 1,
            totalRounds = room.Playlist.Count
        });
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        // Find and remove player from any room
        var rooms = _gameService.GetAllRooms();
        foreach (var room in rooms)
        {
            var player = room.Players.FirstOrDefault(p => p.ConnectionId == Context.ConnectionId);
            if (player != null)
            {
                await LeaveRoom(room.RoomCode, player.Id);
                break;
            }
        }

        await base.OnDisconnectedAsync(exception);
    }

    private string ExtractPlaylistId(string url)
    {
        try
        {
            // https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M
            var uri = new Uri(url);
            var segments = uri.AbsolutePath.Split('/');
            var playlistIndex = Array.IndexOf(segments, "playlist");
            if (playlistIndex >= 0 && playlistIndex + 1 < segments.Length)
            {
                return segments[playlistIndex + 1].Split('?')[0];
            }
        }
        catch
        {
            // Invalid URL
        }

        return string.Empty;
    }
}
