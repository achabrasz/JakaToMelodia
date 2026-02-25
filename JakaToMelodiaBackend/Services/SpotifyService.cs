using JakaToMelodiaBackend.Models;
using Microsoft.Extensions.Options;
using System.Net.Http.Headers;
using System.Text.Json;

namespace JakaToMelodiaBackend.Services;

public interface ISpotifyService
{
    Task<string> GetAuthorizationUrl();
    Task<bool> HandleCallback(string code);
    Task<List<Song>> GetPlaylistTracks(string playlistId);
    Task InitializeAsync();
    bool IsAuthenticated { get; }
}

public class SpotifyService : ISpotifyService
{
    private readonly SpotifySettings _settings;
    private readonly ILogger<SpotifyService> _logger;
    private readonly HttpClient _httpClient;

    // User OAuth token (Authorization Code flow) — required for playlist items endpoint
    private string? _accessToken;
    private string? _refreshToken;
    private DateTime _tokenExpiry = DateTime.MinValue;

    // App-level token (Client Credentials flow) — unused, kept for future use
    // private string? _ccToken;
    // private DateTime _ccTokenExpiry = DateTime.MinValue;

    public bool IsAuthenticated => (_accessToken != null && DateTime.UtcNow < _tokenExpiry)
                                || _refreshToken != null;

    public SpotifyService(IOptions<SpotifySettings> settings, ILogger<SpotifyService> logger, IHttpClientFactory httpClientFactory)
    {
        _settings = settings.Value;
        _logger = logger;
        _httpClient = httpClientFactory.CreateClient("Spotify");

        // Seed refresh token from config/env so the service is ready without manual OAuth
        if (!string.IsNullOrEmpty(_settings.RefreshToken))
        {
            _refreshToken = _settings.RefreshToken;
            _logger.LogInformation("Spotify refresh token loaded from configuration");
        }
    }

    public async Task InitializeAsync()
    {
        if (string.IsNullOrEmpty(_refreshToken))
        {
            _logger.LogWarning("No Spotify refresh token configured. Visit /api/spotify/auth to authenticate.");
            return;
        }

        try
        {
            await GetUserTokenAsync();
            _logger.LogInformation("Spotify pre-authenticated successfully on startup");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Spotify pre-authentication failed on startup");
        }
    }

    public Task<string> GetAuthorizationUrl()
    {
        var scopes = "playlist-read-private playlist-read-collaborative user-library-read";
        var redirectUri = Uri.EscapeDataString(_settings.RedirectUri);
        var scopeEncoded = Uri.EscapeDataString(scopes);

        var url = $"https://accounts.spotify.com/authorize" +
                  $"?response_type=code" +
                  $"&client_id={_settings.ClientId}" +
                  $"&scope={scopeEncoded}" +
                  $"&redirect_uri={redirectUri}";

        _logger.LogInformation("Spotify auth URL: {Url}", url);
        _logger.LogInformation("Redirect URI used: {RedirectUri}", _settings.RedirectUri);

        return Task.FromResult(url);
    }

