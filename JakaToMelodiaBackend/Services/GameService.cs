using JakaToMelodiaBackend.Models;

namespace JakaToMelodiaBackend.Services;

public interface IGameService
{
    GameRoom CreateRoom(MusicSource musicSource = MusicSource.Spotify);
    GameRoom? GetRoom(string roomCode);
    bool JoinRoom(string roomCode, Player player);
    bool LeaveRoom(string roomCode, string playerId);
    bool SetPlaylist(string roomCode, List<Song> songs);
    bool StartGame(string roomCode);
    bool StartNextRound(string roomCode);
    GuessResult ProcessGuess(string roomCode, string playerId, string guess);
    void CleanupInactiveRooms();
    IEnumerable<GameRoom> GetAllRooms();
}

public class GameService : IGameService
{
    private readonly Dictionary<string, GameRoom> _rooms = new();
    private readonly Random _random = new();
    private const int TitlePoints = 100;
    private const int ArtistPoints = 50;

    public GameRoom CreateRoom(MusicSource musicSource = MusicSource.Spotify)
    {
        var room = new GameRoom
        {
            RoomCode = GenerateRoomCode(),
            MusicSource = musicSource
        };
        _rooms[room.RoomCode] = room;
        return room;
    }

    public GameRoom? GetRoom(string roomCode)
    {
        _rooms.TryGetValue(roomCode, out var room);
        return room;
    }

    public bool JoinRoom(string roomCode, Player player)
    {
        if (!_rooms.TryGetValue(roomCode, out var room))
            return false;

        if (room.State != GameState.Lobby)
            return false;

        // First player is host
        if (room.Players.Count == 0)
            player.IsHost = true;

        room.Players.Add(player);
        return true;
    }

    public bool LeaveRoom(string roomCode, string playerId)
    {
        if (!_rooms.TryGetValue(roomCode, out var room))
            return false;

        var player = room.Players.FirstOrDefault(p => p.Id == playerId);
        if (player == null)
            return false;

        room.Players.Remove(player);

        // If host left, assign new host
        if (player.IsHost && room.Players.Count > 0)
        {
            room.Players[0].IsHost = true;
        }

        // Remove room if empty
        if (room.Players.Count == 0)
        {
            _rooms.Remove(roomCode);
        }

        return true;
    }

    public bool SetPlaylist(string roomCode, List<Song> songs)
    {
        if (!_rooms.TryGetValue(roomCode, out var room))
            return false;

        // Filter songs that have preview URLs
        room.Playlist = songs.Where(s => !string.IsNullOrEmpty(s.PreviewUrl)).ToList();
        return true;
    }

    public bool StartGame(string roomCode)
    {
        if (!_rooms.TryGetValue(roomCode, out var room))
            return false;

        if (room.Playlist.Count == 0)
            return false;

        room.State = GameState.Playing;
        room.CurrentSongIndex = 0;
        
        // Shuffle playlist
        room.Playlist = room.Playlist.OrderBy(_ => _random.Next()).ToList();
        
        return StartNextRound(roomCode);
    }

    public bool StartNextRound(string roomCode)
    {
        if (!_rooms.TryGetValue(roomCode, out var room))
            return false;

        if (room.CurrentSongIndex >= room.Playlist.Count)
        {
            room.State = GameState.GameOver;
            return false;
        }

        room.CurrentSong = room.Playlist[room.CurrentSongIndex];
        room.RoundStartTime = DateTime.UtcNow;
        room.PlayersWhoGuessed.Clear();
        room.State = GameState.Playing;
        
        return true;
    }

    public GuessResult ProcessGuess(string roomCode, string playerId, string guess)
    {
        if (!_rooms.TryGetValue(roomCode, out var room))
            return new GuessResult { IsCorrect = false };

        var player = room.Players.FirstOrDefault(p => p.Id == playerId);
        if (player == null || room.CurrentSong == null)
            return new GuessResult { IsCorrect = false };

        // Check if player already guessed this round
        if (room.PlayersWhoGuessed.Contains(playerId))
            return new GuessResult { IsCorrect = false };

        room.PlayersWhoGuessed.Add(playerId);

        var result = new GuessResult
        {
            PlayerName = player.Name
        };

        // Check title match
        if (IsMatch(guess, room.CurrentSong.Title))
        {
            result.IsCorrect = true;
            result.Type = GuessType.Title;
            result.PointsAwarded = TitlePoints;
            player.Score += TitlePoints;
        }
        // Check artist match
        else if (IsMatch(guess, room.CurrentSong.Artist))
        {
            result.IsCorrect = true;
            result.Type = GuessType.Artist;
            result.PointsAwarded = ArtistPoints;
            player.Score += ArtistPoints;
        }
        else
        {
            result.IsCorrect = false;
            result.Type = GuessType.None;
        }

        return result;
    }

    public void CleanupInactiveRooms()
    {
        var cutoffTime = DateTime.UtcNow.AddHours(-2);
        var inactiveRooms = _rooms.Where(r => r.Value.CreatedAt < cutoffTime).Select(r => r.Key).ToList();
        
        foreach (var roomCode in inactiveRooms)
        {
            _rooms.Remove(roomCode);
        }
    }

    public IEnumerable<GameRoom> GetAllRooms()
    {
        return _rooms.Values;
    }

    private string GenerateRoomCode()
    {
        const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        string code;
        do
        {
            code = new string(Enumerable.Range(0, 6)
                .Select(_ => chars[_random.Next(chars.Length)])
                .ToArray());
        } while (_rooms.ContainsKey(code));

        return code;
    }

    private bool IsMatch(string guess, string target)
    {
        if (string.IsNullOrWhiteSpace(guess) || string.IsNullOrWhiteSpace(target))
            return false;

        var normalizedGuess = NormalizeString(guess);
        var normalizedTarget = NormalizeString(target);

        // Exact match
        if (normalizedGuess == normalizedTarget)
            return true;

        // Contains match (for partial answers)
        if (normalizedTarget.Contains(normalizedGuess) || normalizedGuess.Contains(normalizedTarget))
        {
            // Require at least 60% similarity
            var similarity = (double)Math.Min(normalizedGuess.Length, normalizedTarget.Length) / 
                           Math.Max(normalizedGuess.Length, normalizedTarget.Length);
            return similarity >= 0.6;
        }

        return false;
    }

    private string NormalizeString(string input)
    {
        return input.Trim().ToLowerInvariant()
            .Replace("&", "and")
            .Replace("'", "")
            .Replace("\"", "")
            .Replace("-", " ")
            .Replace(".", "");
    }
}
