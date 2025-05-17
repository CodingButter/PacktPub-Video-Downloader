const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');
const debug = require('debug')('packtpub:browser');

// Use default stealth plugin with all evasions enabled
puppeteer.use(StealthPlugin());

let browser = null;

/**
 * Find Chrome executable path based on platform
 * @returns {string|null} Path to Chrome executable
 */
function findChromePath() {
  const platform = process.platform;
  
  try {
    // For Linux
    if (platform === 'linux') {
      // Common Chrome paths on Linux
      const possiblePaths = [
        '/usr/bin/google-chrome',
        '/usr/bin/google-chrome-stable',
        '/usr/bin/chromium-browser',
        '/usr/bin/chromium',
        '/snap/bin/chromium',
        execSync('which google-chrome').toString().trim(),
        execSync('which chromium').toString().trim()
      ];
      
      for (const chromePath of possiblePaths) {
        if (fs.existsSync(chromePath)) {
          console.log(chalk.green(`✅ Found Chrome at: ${chromePath}`));
          return chromePath;
        }
      }
    }
    // For macOS
    else if (platform === 'darwin') {
      const macPath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
      if (fs.existsSync(macPath)) {
        return macPath;
      }
    }
    // For Windows
    else if (platform === 'win32') {
      const windowsPaths = [
        path.join(process.env.LOCALAPPDATA, 'Google\\Chrome\\Application\\chrome.exe'),
        path.join(process.env.ProgramFiles, 'Google\\Chrome\\Application\\chrome.exe'),
        path.join(process.env['ProgramFiles(x86)'], 'Google\\Chrome\\Application\\chrome.exe'),
      ];
      
      for (const chromePath of windowsPaths) {
        if (fs.existsSync(chromePath)) {
          return chromePath;
        }
      }
    }
  } catch (error) {
    console.error('Error finding Chrome path:', error.message);
  }
  
  return null;
}

/**
 * Get Chrome user data directory
 * @returns {string|null} Path to user data directory
 */
function getChromeUserDataDir() {
  // Create a new temporary user data directory
  const tempDir = path.join(process.cwd(), 'chrome-data');
  
  // Create the directory if it doesn't exist
  if (!fs.existsSync(tempDir)) {
    try {
      fs.mkdirSync(tempDir, { recursive: true });
      console.log(chalk.blue(`🔍 Created temporary Chrome profile directory: ${tempDir}`));
    } catch (error) {
      console.error(chalk.red(`❌ Failed to create temporary Chrome profile directory: ${error.message}`));
      return null;
    }
  }
  
  return tempDir;
}

/**
 * Get or create browser instance
 * @param {Object} options - Browser launch options (optional)
 * @returns {Promise<Browser>} Puppeteer browser instance
 */
async function getBrowser(options = {}) {
  if (browser === null) {
    // Try to find the Chrome executable path
    const chromePath = findChromePath();
    
    // Find the Chrome user data directory
    const userDataDir = getChromeUserDataDir();
    
    // Basic launch options - relying on stealth plugin for most anti-detection
    const defaultOptions = {
      headless: false, // Always use visible browser for CAPTCHA handling
      defaultViewport: null, // Let the window size be determined by the browser window
      ignoreHTTPSErrors: true, // Handle SSL issues gracefully
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled', // Critical for avoiding detection
        '--window-size=1920,1080',
        '--start-maximized',
        '--disable-notifications',
        '--disable-extensions',
        '--disable-infobars'
      ]
    };
    
    // Add Chrome executable path if found
    if (chromePath) {
      console.log(chalk.blue(`🔍 Using existing Chrome installation: ${chromePath}`));
      defaultOptions.executablePath = chromePath;
    }
    
    // Add user data directory if found
    if (userDataDir) {
      console.log(chalk.blue(`🔍 Using Chrome profile: ${userDataDir}`));
      defaultOptions.userDataDir = userDataDir;
    }
    
    // Merge defaults with global options and provided options
    const launchOptions = { ...defaultOptions, ...options };
    
    console.log(chalk.blue('🚀 Connecting to Chrome...'));
    
    try {
      browser = await puppeteer.launch(launchOptions);
      console.log(chalk.green('✅ Browser connection successful!'));
    } catch (error) {
      console.error(chalk.red(`❌ Failed to connect to Chrome: ${error.message}`));
      
      console.log(chalk.yellow('⚠️ Trying with minimal launch options...'));
      try {
        // Fallback to a simpler launch configuration
        browser = await puppeteer.launch({
          headless: false,
          args: ['--no-sandbox']
        });
        console.log(chalk.green('✅ Browser launched with minimal options!'));
      } catch (fallbackError) {
        console.error(chalk.red(`❌ Failed to launch browser: ${fallbackError.message}`));
        throw fallbackError;
      }
    }
    
    // Close browser on process exit
    process.on('exit', () => {
      if (browser) {
        browser.close().catch(err => {
          console.error('Error closing browser:', err);
        });
      }
    });
  }
  
  return browser;
}

