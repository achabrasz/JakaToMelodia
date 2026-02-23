using JakaToMelodiaBackend.Models;
using System.Text.Json;

namespace JakaToMelodiaBackend.Services;

public interface IYouTubeService
{
    Task<List<Song>> GetPlaylistTracks(string playlistId);
}

public class YouTubeService : IYouTubeService
{
    private readonly string _apiKey;
    private readonly HttpClient _httpClient;

    public YouTubeService(IConfiguration configuration, HttpClient httpClient)
    {
        _apiKey = configuration["YouTube:ApiKey"] ?? "";
        _httpClient = httpClient;
    }

    public async Task<List<Song>> GetPlaylistTracks(string playlistId)
    {
        var songs = new List<Song>();

        try
        {
            var url = $"https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId={playlistId}&key={_apiKey}";
            
            var response = await _httpClient.GetAsync(url);
            response.EnsureSuccessStatusCode();
            
            var json = await response.Content.ReadAsStringAsync();
            var data = JsonDocument.Parse(json);
            
            if (data.RootElement.TryGetProperty("items", out var items))
            {
                foreach (var item in items.EnumerateArray())
                {
                    var snippet = item.GetProperty("snippet");
                    var resourceId = snippet.GetProperty("resourceId");
                    var videoId = resourceId.GetProperty("videoId").GetString() ?? "";
                    var title = snippet.GetProperty("title").GetString() ?? "";
                    var channelTitle = snippet.GetProperty("channelTitle").GetString() ?? "";
                    
                    var thumbnail = "";
                    if (snippet.TryGetProperty("thumbnails", out var thumbnails))
                    {
                        if (thumbnails.TryGetProperty("high", out var high))
                        {
                            thumbnail = high.GetProperty("url").GetString() ?? "";
                        }
                        else if (thumbnails.TryGetProperty("default", out var defaultThumb))
                        {
                            thumbnail = defaultThumb.GetProperty("url").GetString() ?? "";
                        }
                    }
                    
                    songs.Add(new Song
                    {
                        Id = videoId,
                        Title = title,
                        Artist = channelTitle,
                        PreviewUrl = $"https://www.youtube.com/watch?v={videoId}",
                        AlbumImageUrl = thumbnail,
                        DurationMs = 30000 // Default 30 seconds
                    });
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error fetching YouTube playlist: {ex.Message}");
        }

        return songs;
    }
}