    public async Task<bool> HandleCallback(string code)
    {
        try
        {
            _logger.LogInformation("Handling Spotify OAuth callback");
            var credentials = Convert.ToBase64String(
                System.Text.Encoding.UTF8.GetBytes($"{_settings.ClientId}:{_settings.ClientSecret}"));

            var request = new HttpRequestMessage(HttpMethod.Post, "https://accounts.spotify.com/api/token");
            request.Headers.Authorization = new AuthenticationHeaderValue("Basic", credentials);
            request.Content = new FormUrlEncodedContent(new[]
            {
                new KeyValuePair<string, string>("grant_type", "authorization_code"),
                new KeyValuePair<string, string>("code", code),
                new KeyValuePair<string, string>("redirect_uri", _settings.RedirectUri),
            });

            var response = await _httpClient.SendAsync(request);
            var body = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("Spotify OAuth callback failed: {Status} {Body}", response.StatusCode, body);
                return false;
            }

            var json = JsonDocument.Parse(body);
            _accessToken = json.RootElement.GetProperty("access_token").GetString()!;
            _refreshToken = json.RootElement.TryGetProperty("refresh_token", out var rt) ? rt.GetString() : null;
            var expiresIn = json.RootElement.GetProperty("expires_in").GetInt32();
            _tokenExpiry = DateTime.UtcNow.AddSeconds(expiresIn - 60);

            _logger.LogInformation("Spotify OAuth authenticated, token expires in {Seconds}s", expiresIn);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error handling Spotify callback");
            return false;
        }
    }

    private async Task<string> GetUserTokenAsync()
    {
        // Token still valid
        if (_accessToken != null && DateTime.UtcNow < _tokenExpiry)
            return _accessToken;

        // Refresh using refresh token
        if (_refreshToken != null)
        {
            _logger.LogInformation("Refreshing Spotify access token");
            var credentials = Convert.ToBase64String(
                System.Text.Encoding.UTF8.GetBytes($"{_settings.ClientId}:{_settings.ClientSecret}"));

            var request = new HttpRequestMessage(HttpMethod.Post, "https://accounts.spotify.com/api/token");
            request.Headers.Authorization = new AuthenticationHeaderValue("Basic", credentials);
            request.Content = new FormUrlEncodedContent(new[]
            {
                new KeyValuePair<string, string>("grant_type", "refresh_token"),
                new KeyValuePair<string, string>("refresh_token", _refreshToken),
            });

            var response = await _httpClient.SendAsync(request);
            var body = await response.Content.ReadAsStringAsync();

            if (response.IsSuccessStatusCode)
            {
                var json = JsonDocument.Parse(body);
                _accessToken = json.RootElement.GetProperty("access_token").GetString()!;
                if (json.RootElement.TryGetProperty("refresh_token", out var newRt))
                {
                    _refreshToken = newRt.GetString();
                    _logger.LogInformation("Spotify refresh token rotated: {RefreshToken}", _refreshToken);
                }
                var expiresIn = json.RootElement.GetProperty("expires_in").GetInt32();
                _tokenExpiry = DateTime.UtcNow.AddSeconds(expiresIn - 60);
                _logger.LogInformation("Spotify token refreshed successfully");
                return _accessToken;
            }

            _logger.LogWarning("Failed to refresh token: {Status} {Body}", response.StatusCode, body);
            _refreshToken = null;
        }

        throw new InvalidOperationException("Brak autoryzacji Spotify. Zaloguj się przez /api/spotify/auth");
    }

    public async Task<List<Song>> GetPlaylistTracks(string playlistId)
    {
        // Playlist items endpoint requires user OAuth token (Spotify policy since late 2024)
        var token = await GetUserTokenAsync();
        var songs = new List<Song>();

        try
        {
            _logger.LogInformation("Fetching Spotify playlist {PlaylistId}", playlistId);

            var offset = 0;
            const int limit = 50;
            var retried = false;

            while (true)
            {
                var url = $"https://api.spotify.com/v1/playlists/{playlistId}/items?limit={limit}&offset={offset}";
                var req = new HttpRequestMessage(HttpMethod.Get, url);
                req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

                var resp = await _httpClient.SendAsync(req);
                var body = await resp.Content.ReadAsStringAsync();

                _logger.LogInformation("Spotify items response: status={Status}, offset={Offset}", resp.StatusCode, offset);

                if (!resp.IsSuccessStatusCode)
                {
                    _logger.LogError("Spotify API error: status={Status}, body={Body}", resp.StatusCode, body);
                    if ((int)resp.StatusCode == 401 && !retried)
                    {
                        // Force token refresh and retry once
                        _accessToken = null;
                        token = await GetUserTokenAsync();
                        retried = true;
                        continue;
                    }
                    if ((int)resp.StatusCode == 403)
                        throw new InvalidOperationException("Brak dostępu do playlisty. Upewnij się że jest publiczna.");
                    if ((int)resp.StatusCode == 404)
                        throw new InvalidOperationException("Playlista nie została znaleziona.");
                    throw new InvalidOperationException($"Błąd Spotify API: {resp.StatusCode} - {body}");
                }

                retried = false;

                var page = JsonDocument.Parse(body).RootElement;

                if (!page.TryGetProperty("items", out var items))
                {
                    _logger.LogWarning("No 'items' in Spotify response: {Body}", body[..Math.Min(500, body.Length)]);
                    break;
                }

                foreach (var item in items.EnumerateArray())
                {
                    // New API uses "item" key (renamed from "track")
                    JsonElement track;
                    if (item.TryGetProperty("item", out track) && track.ValueKind != JsonValueKind.Null)
                    {
                        // new field name "item"
                    }
                    else if (item.TryGetProperty("track", out track) && track.ValueKind != JsonValueKind.Null)
                    {
                        // fallback for old field name
                    }
                    else
                    {
                        continue;
                    }

                    if (track.TryGetProperty("type", out var type) && type.GetString() != "track")
                        continue; // skip episodes

                    var id = track.TryGetProperty("id", out var idProp) ? idProp.GetString() ?? "" : "";
                    var title = track.TryGetProperty("name", out var nameProp) ? nameProp.GetString() ?? "" : "";
                    var previewUrl = track.TryGetProperty("preview_url", out var previewProp) && previewProp.ValueKind != JsonValueKind.Null
                        ? previewProp.GetString() ?? ""
                        : "";

                    var artist = "";
                    if (track.TryGetProperty("artists", out var artistsEl))
                    {
                        artist = string.Join(", ", artistsEl.EnumerateArray()
                            .Select(a => a.TryGetProperty("name", out var n) ? n.GetString() ?? "" : ""));
                    }

                    var albumImage = "";
                    if (track.TryGetProperty("album", out var album) && album.TryGetProperty("images", out var images))
                    {
                        var first = images.EnumerateArray().FirstOrDefault();
                        if (first.ValueKind != JsonValueKind.Undefined)
                            albumImage = first.TryGetProperty("url", out var imgUrl) ? imgUrl.GetString() ?? "" : "";
                    }

                    var durationMs = track.TryGetProperty("duration_ms", out var durProp) ? durProp.GetInt32() : 0;

                    _logger.LogDebug("Track: {Title} by {Artist}, preview={HasPreview}",
                        title, artist, string.IsNullOrEmpty(previewUrl) ? "NONE" : "YES");

                    if (!string.IsNullOrEmpty(id) && !string.IsNullOrEmpty(title))
                    {
                        songs.Add(new Song
                        {
                            Id = id,
                            Title = title,
                            Artist = artist,
                            PreviewUrl = previewUrl,
                            AlbumImageUrl = albumImage,
                            DurationMs = durationMs
                        });
                    }
                }

                if (!page.TryGetProperty("next", out var next) || next.ValueKind == JsonValueKind.Null)
                    break;

                offset += limit;
            }

            _logger.LogInformation("Fetched {Total} tracks ({WithPreview} have preview URLs) from playlist {PlaylistId}",
                songs.Count, songs.Count(s => !string.IsNullOrEmpty(s.PreviewUrl)), playlistId);
        }
        catch (InvalidOperationException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching Spotify playlist {PlaylistId}", playlistId);
            throw new InvalidOperationException($"Nie udało się pobrać playlisty: {ex.Message}");
        }

        return songs;
    }
}
