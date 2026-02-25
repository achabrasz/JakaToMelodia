using JakaToMelodiaBackend.Services;
using Microsoft.AspNetCore.Mvc;

namespace JakaToMelodiaBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SpotifyController : ControllerBase
{
    private readonly ISpotifyService _spotifyService;
    private readonly IConfiguration _config;

    public SpotifyController(ISpotifyService spotifyService, IConfiguration config)
    {
        _spotifyService = spotifyService;
        _config = config;
    }

    [HttpGet("auth")]
    public async Task<IActionResult> GetAuthUrl()
    {
        try
        {
            var url = await _spotifyService.GetAuthorizationUrl();
            return Ok(new { url });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }

    [HttpGet("status")]
    public IActionResult GetStatus()
    {
        var redirectUri = _config["Spotify:RedirectUri"];
        return Ok(new
        {
            authenticated = _spotifyService.IsAuthenticated,
            redirectUri
        });
    }

    [HttpGet("callback")]
    public async Task<IActionResult> Callback([FromQuery] string code)
    {
        var success = await _spotifyService.HandleCallback(code);
        if (!success)
            return BadRequest("Failed to authenticate with Spotify");

        // Redirect back to the frontend — read from AllowedOrigins so it works in prod too
        var frontendUrl = _config["AllowedOrigins"]?.Split(',').FirstOrDefault()?.Trim()
            ?? "http://localhost:5173";

        return Redirect($"{frontendUrl}/?spotify=authenticated");
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
