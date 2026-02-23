using JakaToMelodiaBackend.Services;
using Microsoft.AspNetCore.Mvc;

namespace JakaToMelodiaBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SpotifyController : ControllerBase
{
    private readonly ISpotifyService _spotifyService;

    public SpotifyController(ISpotifyService spotifyService)
    {
        _spotifyService = spotifyService;
    }

    [HttpGet("auth")]
    public async Task<IActionResult> GetAuthUrl()
    {
        var url = await _spotifyService.GetAuthorizationUrl();
        return Ok(new { url });
    }

    [HttpGet("status")]
    public IActionResult GetStatus([FromServices] IConfiguration config)
    {
        var redirectUri = config["Spotify:RedirectUri"];
        return Ok(new
        {
            authenticated = _spotifyService.IsAuthenticated,
            redirectUri  // shows what's configured so you can verify it matches the dashboard
        });
    }

    [HttpGet("callback")]
    public async Task<IActionResult> Callback([FromQuery] string code)
    {
        var success = await _spotifyService.HandleCallback(code);
        if (!success)
            return BadRequest("Failed to authenticate with Spotify");

        // Redirect back to the frontend — it will detect auth success via /api/spotify/status
        return Redirect("http://localhost:5173/?spotify=authenticated");
    }

    [HttpGet("playlist/{playlistId}")]
    public async Task<IActionResult> GetPlaylist(string playlistId)
    {
        try
        {
            var songs = await _spotifyService.GetPlaylistTracks(playlistId);
            return Ok(songs);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
}
