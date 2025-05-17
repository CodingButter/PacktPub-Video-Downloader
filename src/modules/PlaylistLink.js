const chalk = require('chalk');

// Constants for selectors from recording
const PLAYLISTS_URL = 'https://subscription.packtpub.com/playlists';
// Using exact selector from example_recording.json (line 235)
const PLAYLIST_MENU_SELECTOR = 'div.ml-auto a:nth-of-type(2), [aria-label="Icon Playlists"], div.ml-auto [href*="playlists"]';
// Using exact selector from example_recording.json (line 259)
const PLAYLIST_SELECTOR = 'div.listing-component img, div.panel.panel-default.panel-playlist a, .card a';

/**
 * Get the URL for a specific playlist
 * @param {Page} page - Puppeteer page object
 * @param {string} playlistName - Name of the playlist to find
 * @returns {Promise<string|null>} Playlist URL or null if not found
 */
/**
 * Get the direct URL for a playlist using its ID
 * @param {Page} page - Puppeteer page object
 * @param {string} playlistId - ID of the playlist (numeric ID from the URL)
 * @returns {Promise<string|null>} Playlist URL or null if not found
 */
async function getPlaylistLink(page, playlistId) {
  console.log(chalk.blue(`\n🔍 Accessing playlist with ID: ${playlistId}`));
  
  try {
    // Construct the direct playlist URL
    const playlistUrl = `https://subscription.packtpub.com/playlists/${playlistId}`;
    console.log(chalk.blue(`🌐 Navigating directly to: ${playlistUrl}`));
    
    // Navigate directly to the playlist URL
    await page.goto(playlistUrl, { waitUntil: 'networkidle2' });
    
    // Wait for the page to load
    console.log(chalk.blue('⏱️ Waiting for playlist page to load...'));
    
    // Wait for specific elements that indicate the playlist page has loaded
    await Promise.race([
      page.waitForSelector('.title, h1, .course-title', { timeout: 10000 }).catch(() => {}),
      page.waitForSelector('.course-listing, .course-item, .card', { timeout: 10000 }).catch(() => {}),
      page.waitForTimeout(5000) // Fallback timeout
    ]);
    
    // Log playlist page load completion
    console.log(chalk.blue('✅ Playlist page loaded successfully'));
    
    // Verify we're on the correct page by checking the URL
    const currentUrl = await page.url();
    if (!currentUrl.includes(`playlists/${playlistId}`)) {
      console.log(chalk.yellow(`⚠️ Warning: Current URL (${currentUrl}) doesn't match expected playlist URL.`));
      
      // Check if we got redirected to login page
      if (currentUrl.includes('login')) {
        console.log(chalk.red('❌ Redirected to login page. Please check your credentials.'));
        return null;
      }
    }
    
    // Get the page title to verify we're on a playlist page
    const pageTitle = await page.title();
    console.log(chalk.blue(`📄 Page title: ${pageTitle}`));
    
    // Check if the page has course elements
    const hasCourses = await page.evaluate(() => {
      const courseElements = document.querySelectorAll('.course-item, .card, a[href*="course"], a[href*="book"]');
      return {
        count: courseElements.length,
        titles: Array.from(courseElements).map(el => el.textContent.trim() || 'Untitled').slice(0, 3)
      };
    });
    
    if (hasCourses.count > 0) {
      console.log(chalk.green(`✅ Found ${hasCourses.count} potential courses in playlist`));
      console.log(chalk.blue(`📚 First few courses: ${hasCourses.titles.join(', ')}`));
      
      // Return the current URL which is now the direct playlist URL
      return currentUrl;
    } else {
      console.log(chalk.yellow('⚠️ No courses found on the playlist page. Taking a detailed snapshot...'));
      
      // Get more detailed page info for debugging
      const pageInfo = await page.evaluate(() => {
        return {
          title: document.title,
          url: window.location.href,
          bodyText: document.body.innerText.substring(0, 200) + '...',
          links: Array.from(document.querySelectorAll('a')).map(a => ({
            text: a.innerText.trim(),
            href: a.href
          })).slice(0, 5)
        };
      });
      
      console.log(chalk.yellow(`📊 Page info: ${JSON.stringify(pageInfo, null, 2)}`));
      
      // Return the current URL despite not finding courses
      console.log(chalk.yellow('⚠️ Continuing with current URL despite not finding courses.'));
      return currentUrl;
    }
  } catch (error) {
    console.error(chalk.red(`❌ Error accessing playlist: ${error.message}`));
    // Log detailed error information
    console.error(chalk.red(`❌ Detailed error: ${error.stack || 'No stack trace available'}`));
    return null;
  }
}

module.exports = getPlaylistLink;