/**
 * Create a new page with stealth and required settings
 * @returns {Promise<Page>} Puppeteer page instance
 */
async function newPage() {
  const browser = await getBrowser();
  
  // Get all existing pages
  const pages = await browser.pages();
  
  // Use existing page if available, otherwise create a new one
  let page;
  if (pages.length > 0) {
    page = pages[0];
    console.log('Using existing browser page');
    
    // Check if page is at about:blank and navigate away if needed
    const currentUrl = await page.url();
    if (currentUrl === 'about:blank') {
      try {
        // Navigate to a simple URL to get out of about:blank
        await page.goto('https://www.google.com', { 
          waitUntil: 'networkidle2',
          timeout: 10000 
        });
      } catch (error) {
        console.warn('Could not navigate away from about:blank:', error.message);
      }
    }
  } else {
    page = await browser.newPage();
    console.log('Created new browser page');
  }
  
  // Standard viewport settings - let the stealth plugin handle the rest
  await page.setViewport({
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
    hasTouch: false,
    isLandscape: true,
    isMobile: false
  });
  
  // Set longer navigation timeout for reliability
  page.setDefaultNavigationTimeout(90000); // 90 seconds
  
  // Set basic headers - stealth plugin will handle most of this
  await page.setExtraHTTPHeaders({
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Upgrade-Insecure-Requests': '1'
  });
  
  // CAPTCHA cookie handling for Packt Publishing
  await page.setCookie({
    name: 'OptanonAlertBoxClosed',
    value: new Date().toISOString(),
    domain: '.packtpub.com',
    path: '/',
  });
  
  // Add monitoring for debugging
  page.on('error', err => {
    console.error(chalk.red(`❌ Page error: ${err.message}`));
  });
  
  page.on('pageerror', err => {
    console.error(chalk.yellow(`⚠️ Page JavaScript error: ${err.message}`));
  });
  
  page.on('request', req => {
    debug(`Request: ${req.method()} ${req.url().substring(0, 100)}${req.url().length > 100 ? '...' : ''}`);
  });
  
  // Monitor for CAPTCHA or security challenges
  page.on('response', async (response) => {
    const url = response.url();
    const status = response.status();
    
    if (status === 403 || status === 429 || url.includes('captcha') || url.includes('challenge') || url.includes('security')) {
      console.log(chalk.red(`⚠️ Possible security challenge detected: ${status} ${url}`));
    }
  });
  
  return page;
}

/**
 * Close the browser instance if it exists
 */
async function closeBrowser() {
  if (browser) {
    await browser.close();
    browser = null;
  }
}

/**
 * Simple function to add random pauses to simulate human behavior
 * @param {Page} page - Puppeteer page object 
 * @param {number} min - Minimum pause in ms
 * @param {number} max - Maximum pause in ms
 */
async function humanPause(page, min = 300, max = 2000) {
  const delay = Math.floor(min + Math.random() * (max - min));
  await page.waitForTimeout(delay);
}

module.exports = {
  getBrowser,
  newPage,
  closeBrowser,
  humanPause
};