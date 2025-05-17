#!/usr/bin/env node
// src/index.ts

import { loadConfig } from './config';
import { Config } from './types';
import { initializeBrowser, closeBrowser, loginToWebsite, BrowserContext } from './automation'; // Added loginToWebsite and BrowserContext
// import { downloadContent } from './downloader'; // Placeholder for download functions
// import { generateInterface } from './interface'; // Placeholder for interface generation
// import { loadCache, saveCache } from './cache'; // Placeholder for cache functions

/**
 * Main application function.
 * Orchestrates the process of downloading course content.
 */
async function main() {
  console.log('Starting the course downloader...');

  let config: Config;
  try {
    config = loadConfig();
    console.log('Configuration loaded successfully:',
      {
        email: config.email ? '********' : undefined, // Mask email for logging
        // password: config.password ? '********' : undefined, // Password is sent directly to login, not stored in config object after load if not needed elsewhere
        playlistIds: config.playlistIds,
        outputDirectory: config.outputDirectory,
        watchBrowser: config.watchBrowser
      }
    );
  } catch (error) {
    if (error instanceof Error) {
        console.error(`Error loading configuration: ${error.message}`);
    } else {
        console.error('An unknown error occurred while loading configuration.');
    }
    process.exit(1);
  }

  let browserContext: BrowserContext | undefined;

  try {
    // Initialize browser
    browserContext = await initializeBrowser(config.watchBrowser);
    const { page, browser } = browserContext; // Destructure for convenience

    // Step 1: Login to the website
    if (config.email && config.password) {
      // The Packt login URL is static
      const packtLoginUrl = 'https://subscription.packtpub.com/login';
      await loginToWebsite(page, config.email, config.password, packtLoginUrl);
      console.log('Login attempt finished.');
    } else {
      console.warn('Email or password not provided in config. Skipping login.');
      // Depending on website structure, some operations might be possible without login
      // For Packt, login is likely essential for accessing playlists/courses
    }

    // Load cache
    // const cache = await loadCache(config.outputDirectory);

    // Step 2: Extract content information (video/document URLs, titles, etc.)
    // This would involve navigating to playlists, individual course pages, etc.
    // const extractedContent = await extractData(page, config, cache);

    // Step 3: Update cache with new findings
    // await saveCache(config.outputDirectory, updatedCache);

    // Step 4: Download new or pending content
    // await downloadContent(extractedContent, config, cache /* or pass updateCacheCb */);

    // Step 5: Generate local HTML interface
    // await generateInterface(config.outputDirectory, cache /* or downloaded items list */);

    console.log('Course content processing complete (or reached end of implemented steps)!');
  } catch (error) {
    if (error instanceof Error) {
        console.error(`An error occurred during the process: ${error.message}`);
    } else {
        console.error('An unknown error occurred during the process.');
    }
  } finally {
    // Close browser
    if (browserContext) {
      await closeBrowser(browserContext.browser);
    }
    console.log('Exiting application.');
  }
}

// Run the main application
main().catch(error => {
  if (error instanceof Error) {
    console.error(`Unhandled error in main: ${error.message}`);
  } else {
    console.error('An unknown unhandled error occurred in main.');
  }
  process.exit(1);
});
