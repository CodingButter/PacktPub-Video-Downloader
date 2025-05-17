// src/downloader.ts
import { VideoDetails } from './types';
import fs from 'fs';
import path from 'path';

/**
 * (Simulated) Downloads a video.
 * In a real implementation, this would use a library like axios or node-fetch to download the file.
 * It would also handle file naming, retries, progress reporting, etc.
 *
 * @param {VideoDetails} videoDetails - The details of the video to download.
 * @param {string} downloadDirectory - The directory where the video should be saved.
 * @returns {Promise<void>}
 */
export async function downloadVideo(videoDetails: VideoDetails, downloadDirectory: string): Promise<void> {
  if (!videoDetails.sourceUrl) {
    console.error(`Skipping download for "${videoDetails.title}": No source URL found.`);
    return;
  }

  const playlistDir = path.join(downloadDirectory, sanitizeFilename(videoDetails.playlistTitle));
  if (!fs.existsSync(playlistDir)) {
    fs.mkdirSync(playlistDir, { recursive: true });
    console.log(`Created directory: ${playlistDir}`);
  }

  // Sanitize title and ensure it's a valid filename
  const safeTitle = sanitizeFilename(videoDetails.title);
  // Create a filename like "01. Introduction to the Course.mp4"
  const filename = `${String(videoDetails.orderInPlaylist + 1).padStart(2, '0')}. ${safeTitle}.mp4`; // Assuming mp4, adjust if needed
  const filePath = path.join(playlistDir, filename);

  console.log(`Simulating download for: "${videoDetails.title}"`);
  console.log(`   Source URL: ${videoDetails.sourceUrl}`);
  console.log(`   Saving to: ${filePath}`);

  // --- Actual Download Logic (Placeholder) ---
  // In a real scenario, you would replace this with actual download code:
  // try {
  //   const response = await axios({
  //     method: 'GET',
  //     url: videoDetails.sourceUrl,
  //     responseType: 'stream',
  //   });
  //   const writer = fs.createWriteStream(filePath);
  //   response.data.pipe(writer);
  //   return new Promise((resolve, reject) => {
  //     writer.on('finish', () => {
  //       console.log(`Successfully downloaded "${filename}"`);
  //       resolve();
  //     });
  //     writer.on('error', (err) => {
  //       console.error(`Error downloading "${filename}":`, err);
  //       reject(err);
  //     });
  //   });
  // } catch (error) {
  //   console.error(`Failed to initiate download for "${filename}":`, error);
  //   throw error; // Or handle more gracefully
  // }
  // --- End of Actual Download Logic (Placeholder) ---

  // Simulate a delay for the download
  await new Promise(resolve => setTimeout(resolve, 1000)); 
  console.log(`(Simulated) Download complete for: "${filename}"`);
}

/**
 * Sanitizes a string to be used as a filename by removing or replacing invalid characters.
 * @param {string} input - The string to sanitize.
 * @returns {string} The sanitized string.
 */
function sanitizeFilename(input: string): string {
  if (!input) return 'untitled';
  return input
    .replace(/[<>:"\/\|?*\x00-\x1F]/g, '_') // Replace forbidden characters with underscores
    .replace(/\s+/g, ' ') // Replace multiple spaces with a single space
    .trim(); // Trim leading/trailing whitespace
}
