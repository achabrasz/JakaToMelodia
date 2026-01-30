using JakaToMelodiaBackend.Models;
using Microsoft.Extensions.Options;
using SpotifyAPI.Web;

namespace JakaToMelodiaBackend.Services;

public interface ISpotifyService
{
    Task<string> GetAuthorizationUrl();
    Task<bool> HandleCallback(string code);
    Task<List<Song>> GetPlaylistTracks(string playlistId);
}

public class SpotifyService : ISpotifyService
{
    private readonly SpotifySettings _settings;
    private SpotifyClient? _spotifyClient;

    public SpotifyService(IOptions<SpotifySettings> settings)
    {
        _settings = settings.Value;
    }

    public async Task<string> GetAuthorizationUrl()
    {
        var loginRequest = new LoginRequest(
            new Uri(_settings.RedirectUri),
            _settings.ClientId,
            LoginRequest.ResponseType.Code
        )
        {
            Scope = new[] { Scopes.PlaylistReadPrivate, Scopes.PlaylistReadCollaborative }
        };

        return loginRequest.ToUri().ToString();
    }

    public async Task<bool> HandleCallback(string code)
    {
        try
        {
            var response = await new OAuthClient().RequestToken(
                new AuthorizationCodeTokenRequest(
                    _settings.ClientId,
                    _settings.ClientSecret,
                    code,
                    new Uri(_settings.RedirectUri)
                )
            );

            _spotifyClient = new SpotifyClient(response.AccessToken);
            return true;
        }
        catch
        {
            return false;
        }
    }

    public async Task<List<Song>> GetPlaylistTracks(string playlistId)
    {
        // Initialize client with client credentials if not already authenticated
        if (_spotifyClient == null)
        {
            var config = SpotifyClientConfig.CreateDefault();
            var request = new ClientCredentialsRequest(_settings.ClientId, _settings.ClientSecret);
            var response = await new OAuthClient(config).RequestToken(request);
            _spotifyClient = new SpotifyClient(config.WithToken(response.AccessToken));
        }

        var songs = new List<Song>();

        try
        {
            var playlist = await _spotifyClient.Playlists.Get(playlistId);
            
            await foreach (var item in _spotifyClient.Paginate(playlist.Tracks!))
            {
                if (item.Track is FullTrack track)
                {
                    songs.Add(new Song
                    {
                        Id = track.Id,
                        Title = track.Name,
                        Artist = string.Join(", ", track.Artists.Select(a => a.Name).ToArray()),
                        PreviewUrl = track.PreviewUrl ?? string.Empty,
                        AlbumImageUrl = track.Album.Images.FirstOrDefault()?.Url ?? string.Empty,
                        DurationMs = track.DurationMs
                    });
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error fetching playlist: {ex.Message}");
        }

        return songs;
    }
}
