using JakaToMelodiaBackend.Hubs;
using JakaToMelodiaBackend.Models;
using JakaToMelodiaBackend.Services;

// Default to Development locally if not explicitly set (e.g. running with plain `dotnet run`)
if (string.IsNullOrEmpty(Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT")))
    Environment.SetEnvironmentVariable("ASPNETCORE_ENVIRONMENT", "Development");

var builder = WebApplication.CreateBuilder(args);

// Render sets PORT — fall back to 8080 locally
var port = Environment.GetEnvironmentVariable("PORT") ?? "8080";
builder.WebHost.UseUrls($"http://0.0.0.0:{port}");

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Add SignalR
builder.Services.AddSignalR();

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        var allowedOrigins = builder.Configuration["AllowedOrigins"]
            ?.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            ?? ["http://localhost:5173", "http://127.0.0.1:5173"];

        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Add application services
builder.Services.AddSingleton<IGameService, GameService>();

// Configure Spotify settings and use real Spotify service
builder.Services.Configure<SpotifySettings>(builder.Configuration.GetSection("Spotify"));
builder.Services.AddHttpClient("Spotify");
builder.Services.AddSingleton<ISpotifyService, SpotifyService>();

// Add YouTube service
builder.Services.AddHttpClient<IYouTubeService, YouTubeService>();

// Pre-authenticate Spotify automatically on startup
builder.Services.AddHostedService<SpotifyStartupService>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowFrontend");

app.UseAuthorization();

app.MapControllers();
app.MapHub<GameHub>("/gameHub");

app.Run();

// Hosted service — blocks startup until Spotify is authenticated
public class SpotifyStartupService(
    ISpotifyService spotifyService,
    ILogger<SpotifyStartupService> logger,
    IHostApplicationLifetime lifetime) : IHostedService
{
    public async Task StartAsync(CancellationToken cancellationToken)
    {
        logger.LogInformation("SpotifyStartupService: pre-authenticating Spotify...");
        try
        {
            await spotifyService.InitializeAsync();
            if (spotifyService.IsAuthenticated)
                logger.LogInformation("Spotify pre-authentication successful.");
            else
                logger.LogWarning("Spotify not authenticated — set Spotify__RefreshToken env var or visit /api/spotify/auth.");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Spotify pre-authentication failed.");
        }
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
