"use strict";
// src/config.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadConfig = loadConfig;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
/**
 * Loads and validates the application configuration from environment variables.
 *
 * It first loads variables from a .env file in the project root (updated_project),
 * then processes them into a structured Config object.
 *
 * @returns {Config} The application configuration object.
 * @throws {Error} If required environment variables are missing or invalid.
 */
function loadConfig() {
    var _a;
    // Corrected path: from src, go up one level to updated_project, then find .env
    const envPath = path_1.default.resolve(__dirname, '../.env');
    console.log(`Attempting to load .env file from: ${envPath}`);
    const result = dotenv_1.default.config({ path: envPath, debug: true, encoding: 'utf8' });
    if (result.error) {
        console.error('Error loading .env file:', result.error);
        throw new Error(`Failed to load .env file: ${result.error.message}`);
    }
    console.log('dotenv parsed values:', result.parsed);
    const packtEmail = process.env.PACKT_EMAIL;
    const packtPassword = process.env.PACKT_PASSWORD;
    const playlistIdsRaw = process.env.PACKT_PLAYLIST_IDS;
    const outputDirectory = process.env.OUTPUT_DIRECTORY || './downloads';
    const watchBrowserEnv = (_a = process.env.WATCH) === null || _a === void 0 ? void 0 : _a.toLowerCase();
    console.log(`PACKT_EMAIL from process.env: ${packtEmail}`);
    console.log(`PACKT_PASSWORD from process.env: ${packtPassword ? '********' : undefined}`);
    if (!packtEmail) {
        throw new Error('Missing required environment variable: PACKT_EMAIL');
    }
    if (!packtPassword) {
        throw new Error('Missing required environment variable: PACKT_PASSWORD');
    }
    let playlistIds = undefined;
    if (playlistIdsRaw && playlistIdsRaw.trim() !== '') {
        playlistIds = playlistIdsRaw.split(',').map(id => id.trim()).filter(id => id !== '');
        if (playlistIds.length === 0) {
            playlistIds = undefined;
        }
    }
    else {
        console.warn('PACKT_PLAYLIST_IDS is not set. The tool may attempt to find all playlists or prompt the user.');
    }
    const watchBrowser = watchBrowserEnv === 'true';
    const config = {
        email: packtEmail,
        password: packtPassword,
        playlistIds: playlistIds,
        outputDirectory: path_1.default.resolve(outputDirectory),
        watchBrowser: watchBrowser,
    };
    return config;
}
