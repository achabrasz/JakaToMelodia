# YouTube API Integration Guide

## Overview
The application now supports both **Spotify** and **YouTube** as music sources. Users can choose their preferred platform on the home screen when creating a room.

## What's Been Added

### Frontend Changes

1. **HomePage (`Frontend/src/pages/HomePage.tsx`)**
   - Added music source selector with buttons for Spotify and YouTube
   - Users can now choose between platforms before creating a room
   - The selected source is passed to the backend when creating a room

2. **Types (`Frontend/src/types/index.ts`)**
   - Added `MusicSource` constant object with Spotify = 0, YouTube = 1
   - Added `musicSource` property to `GameRoom` interface
   - Converted enums to const objects for TypeScript compatibility

3. **GameStore (`Frontend/src/store/gameStore.ts`)**
   - Added `musicSource` state management
   - Added `setMusicSource` action

4. **PlaylistInput Component (`Frontend/src/components/PlaylistInput.tsx`)**
   - Now accepts `musicSource` prop
   - Displays appropriate placeholder and instructions based on selected platform
   - Shows YouTube or Spotify specific hints

5. **GameRoomPage (`Frontend/src/pages/GameRoomPage.tsx`)**
   - Conditionally uses YouTube or Spotify service based on room's music source
   - Passes `musicSource` to PlaylistInput component

6. **YouTube Service (`Frontend/src/services/youtubeService.ts`)**
   - New service for fetching YouTube playlist data
   - Uses YouTube Data API v3
   - Converts YouTube videos to Song format

7. **SignalR Service (`Frontend/src/services/signalRService.ts`)**
   - Updated `createRoom` to accept `musicSource` parameter

8. **CSS (`Frontend/src/pages/HomePage.css`)**
   - Added styles for music source selector buttons
   - Active state highlighting for selected source

### Backend Changes

1. **GameRoom Model (`JakaToMelodiaBackend/Models/GameRoom.cs`)**
   - Added `MusicSource` enum with Spotify = 0, YouTube = 1
   - Added `MusicSource` property to `GameRoom` class

2. **GameService (`JakaToMelodiaBackend/Services/GameService.cs`)**
   - Updated `CreateRoom` method to accept `MusicSource` parameter
   - Sets room's music source on creation

3. **GameHub (`JakaToMelodiaBackend/Hubs/GameHub.cs`)**
   - Updated `CreateRoom` hub method to accept `musicSource` parameter
   - Passes music source to GameService

4. **YouTube Service (`JakaToMelodiaBackend/Services/YouTubeService.cs`)**
   - New service implementing `IYouTubeService`
   - Fetches playlist data from YouTube Data API v3
   - Converts YouTube videos to Song models
   - Uses HttpClient for API calls

5. **Program.cs (`JakaToMelodiaBackend/Program.cs`)**
   - Registered `IYouTubeService` with dependency injection
   - Uses HttpClient factory for YouTube service

6. **Configuration Files**
   - `appsettings.json`: Added YouTube:ApiKey configuration
   - `appsettings.Development.json`: Added placeholder for YouTube API key

## How to Get YouTube API Key

Since Spotify API access is currently restricted, here's how to get a YouTube Data API key:

### Step 1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **YouTube Data API v3**:
   - Navigate to "APIs & Services" > "Library"
   - Search for "YouTube Data API v3"
   - Click "Enable"

### Step 2: Create API Credentials
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API Key"
3. Copy the generated API key
4. (Recommended) Restrict the API key:
   - Click "Edit API key"
   - Under "Application restrictions", select "HTTP referrers" or "IP addresses"
   - Under "API restrictions", select "Restrict key" and choose "YouTube Data API v3"

### Step 3: Configure the Application
1. Open `JakaToMelodiaBackend/appsettings.Development.json`
2. Replace `YOUR_YOUTUBE_API_KEY_HERE` with your actual API key:
   ```json
   {
     "YouTube": {
       "ApiKey": "YOUR_ACTUAL_API_KEY_HERE"
     }
   }
   ```

### Step 4 (Optional): Set Frontend YouTube API Key
If you want the frontend to directly call YouTube API (currently not required):
1. Create a `.env` file in the `Frontend` directory
2. Add: `VITE_YOUTUBE_API_KEY=your_api_key_here`
3. Update `youtubeService.ts` to use the environment variable

