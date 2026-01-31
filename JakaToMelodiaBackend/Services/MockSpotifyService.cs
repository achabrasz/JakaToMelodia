using JakaToMelodiaBackend.Models;

namespace JakaToMelodiaBackend.Services;

public class MockSpotifyService : ISpotifyService
{
    public Task<string> GetAuthorizationUrl()
    {
        return Task.FromResult("http://localhost:5173"); // Mock URL
    }

    public Task<bool> HandleCallback(string code)
    {
        return Task.FromResult(true); // Always succeed
    }

    public Task<List<Song>> GetPlaylistTracks(string playlistId)
    {
        // Return mock playlist with popular songs
        var mockSongs = new List<Song>
        {
            new Song
            {
                Id = "1",
                Title = "Bohemian Rhapsody",
                Artist = "Queen",
                PreviewUrl = "https://p.scdn.co/mp3-preview/1234", // Mock URL
                AlbumImageUrl = "https://i.scdn.co/image/ab67616d0000b273abc123",
                DurationMs = 30000
            },
            new Song
            {
                Id = "2",
                Title = "Stairway to Heaven",
                Artist = "Led Zeppelin",
                PreviewUrl = "https://p.scdn.co/mp3-preview/5678",
                AlbumImageUrl = "https://i.scdn.co/image/ab67616d0000b273def456",
                DurationMs = 30000
            },
            new Song
            {
                Id = "3",
                Title = "Imagine",
                Artist = "John Lennon",
                PreviewUrl = "https://p.scdn.co/mp3-preview/9012",
                AlbumImageUrl = "https://i.scdn.co/image/ab67616d0000b273ghi789",
                DurationMs = 30000
            },
            new Song
            {
                Id = "4",
                Title = "Hotel California",
                Artist = "Eagles",
                PreviewUrl = "https://p.scdn.co/mp3-preview/3456",
                AlbumImageUrl = "https://i.scdn.co/image/ab67616d0000b273jkl012",
                DurationMs = 30000
            },
            new Song
            {
                Id = "5",
                Title = "Billie Jean",
                Artist = "Michael Jackson",
                PreviewUrl = "https://p.scdn.co/mp3-preview/7890",
                AlbumImageUrl = "https://i.scdn.co/image/ab67616d0000b273mno345",
                DurationMs = 30000
            },
            new Song
            {
                Id = "6",
                Title = "Sweet Child O' Mine",
                Artist = "Guns N' Roses",
                PreviewUrl = "https://p.scdn.co/mp3-preview/1122",
                AlbumImageUrl = "https://i.scdn.co/image/ab67616d0000b273pqr678",
                DurationMs = 30000
            },
            new Song
            {
                Id = "7",
                Title = "Smells Like Teen Spirit",
                Artist = "Nirvana",
                PreviewUrl = "https://p.scdn.co/mp3-preview/3344",
                AlbumImageUrl = "https://i.scdn.co/image/ab67616d0000b273stu901",
                DurationMs = 30000
            },
            new Song
            {
                Id = "8",
                Title = "Hey Jude",
                Artist = "The Beatles",
                PreviewUrl = "https://p.scdn.co/mp3-preview/5566",
                AlbumImageUrl = "https://i.scdn.co/image/ab67616d0000b273vwx234",
                DurationMs = 30000
            },
            new Song
            {
                Id = "9",
                Title = "Purple Rain",
                Artist = "Prince",
                PreviewUrl = "https://p.scdn.co/mp3-preview/7788",
                AlbumImageUrl = "https://i.scdn.co/image/ab67616d0000b273yza567",
                DurationMs = 30000
            },
            new Song
            {
                Id = "10",
                Title = "Thunderstruck",
                Artist = "AC/DC",
                PreviewUrl = "https://p.scdn.co/mp3-preview/9900",
                AlbumImageUrl = "https://i.scdn.co/image/ab67616d0000b273bcd890",
                DurationMs = 30000
            }
        };

        return Task.FromResult(mockSongs);
    }
}
