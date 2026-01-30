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

    [HttpGet("callback")]
    public async Task<IActionResult> Callback([FromQuery] string code)
    {
        var success = await _spotifyService.HandleCallback(code);
        if (!success)
            return BadRequest("Failed to authenticate with Spotify");

        return Redirect("/");
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