## Using the Application

### Creating a Room with YouTube
1. Open the application homepage
2. Enter your name
3. **Select "YouTube"** from the music source selector
4. Click "Create Room"
5. In the room, paste a YouTube playlist URL (e.g., `https://www.youtube.com/playlist?list=PLxxxxxxx`)
6. Click "Load Playlist"
7. Start the game!

### Creating a Room with Spotify
1. Open the application homepage
2. Enter your name
3. **Select "Spotify"** from the music source selector (default)
4. Click "Create Room"
5. In the room, paste a Spotify playlist URL
6. Click "Load Playlist"
7. Start the game!

## API Usage Notes

### YouTube Playlist URL Format
- Standard: `https://www.youtube.com/playlist?list=PLxxxxxxxxx`
- The backend extracts the playlist ID from the URL

### Current Limitations
1. **YouTube Preview**: YouTube doesn't provide direct audio preview URLs like Spotify
   - Currently returns full video URLs
   - Consider implementing a YouTube player component for playback
   - Or use a third-party service to extract audio

2. **API Quotas**: 
   - YouTube Data API has daily quotas (10,000 units/day for free tier)
   - Reading playlist items costs 1 unit per request
   - Monitor usage in Google Cloud Console

3. **Duration**: 
   - YouTube service currently sets a default 30-second duration
   - Can be enhanced to fetch actual video durations with additional API calls

## Recommended Enhancements

1. **YouTube Player Component**
   - Embed YouTube IFrame Player API for playback
   - Extract audio-only streams using youtube-dl or similar

2. **Playlist Validation**
   - Verify playlist exists before loading
   - Show error messages for invalid URLs

3. **Mixed Playlists**
   - Allow combining Spotify and YouTube songs in one game
   - Add source indicator to each song

4. **Audio Processing**
   - Use a service like Invidious API for direct audio streams
   - Implement server-side audio extraction

## Testing

### Test with Public YouTube Playlists
Here are some public playlists you can test with:
- Top Hits: `https://www.youtube.com/playlist?list=PLFgquLnL59alCl_2TQvOiD5Vgm1hCaGSI`
- Music: `https://www.youtube.com/playlist?list=PLrEnWoR732-BHrPp_Pm8_VleD68f9s14-`

### Verify Backend
1. Run the backend: `dotnet run` in JakaToMelodiaBackend
2. Backend should start on http://localhost:5000
3. Check Swagger UI at http://localhost:5000/swagger

### Verify Frontend
1. Run the frontend: `npm run dev` in Frontend folder
2. Frontend should start on http://localhost:5173
3. Create a room and test both Spotify and YouTube options

## Troubleshooting

### "Invalid API Key" Error
- Verify API key is correct in appsettings.Development.json
- Check API key restrictions in Google Cloud Console
- Ensure YouTube Data API v3 is enabled

### "Playlist Not Found"
- Verify the playlist is public
- Check the playlist URL format
- Ensure the playlist ID is correct

### CORS Issues
- Backend allows requests from http://localhost:5173
- Update CORS settings if using different frontend port

## Architecture Notes

The application now follows a plugin-like architecture for music services:
- `ISpotifyService` and `IYouTubeService` interfaces define the contract
- Services are registered in DI container
- GameHub doesn't need to know which service is used
- Easy to add more music sources (SoundCloud, Deezer, etc.)

## Files Modified
- ✅ Frontend/src/pages/HomePage.tsx
- ✅ Frontend/src/pages/HomePage.css
- ✅ Frontend/src/pages/GameRoomPage.tsx
- ✅ Frontend/src/components/PlaylistInput.tsx
- ✅ Frontend/src/services/signalRService.ts
- ✅ Frontend/src/services/youtubeService.ts (new)
- ✅ Frontend/src/store/gameStore.ts
- ✅ Frontend/src/types/index.ts
- ✅ JakaToMelodiaBackend/Models/GameRoom.cs
- ✅ JakaToMelodiaBackend/Services/GameService.cs
- ✅ JakaToMelodiaBackend/Services/YouTubeService.cs (new)
- ✅ JakaToMelodiaBackend/Hubs/GameHub.cs
- ✅ JakaToMelodiaBackend/Program.cs
- ✅ JakaToMelodiaBackend/appsettings.json
- ✅ JakaToMelodiaBackend/appsettings.Development.json
