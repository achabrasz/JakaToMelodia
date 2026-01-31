using JakaToMelodiaBackend.Hubs;
using JakaToMelodiaBackend.Models;
using JakaToMelodiaBackend.Services;

var builder = WebApplication.CreateBuilder(args);

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
        policy.WithOrigins("http://localhost:5173") // Vite default port
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Add application services
builder.Services.AddSingleton<IGameService, GameService>();

// Use Mock Spotify Service (no API keys needed for development)
builder.Services.AddSingleton<ISpotifyService, MockSpotifyService>();

// Add YouTube service
builder.Services.AddHttpClient<IYouTubeService, YouTubeService>();

// For production with real Spotify API, uncomment this line and configure appsettings:
// builder.Services.AddSingleton<ISpotifyService, SpotifyService>();
// builder.Services.Configure<SpotifySettings>(builder.Configuration.GetSection("Spotify"));

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

