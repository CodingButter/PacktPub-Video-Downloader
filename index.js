#!/usr/bin/env node

require('dotenv').config();
const path = require('path');
const { program } = require('commander');
const inquirer = require('inquirer');
const chalk = require('chalk');
const ora = require('ora');
const { closeBrowser } = require('./src/utils/browser');
const login = require('./src/modules/Login');
const getPlaylistLink = require('./src/modules/PlaylistLink');
const Playlist = require('./src/modules/Playlist');
const CourseBuilder = require('./src/modules/CourseBuilder');

// Package version from package.json
const { version } = require('./package.json');

// Banner
console.log(chalk.cyan(`
╔═════════════════════════════════════════════╗
║                                             ║
║   🎓 Packt Publishing Video Downloader 🎓    ║
║                                             ║
╚═════════════════════════════════════════════╝
`));

console.log(chalk.blue(`Version: ${version}\n`));

// Set up CLI options
program
  .version(version)
  .description('Download Packt Publishing video courses from your playlists')
  .option('-e, --email <email>', 'Your Packt account email')
  .option('-p, --password <password>', 'Your Packt account password')
  .option('-d, --directory <path>', 'Directory to save courses (default: current directory)', process.cwd())
  .option('-i, --playlist-id <id>', 'Playlist ID(s) (comma-separated for multiple)')
  .option('--show-browser', 'Show browser during the process')
  .option('--no-stealth', 'Disable stealth mode')
  .parse(process.argv);

// Main execution function
async function main() {
  // Get options from CLI arguments
  const options = program.opts();
  
  // Get credentials from arguments, env, or prompt
  const credentials = await getCredentials(options);
  
  // Get playlist names
  const playlists = await getPlaylists(options);
  
  // Get output directory
  const outputDir = await getOutputDirectory(options);
  
  // Browser options
  const showBrowser = options.showBrowser || process.env.WATCH === 'true';
  
  // Save browser options globally but DO NOT launch here
  // The browser will be launched on-demand in the ./utils/browser.js module
  global.browserOptions = {
    headless: false, // Always use non-headless mode for reliability
    slowMo: 50, // Slow down operations by 50ms to appear more human-like
    defaultViewport: { width: 1280, height: 800 }, // Use a standard viewport size
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-features=site-per-process',
      '--disable-web-security',
      '--disable-blink-features=AutomationControlled', // Hide automation flags
      '--window-size=1280,800'
    ]
  };
  
  // Set user agent to a common browser
  global.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  
  // Initialize spinner
  const spinner = ora('Starting the process').start();
  
  try {
    // Login to Packt account
    spinner.text = 'Logging in to Packt account...';
    const { success, page, message } = await login(credentials.email, credentials.password);
    
    if (!success) {
      spinner.fail(`Login failed: ${message}`);
      process.exit(1);
    }
    
    spinner.succeed('Logged in successfully.');
    
    // Process each playlist
    for (const playlistId of playlists) {
      spinner.start(`Accessing playlist with ID: ${playlistId}`);
      
      // Get playlist link
      const playlistLink = await getPlaylistLink(page, playlistId);
      
      if (!playlistLink) {
        spinner.fail(`Could not access playlist with ID: ${playlistId}`);
        continue;
      }
      
      spinner.succeed(`Successfully accessed playlist: ${playlistId}`);
      
      // Create playlist instance
      const playlist = new Playlist(page, playlistLink);
      
      // Get courses from playlist
      spinner.start('Retrieving courses from playlist...');
      const courseLinks = await playlist.getCourses();
      
      if (courseLinks.length === 0) {
        spinner.fail('No courses found in the playlist.');
        continue;
      }
      
      spinner.succeed(`Found ${courseLinks.length} courses in the playlist.`);
      
      // Get course details
      spinner.start('Retrieving course details and videos...');
      await playlist.getCourseDetails();
      spinner.succeed('Successfully retrieved all course details.');
      
      // Download each course
      for (const course of playlist.courses) {
        if (!course || !course.courseDetails || !course.courseDetails.title) {
          console.log(chalk.yellow('⚠️ Skipping course with missing details.'));
          continue;
        }
        
        console.log(chalk.blue(`\n📀 Processing course: ${course.courseDetails.title}`));
        
        // Create course builder and build course
        const courseBuilder = new CourseBuilder(course, outputDir);
        await courseBuilder.buildCourse();
      }
    }
    
    console.log(chalk.green('\n✅ All done! Courses have been downloaded.'));
    console.log(chalk.blue(`📂 Output directory: ${outputDir}`));
  } catch (error) {
    spinner.fail(`An error occurred: ${error.message}`);
    console.error(chalk.red(error.stack));
  } finally {
    // Close browser
    await closeBrowser();
  }
}

