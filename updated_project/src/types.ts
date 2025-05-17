// src/types.ts

/**
 * Represents the application configuration.
 */
export interface Config {
  email: string;
  pass: string;
  loginUrl: string;
  playlistsUrl: string;
  playlistName: string;
  downloadDirectory: string;
  watchBrowser: boolean; // true for headful, false for headless
  userDataDir?: string; // Optional: path to a user data directory for the browser
  // Add other configuration options as needed
}

/**
 * Represents details of a video to be downloaded.
 */
export interface VideoDetails {
  title: string;       // e.g., "1. Introduction to the Course"
  videoPageUrl: string; // URL of the page where the video player is located
  sourceUrl?: string;    // Direct URL of the video file (e.g., .mp4)
  playlistTitle: string; // Title of the playlist this video belongs to
  orderInPlaylist: number; // 0-based index of the video in the playlist
  // Add other video-specific details as needed (e.g., duration, section title)
}

/**
 * Represents the structure of an individual video item found on a playlist page.
 */
export interface PlaylistItem {
    title: string;
    pageUrl: string;
    order: number;
}
