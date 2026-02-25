using JakaToMelodiaBackend.Models;
using JakaToMelodiaBackend.Services;
using Microsoft.AspNetCore.SignalR;

namespace JakaToMelodiaBackend.Hubs;

public class GameHub : Hub
{
    private readonly IGameService _gameService;
    private readonly ILogger<GameHub> _logger;

    public GameHub(IGameService gameService, ILogger<GameHub> logger)
    {
        _gameService = gameService;
        _logger = logger;
    }

    public async Task<string> CreateRoom(string playerName, MusicSource musicSource = MusicSource.Spotify, int maxRounds = 0)
    {
        _logger.LogInformation("CreateRoom: player={PlayerName}, source={MusicSource}, maxRounds={MaxRounds}, connectionId={ConnectionId}",
            playerName, musicSource, maxRounds, Context.ConnectionId);

        var room = _gameService.CreateRoom(musicSource, maxRounds);
        var player = new Player
        {
            Name = playerName,
            ConnectionId = Context.ConnectionId,
            IsHost = true
        };

        _gameService.JoinRoom(room.RoomCode, player);
        await Groups.AddToGroupAsync(Context.ConnectionId, room.RoomCode);

        _logger.LogInformation("Room {RoomCode} created, playerId={PlayerId}", room.RoomCode, player.Id);

        // RoomUpdated fires here – frontend may not have registered the listener yet.
        // The frontend should call GetRoom after navigating to re-sync state.
        await Clients.Group(room.RoomCode).SendAsync("RoomUpdated", room);

        return room.RoomCode;
    }

    /// <summary>
    /// Called by the client after mounting GameRoomPage to get the current room snapshot
    /// and retrieve its own player object (with the server-assigned ID).
    /// </summary>
    public async Task<GameRoom?> GetRoom(string roomCode)
    {
        _logger.LogInformation("GetRoom: roomCode={RoomCode}, connectionId={ConnectionId}", roomCode, Context.ConnectionId);
        var room = _gameService.GetRoom(roomCode);
        if (room == null)
            _logger.LogWarning("GetRoom: room {RoomCode} not found", roomCode);
        return room;
    }

    public async Task<bool> JoinRoom(string roomCode, string playerName)
    {
        _logger.LogInformation("JoinRoom: roomCode={RoomCode}, player={PlayerName}, connectionId={ConnectionId}",
            roomCode, playerName, Context.ConnectionId);

        var room = _gameService.GetRoom(roomCode);
        if (room == null)
        {
            _logger.LogWarning("JoinRoom: room {RoomCode} not found", roomCode);
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
            _logger.LogWarning("JoinRoom: cannot join room {RoomCode}", roomCode);
            await Clients.Caller.SendAsync("Error", "Cannot join room");
            return false;
        }

        await Groups.AddToGroupAsync(Context.ConnectionId, roomCode);

        var updatedRoom = _gameService.GetRoom(roomCode);
        _logger.LogInformation("Player {PlayerId} joined room {RoomCode}", player.Id, roomCode);

        await Clients.Group(roomCode).SendAsync("PlayerJoined", player);
        await Clients.Group(roomCode).SendAsync("RoomUpdated", updatedRoom);

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
        _logger.LogInformation("SetPlaylist: roomCode={RoomCode}, url={Url}", roomCode, playlistUrl);
        var playlistId = ExtractPlaylistId(playlistUrl);
        if (string.IsNullOrEmpty(playlistId))
        {
            _logger.LogWarning("SetPlaylist: invalid URL {Url}", playlistUrl);
            await Clients.Caller.SendAsync("Error", "Invalid playlist URL");
            return;
        }

        _logger.LogInformation("SetPlaylist: extracted playlistId={PlaylistId}", playlistId);
        await Clients.Caller.SendAsync("PlaylistLoading", true);
        await Clients.Caller.SendAsync("PlaylistId", playlistId);
    }

    public async Task PlaylistLoaded(string roomCode, List<Song> songs)
    {
        _logger.LogInformation("PlaylistLoaded: roomCode={RoomCode}, songCount={Count}", roomCode, songs.Count);
        var success = _gameService.SetPlaylist(roomCode, songs);
        if (!success)
        {
            _logger.LogWarning("PlaylistLoaded: failed to set playlist for room {RoomCode}", roomCode);
            await Clients.Caller.SendAsync("Error", "Failed to load playlist");
            return;
        }

        var room = _gameService.GetRoom(roomCode);
        _logger.LogInformation("PlaylistLoaded: room {RoomCode} now has {Count} songs after filtering", roomCode, room?.Playlist.Count);
        await Clients.Group(roomCode).SendAsync("RoomUpdated", room);
        await Clients.Group(roomCode).SendAsync("PlaylistSet", songs.Count);
    }

    public async Task StartGame(string roomCode)
    {
        _logger.LogInformation("StartGame: roomCode={RoomCode}", roomCode);
        var success = _gameService.StartGame(roomCode);
        if (!success)
        {
            _logger.LogWarning("StartGame: cannot start game in room {RoomCode}", roomCode);
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
            maskedTitle = GetMaskedString(room.CurrentSong.Title),
            maskedArtist = GetMaskedString(room.CurrentSong.Artist),
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

        // Masking logic: strip brackets for title, take first artist for artist
        // We need to use GameService helpers here but they are private.
        // For now, duplicate simple logic or expose helper.
        // Simulating StripBrackets simply by regex if needed, or just sending raw masked.
        // Let's use simple logic here consistent with GameService logic.
        
        string title = System.Text.RegularExpressions.Regex.Replace(room.CurrentSong.Title, @"\s*[\(\[\{][^\)\]\}]*[\)\]\}]", "").Trim();
        string artist = room.CurrentSong.Artist;

        await Clients.Group(roomCode).SendAsync("RoundStarted", new
        {
            song = new
            {
                room.CurrentSong.Id,
                room.CurrentSong.PreviewUrl,
                room.CurrentSong.AlbumImageUrl,
                room.CurrentSong.DurationMs
            },
            maskedTitle = GetMaskedString(title),
            maskedArtist = GetMaskedString(artist),
            roundNumber = room.CurrentSongIndex + 1,
            totalRounds = room.Playlist.Count
        });
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        _logger.LogInformation("OnDisconnected: connectionId={ConnectionId}, error={Error}",
            Context.ConnectionId, exception?.Message);

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

    private string GetMaskedString(string input)
    {
        // Replace letters/numbers with asterisks, keep spaces/punctuation
        return new string(input.Select(c => char.IsLetterOrDigit(c) ? '*' : c).ToArray());
    }
}