/**
 * Get user credentials from CLI arguments, env vars, or interactive prompt
 * @param {Object} options - Command line options
 * @returns {Promise<{email: string, password: string}>} User credentials
 */
async function getCredentials(options) {
  // Check CLI arguments
  const email = options.email;
  const password = options.password;
  
  // Check env vars if not provided in CLI
  const envEmail = process.env.PACKT_EMAIL;
  const envPassword = process.env.PACKT_PASSWORD;
  
  // If both email and password are provided (from CLI or env), return them
  if ((email && password) || (envEmail && envPassword)) {
    return {
      email: email || envEmail,
      password: password || envPassword
    };
  }
  
  // Otherwise, prompt for missing credentials
  const questions = [];
  
  if (!email && !envEmail) {
    questions.push({
      type: 'input',
      name: 'email',
      message: 'Enter your Packt account email:',
      validate: input => input.includes('@') ? true : 'Please enter a valid email'
    });
  }
  
  if (!password && !envPassword) {
    questions.push({
      type: 'password',
      name: 'password',
      message: 'Enter your Packt account password:',
      mask: '*',
      validate: input => input.length > 0 ? true : 'Password cannot be empty'
    });
  }
  
  // Prompt for missing credentials
  const answers = await inquirer.prompt(questions);
  
  // Return credentials (from CLI, env, or prompt)
  return {
    email: email || envEmail || answers.email,
    password: password || envPassword || answers.password
  };
}

/**
 * Get playlist IDs from CLI arguments, env vars, or interactive prompt
 * @param {Object} options - Command line options
 * @returns {Promise<string[]>} Array of playlist IDs
 */
async function getPlaylists(options) {
  // Check CLI arguments
  const playlistIdOption = options.playlistId;
  
  // Check env vars if not provided in CLI
  const envPlaylistIds = process.env.PACKT_PLAYLIST_IDS;
  
  // If playlist IDs are provided (from CLI or env), return them
  if (playlistIdOption || envPlaylistIds) {
    const playlistIdsStr = playlistIdOption || envPlaylistIds;
    return playlistIdsStr.split(',').map(id => id.trim());
  }
  
  // Otherwise, prompt for playlist IDs
  const { playlistIds } = await inquirer.prompt([
    {
      type: 'input',
      name: 'playlistIds',
      message: 'Enter playlist ID(s) (comma-separated for multiple):',
      validate: input => {
        if (input.length === 0) return 'Please enter at least one playlist ID';
        
        // Check if input contains only digits and commas
        const isValid = /^[0-9,\s]+$/.test(input);
        if (!isValid) return 'Playlist IDs should be numeric (e.g., 12345 or 12345,67890)';
        
        return true;
      }
    }
  ]);
  
  return playlistIds.split(',').map(id => id.trim());
}

/**
 * Get output directory from CLI arguments, env vars, or interactive prompt
 * @param {Object} options - Command line options
 * @returns {Promise<string>} Output directory path
 */
async function getOutputDirectory(options) {
  // Check CLI arguments
  const dirOption = options.directory;
  
  // Check env vars if not provided in CLI
  const envDir = process.env.OUTPUT_DIRECTORY;
  
  // If directory is provided (from CLI or env), return it
  if (dirOption || envDir) {
    return dirOption || envDir;
  }
  
  // Otherwise, prompt for directory
  const { directory } = await inquirer.prompt([
    {
      type: 'input',
      name: 'directory',
      message: 'Enter the directory to save courses:',
      default: process.cwd(),
      validate: input => {
        // Basic validation to ensure path is not empty
        return input.length > 0 ? true : 'Please enter a valid directory path';
      }
    }
  ]);
  
  return directory;
}

// Run the main function
main().catch(error => {
  console.error(chalk.red(`Fatal error: ${error.message}`));
  console.error(error.stack);
  process.exit(1);
});