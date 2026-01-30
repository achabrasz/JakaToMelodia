using JakaToMelodiaBackend.Services;
using Microsoft.AspNetCore.Mvc;

namespace JakaToMelodiaBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RoomController : ControllerBase
{
    private readonly IGameService _gameService;

    public RoomController(IGameService gameService)
    {
        _gameService = gameService;
    }

    [HttpGet("{roomCode}")]
    public IActionResult GetRoom(string roomCode)
    {
        var room = _gameService.GetRoom(roomCode);
        if (room == null)
            return NotFound();

        return Ok(room);
    }

    [HttpPost("cleanup")]
    public IActionResult CleanupRooms()
    {
        _gameService.CleanupInactiveRooms();
        return Ok();
    }
}
