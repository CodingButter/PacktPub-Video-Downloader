// src/automation.ts
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { Browser, Page } from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { PlaylistItem, VideoDetails } from './types'; // Added VideoDetails

puppeteer.use(StealthPlugin());

export interface BrowserContext {
  browser: Browser;
  page: Page;
}

const screenshotsDir = path.resolve(__dirname, '../../screenshots');
const COMMON_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36';

function ensureScreenshotsDirExists() {
  if (process.env.NODE_ENV === 'development') {
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
      console.log(`Created screenshots directory (development mode): ${screenshotsDir}`);
    }
  }
}

export async function initializeBrowser(watchBrowser: boolean = false): Promise<BrowserContext> {
  ensureScreenshotsDirExists();
  const chromiumPath = '/usr/bin/chromium';
  console.log(`Initializing browser using executable: ${chromiumPath}`);
  let effectiveHeadless: boolean;
  let modeDescription: string;
  const isDisplayAvailable = !!process.env.DISPLAY && process.env.DISPLAY.trim() !== '';

  if (!isDisplayAvailable) {
    console.log('No X display server available. Forcing headless mode.');
    effectiveHeadless = true;
    modeDescription = 'forced headless';
  } else {
    effectiveHeadless = !watchBrowser;
    modeDescription = effectiveHeadless ? 'headless' : 'headful';
  }
  console.log(`Attempting to launch in ${modeDescription} mode...`);

  const defaultArgs = ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'];
  const launchArgs = !effectiveHeadless ? defaultArgs.concat(['--start-maximized']) : defaultArgs;

  try {
    const browser = await puppeteer.launch({
      executablePath: chromiumPath,
      headless: effectiveHeadless,
      args: launchArgs,
    });
    const page = await browser.newPage();
    await page.setUserAgent(COMMON_USER_AGENT);
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' });
    await page.setViewport({ width: 1920, height: 1080 });
    page.setDefaultNavigationTimeout(60000);
    page.setDefaultTimeout(30000);
    console.log(`Browser initialized successfully in ${modeDescription} mode.`);
    return { browser, page };
  } catch (error) {
    console.error(`Error initializing browser in ${modeDescription} mode:`, error);
    throw new Error(`Failed to initialize browser (${modeDescription}). Error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function closeBrowser(browser: Browser): Promise<void> {
  if (!browser) return;
  console.log('Closing browser...');
  try {
    await browser.close();
    console.log('Browser closed successfully.');
  } catch (error) {
    console.error('Error closing browser:', error);
  }
}

export async function loginToWebsite(page: Page, email: string, password: string, loginUrl: string): Promise<void> {
  console.log(`Attempting to log in as ${email} to ${loginUrl}...`);
  if (!email || !password) throw new Error('Email and password are required.');

  try {
    console.log(`Navigating to login page: ${loginUrl} (waiting for networkidle0)`);
    await page.goto(loginUrl, { waitUntil: 'networkidle0' });
    console.log('Login page loaded.');

    if (process.env.NODE_ENV === 'development') {
      const ts = Date.now();
      await page.screenshot({ path: path.join(screenshotsDir, `login_page_idle_${ts}.png`), fullPage: true });
      console.log(`Initial page screenshot saved (dev mode).`);
      fs.writeFileSync(path.resolve(__dirname, '../../tmp_login_page.html'), await page.content());
      console.log(`HTML content saved (dev mode).`);
    }

    const emailSelector = '#login-input-email';
    const passwordSelector = '#login-input-password';
    const loginButtonSelector = 'form[name="sign-in-form"] button[type="submit"]'; // More specific button selector

    await page.waitForSelector(emailSelector, { visible: true });
    await page.type(emailSelector, email, { delay: 100 });
    console.log('Email entered.');
    if (process.env.NODE_ENV === 'development') {
      await page.screenshot({ path: path.join(screenshotsDir, `login_after_email_${Date.now()}.png`), fullPage: true });
      console.log(`Screenshot after email (dev mode).`);
    }

    await page.waitForSelector(passwordSelector, { visible: true });
    await page.type(passwordSelector, password, { delay: 100 });
    console.log('Password entered.');
    if (process.env.NODE_ENV === 'development') {
      await page.screenshot({ path: path.join(screenshotsDir, `login_after_password_${Date.now()}.png`), fullPage: true });
      console.log(`Screenshot after password (dev mode).`);
    }

    await page.waitForSelector(loginButtonSelector, { visible: true });
    await page.click(loginButtonSelector);
    console.log('Login button clicked.');

    console.log('Waiting for navigation after login (networkidle0)...');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    console.log('Navigation complete after login.');

    const postLoginSelector = '[data-testid="avatar-button-desktop"], a[href*="/account"], .user-avatar, #dashboard';
    await page.waitForSelector(postLoginSelector, { visible: true, timeout: 20000 });
    console.log('Login appears successful (post-login element found).');

  } catch (error) {
    console.error('Login failed:', error);
    if (process.env.NODE_ENV === 'development' && page) {
      try {
        await page.screenshot({ path: path.join(screenshotsDir, `login_failure_${Date.now()}.png`), fullPage: true });
        console.log(`Screenshot on login failure (dev mode).`);
      } catch (ssError) { console.error('Failed to take screenshot on login failure:', ssError); }
    }
    if (error instanceof Error && error.message.includes('CAPTCHA')) {
      throw new Error('Login failed: CAPTCHA detected.');
    }
    throw new Error(`Login failed. Error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Navigates to the specified playlist page and waits for content to load.
 * @param page The Puppeteer page instance.
 * @param playlistUrl The URL of the playlist.
 * @returns The title of the playlist.
 */
export async function navigateToPlaylistAndExtractTitle(page: Page, playlistUrl: string): Promise<string> {
  console.log(`Navigating to playlist: ${playlistUrl}`);
  await page.goto(playlistUrl, { waitUntil: 'networkidle0' });
  console.log('Playlist page loaded.');

  // Selector for the playlist title based on packtpub_recording.json structure
  // Example: <h1 class="text-color-white text-2xl font-bold">Playlist Title Here</h1>
  const playlistTitleSelector = 'h1[class*="font-bold"][class*="text-2xl"]'; 
  await page.waitForSelector(playlistTitleSelector, { visible: true });
  const playlistTitle = await page.$eval(playlistTitleSelector, el => el.textContent?.trim() || 'Untitled Playlist');
  console.log(`Playlist title: ${playlistTitle}`);
  
  if (process.env.NODE_ENV === 'development') {
    await page.screenshot({ path: path.join(screenshotsDir, `playlist_page_${Date.now()}.png`), fullPage: true });
    console.log(`Screenshot of playlist page saved (dev mode).`);
  }
  return playlistTitle;
}

/**
 * Extracts all video items (title and page URL) from the current playlist page.
 * Relies on the structure observed in packtpub_recording.json.
 * @param page The Puppeteer page instance.
 * @returns A promise that resolves to an array of PlaylistItem.
 */
export async function extractPlaylistItems(page: Page): Promise<PlaylistItem[]> {
  console.log('Extracting video items from playlist...');
  // Based on packtpub_recording.json, video items seem to be within <a> tags with a specific structure.
  // A common parent for a list of videos: `div[role="list"]` or `ul` or a custom element.
  // Individual video link: `a[href*="/video/"]` inside a list item structure.
  // Title: Often a `h2`, `h3`, or `div` with specific classes within the `<a>` tag.
  // Selector for the video link items, adjust based on actual HTML structure from recording:
  const videoItemSelector = 'a[href*="/video/"][class*="flex"] div[class*="flex-col"] p[class*="font-semibold"]'; 

  await page.waitForSelector(videoItemSelector, { visible: true, timeout: 15000 });

  const items = await page.$$eval(videoItemSelector, (elements) => 
    elements.map((el, index) => {
      const title = el.textContent?.trim() || 'Untitled Video';
      // The `href` is on the parent `a` tag. We need to traverse up to get it.
      const linkElement = el.closest('a');
      const pageUrl = linkElement ? linkElement.href : '';
      return { title, pageUrl, order: index };
    })
  );

  console.log(`Found ${items.length} video items in the playlist.`);
  if (items.length === 0) {
    console.warn('No video items found. Check selectors or page content.');
    if (process.env.NODE_ENV === 'development') {
        const content = await page.content();
        fs.writeFileSync(path.join(__dirname, '../../tmp_playlist_page_no_videos.html'), content);
        console.log('Saved HTML of playlist page with no videos found (dev mode).');
    }
  }
  return items.filter(item => item.pageUrl); // Ensure only items with a URL are returned
}


/**
 * Navigates to a video page and extracts the direct video source URL.
 * Uses example_video_component.html as a guide for selectors.
 * @param page The Puppeteer page instance.
 * @param videoPageUrl The URL of the video page.
 * @returns A promise that resolves to the video source URL or null if not found.
 */
export async function extractVideoSourceUrl(page: Page, videoPageUrl: string): Promise<string | null> {
  console.log(`Navigating to video page: ${videoPageUrl}`);
  await page.goto(videoPageUrl, { waitUntil: 'networkidle0' });
  console.log('Video page loaded.');

  // Selector based on example_video_component.html: <video id="video-player_html5_api" ...>
  // Or potentially a <source> tag within the <video> tag: <source src="...">
  const videoPlayerSelector = 'video#video-player_html5_api, video source[src*=".mp4"]'; // Try video tag first, then source tag
  
  try {
    await page.waitForSelector(videoPlayerSelector, { visible: true, timeout: 20000 }); // Increased timeout
    const videoSourceUrl = await page.$eval(videoPlayerSelector, el => {
      if (el.tagName === 'VIDEO') {
        // Prefer the `src` attribute of the video tag itself if present
        const directSrc = el.getAttribute('src');
        if (directSrc && directSrc.includes('.mp4')) return directSrc;
        // Otherwise, look for a <source> child
        const sourceElement = el.querySelector('source[src*=".mp4"]');
        return sourceElement ? sourceElement.getAttribute('src') : null;
      }
      // If the selector directly matched a <source> tag
      return el.getAttribute('src');
    });

    if (videoSourceUrl) {
      console.log(`Found video source URL: ${videoSourceUrl}`);
      return videoSourceUrl;
    } else {
      console.warn('Video source URL not found on page using primary selectors.');
    }
  } catch (error) {
    console.warn(`Could not find video source using primary selectors on ${videoPageUrl}:`, error);
  }

  // Fallback: Look for JWPlayer setup script if primary selectors fail
  // This is a common pattern where video URLs are embedded in JavaScript
  console.log('Attempting fallback: Searching for video URL in page scripts (e.g., JWPlayer setup)...');
  try {
    const pageContent = await page.content();
    // Regex to find URLs ending in .mp4 within script tags or relevant JSON structures
    // This regex is broad and might need refinement based on actual script content.
    const mp4UrlRegex = /https?:\/\/[^"'\s]+\.mp4/g;
    let match;
    const foundUrls = new Set<string>();
    while ((match = mp4UrlRegex.exec(pageContent)) !== null) {
      foundUrls.add(match[0]);
    }

    if (foundUrls.size > 0) {
        // Heuristic: often the longest URL or one with specific path segments is the correct one.
        // For now, just take the first one found. This might need better logic.
        const bestGuessUrl = Array.from(foundUrls)[0]; 
        console.log(`Found potential video source URL via regex fallback: ${bestGuessUrl}`);
        return bestGuessUrl;
    }
    console.warn('Fallback regex search did not find any .mp4 URLs in page content.');
  } catch (scriptError) {
    console.error('Error during fallback script content search:', scriptError);
  }
  
  if (process.env.NODE_ENV === 'development') {
    await page.screenshot({ path: path.join(screenshotsDir, `video_page_no_source_${Date.now()}.png`), fullPage: true });
    fs.writeFileSync(path.join(__dirname, `../../tmp_video_page_content_${Date.now()}.html`), await page.content());
    console.log(`Screenshot and HTML of video page (no source found) saved (dev mode).`);
  }
  return null;
}
