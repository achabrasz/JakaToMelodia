namespace JakaToMelodiaBackend.Models;

public class Song
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Artist { get; set; } = string.Empty;
    public string PreviewUrl { get; set; } = string.Empty;
    public string AlbumImageUrl { get; set; } = string.Empty;
    public int DurationMs { get; set; }
}
