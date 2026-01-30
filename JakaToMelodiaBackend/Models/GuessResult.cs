namespace JakaToMelodiaBackend.Models;

public class GuessResult
{
    public bool IsCorrect { get; set; }
    public GuessType Type { get; set; }
    public int PointsAwarded { get; set; }
    public string PlayerName { get; set; } = string.Empty;
}

public enum GuessType
{
    None,
    Title,      // Full points
    Artist      // Half points
}
