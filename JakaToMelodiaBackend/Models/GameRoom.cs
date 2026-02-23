namespace JakaToMelodiaBackend.Models;

public class GameRoom
{
    public string RoomId { get; set; } = Guid.NewGuid().ToString();
    public string RoomCode { get; set; } = string.Empty;
    public List<Player> Players { get; set; } = new();
    public List<Song> Playlist { get; set; } = new();
    public GameState State { get; set; } = GameState.Lobby;
    public Song? CurrentSong { get; set; }
    public int CurrentSongIndex { get; set; } = 0;
    public DateTime? RoundStartTime { get; set; }
    public HashSet<string> PlayersWhoGuessed { get; set; } = new();
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public MusicSource MusicSource { get; set; } = MusicSource.Spotify;
}

public enum GameState
{
    Lobby,
    Playing,
    RoundEnd,
    GameOver
}

public enum MusicSource
{
    Spotify = 0,
    YouTube = 1
}

