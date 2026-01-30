namespace JakaToMelodiaBackend.Models;

public class Player
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Name { get; set; } = string.Empty;
    public string ConnectionId { get; set; } = string.Empty;
    public int Score { get; set; } = 0;
    public bool IsHost { get; set; } = false;
}
