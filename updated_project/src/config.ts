// src/config.ts

import dotenv from 'dotenv';
import path from 'path';
import { Config } from './types';

/**
 * Loads and validates the application configuration from environment variables.
 * 
 * It first loads variables from a .env file in the project root (updated_project),
 * then processes them into a structured Config object.
 *
 * @returns {Config} The application configuration object.
 * @throws {Error} If required environment variables are missing or invalid.
 */
export function loadConfig(): Config {
  // Corrected path: from src, go up one level to updated_project, then find .env
  const envPath = path.resolve(__dirname, '../.env');
  console.log(`Attempting to load .env file from: ${envPath}`);

  const result = dotenv.config({ path: envPath, debug: true, encoding: 'utf8' });

  if (result.error) {
    console.error('Error loading .env file:', result.error);
    throw new Error(`Failed to load .env file: ${result.error.message}`);
  }

  console.log('dotenv parsed values:', result.parsed);

  const packtEmail = process.env.PACKT_EMAIL;
  const packtPassword = process.env.PACKT_PASSWORD;
  const playlistIdsRaw = process.env.PACKT_PLAYLIST_IDS;
  const outputDirectory = process.env.OUTPUT_DIRECTORY || './downloads';
  const watchBrowserEnv = process.env.WATCH?.toLowerCase();

  console.log(`PACKT_EMAIL from process.env: ${packtEmail}`);
  console.log(`PACKT_PASSWORD from process.env: ${packtPassword ? '********' : undefined}`);

  if (!packtEmail) {
    throw new Error('Missing required environment variable: PACKT_EMAIL');
  }

  if (!packtPassword) {
    throw new Error('Missing required environment variable: PACKT_PASSWORD');
  }

  let playlistIds: string[] | undefined = undefined;
  if (playlistIdsRaw && playlistIdsRaw.trim() !== '') {
    playlistIds = playlistIdsRaw.split(',').map(id => id.trim()).filter(id => id !== '');
    if (playlistIds.length === 0) {
        playlistIds = undefined; 
    }
  } else {
    console.warn('PACKT_PLAYLIST_IDS is not set. The tool may attempt to find all playlists or prompt the user.');
  }
  
  const watchBrowser = watchBrowserEnv === 'true';

  const config: Config = {
    email: packtEmail,
    password: packtPassword,
    playlistIds: playlistIds,
    outputDirectory: path.resolve(outputDirectory),
    watchBrowser: watchBrowser,
  };

  return config;
}
