import type { Song } from '../types';

class YouTubeService {
  private apiKey: string = ''; // Will be set from environment variable or config

  async getPlaylistTracks(playlistId: string): Promise<Song[]> {
    const songs: Song[] = [];
    
    try {
      // YouTube API endpoint for playlist items
      const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&key=${this.apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.items) {
        for (const item of data.items) {
          const videoId = item.snippet.resourceId.videoId;
          const title = item.snippet.title;
          const channelTitle = item.snippet.channelTitle;
          const thumbnail = item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url || '';
          
          songs.push({
            id: videoId,
            title: title,
            artist: channelTitle,
            previewUrl: `https://www.youtube.com/watch?v=${videoId}`,
            albumImageUrl: thumbnail,
            durationMs: 30000 // Default 30 seconds, could be fetched from video details
          });
        }
      }
    } catch (error) {
      console.error('Error fetching YouTube playlist:', error);
    }
    
    return songs;
  }

  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
  }
}

export const youtubeService = new YouTubeService();
