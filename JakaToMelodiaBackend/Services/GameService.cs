using JakaToMelodiaBackend.Models;

namespace JakaToMelodiaBackend.Services;

public interface IGameService
{
    GameRoom CreateRoom(MusicSource musicSource = MusicSource.Spotify, int maxRounds = 0);
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

    public GameRoom CreateRoom(MusicSource musicSource = MusicSource.Spotify, int maxRounds = 0)
    {
        var room = new GameRoom
        {
            RoomCode = GenerateRoomCode(),
            MusicSource = musicSource,
            MaxRounds = maxRounds > 0 ? maxRounds : 0
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

        // Keep all songs — preview URLs may be empty (Spotify deprecated them);
        // the frontend uses embedded Spotify player by track ID instead.
        room.Playlist = songs.ToList();
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
        
        // Cap to MaxRounds if set
        if (room.MaxRounds > 0 && room.Playlist.Count > room.MaxRounds)
            room.Playlist = room.Playlist.Take(room.MaxRounds).ToList();
        
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
        room.PlayersRoundState.Clear();
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

        if (player == null || room.CurrentSong == null)
            return new GuessResult { IsCorrect = false };

        if (!room.PlayersRoundState.ContainsKey(playerId))
        {
            room.PlayersRoundState[playerId] = new PlayerRoundState();
        }
        var roundState = room.PlayersRoundState[playerId];

        // If player already guessed both, ignore further guesses
        if (roundState.GuessedArtist && roundState.GuessedTitle)
            return new GuessResult { IsCorrect = false };

        var result = new GuessResult
        {
            PlayerName = player.Name
        };

        bool pointAwarded = false;

        // Check Artist (if not yet guessed)
        // Use first artist only for simplicity as requested, but also support "Artist1, Artist2" matches
        if (!roundState.GuessedArtist)
        {
            var artists = room.CurrentSong.Artist.Split(',', StringSplitOptions.RemoveEmptyEntries)
                .Select(a => a.Trim())
                .ToList();
            
            // Check against any individual artist or the full string
            if (artists.Any(a => IsMatch(guess, a)) || IsMatch(guess, room.CurrentSong.Artist))
            {
                result.IsCorrect = true;
                result.Type = GuessType.Artist;
                result.PointsAwarded += ArtistPoints;
                player.Score += ArtistPoints;
                roundState.GuessedArtist = true;
                pointAwarded = true;
            }
        }

        // Check Title (if not yet guessed)
        if (!roundState.GuessedTitle)
        {
            var cleanTitle = StripBrackets(room.CurrentSong.Title);
            if (IsMatch(guess, cleanTitle) || IsMatch(guess, room.CurrentSong.Title))
            {
                result.IsCorrect = true;
                // If they actally guessed both in one go (rare but possible if logic allowed), or just title now
                result.Type = pointAwarded ? GuessType.Both : GuessType.Title; 
                result.PointsAwarded += TitlePoints; // Add to existing if any
                player.Score += TitlePoints;
                roundState.GuessedTitle = true;
                pointAwarded = true;
            }
        }

        if (!pointAwarded)
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

    private string StripBrackets(string input)
    {
        // Remove anything in (), [], {} — e.g. "I Smoked Away My Brain (feat. X)" → "I Smoked Away My Brain"
        var result = System.Text.RegularExpressions.Regex.Replace(input, @"\s*[\(\[\{][^\)\]\}]*[\)\]\}]", "");
        return result.Trim();
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
            var similarity = (double)Math.Min(normalizedGuess.Length, normalizedTarget.Length) /
                           Math.Max(normalizedGuess.Length, normalizedTarget.Length);
            return similarity >= 0.6;
        }

        return false;
    }

    private string NormalizeString(string input)
    {
        if (string.IsNullOrWhiteSpace(input)) return "";

        // Remove Polish and other diacritics by decomposing to base characters
        var normalized = input.Normalize(System.Text.NormalizationForm.FormD);
        var sb = new System.Text.StringBuilder();
        foreach (var c in normalized)
        {
            if (System.Globalization.CharUnicodeInfo.GetUnicodeCategory(c)
                != System.Globalization.UnicodeCategory.NonSpacingMark)
                sb.Append(c);
        }
        var withoutDiacritics = sb.ToString().Normalize(System.Text.NormalizationForm.FormC);

        return withoutDiacritics.Trim().ToLowerInvariant()
            .Replace("&", "and")
            .Replace("'", "")
            .Replace("\"", "")
            .Replace("-", " ")
            .Replace(".", "");
    }
}
