const { newPage, humanPause } = require('../utils/browser');
const chalk = require('chalk');

/**
 * Types text into a field with advanced human-like variations in typing speed and behavior
 * Designed to mimic natural typing patterns to avoid bot detection
 * @param {Page} page - Puppeteer page object
 * @param {string} selector - Element selector to type into
 * @param {string} text - Text to type
 */
async function humanLikeType(page, selector, text) {
  console.log(chalk.blue(`🖐️ Human-like typing into ${selector}...`));
  
  // First, make sure the element is visible and in view
  await page.waitForSelector(selector, { visible: true, timeout: 10000 });
  
  // Scroll element into view with natural, smooth behavior
  await page.evaluate((selector) => {
    const element = document.querySelector(selector);
    if (element) {
      // Smooth scroll with slight offset
      const rect = element.getBoundingClientRect();
      const targetY = window.scrollY + rect.top - 150; 
      window.scrollTo({
        top: targetY,
        behavior: 'smooth'
      });
    }
  }, selector);
  
  await humanPause(page, 100, 400);
  
  // First click to focus the field
  await page.click(selector, { delay: 50 + Math.random() * 100 });
  
  // Occasionally select all text before typing (70% chance)
  if (Math.random() < 0.7) {
    // Either triple-click or Ctrl+A to select all
    if (Math.random() < 0.5) {
      await page.click(selector, { clickCount: 3 });
    } else {
      await page.keyboard.down('Control');
      await page.keyboard.press('a');
      await page.keyboard.up('Control');
    }
    
    await humanPause(page, 50, 150);
    await page.keyboard.press('Backspace');
    await humanPause(page, 100, 300);
  }
  
  // Type the text with human-like timing
  for (let i = 0; i < text.length; i++) {
    // 0.5% chance of making a typo
    if (Math.random() < 0.005) {
      // Type a random character instead
      const randomChar = String.fromCharCode(97 + Math.floor(Math.random() * 26)); // a-z
      await page.keyboard.press(randomChar);
      await humanPause(page, 200, 400); // Pause before correcting
      
      // Delete the typo
      await page.keyboard.press('Backspace');
      await humanPause(page, 100, 200);
    }
    
    // Calculate human-like delay
    let delay;
    const char = text[i];
    
    // Longer delays at special characters
    if (char === ' ' || char === '.' || char === '@') {
      delay = 80 + Math.random() * 200; // 80-280ms
    } else if (Math.random() < 0.07) { // 7% chance of a thinking pause
      delay = 300 + Math.random() * 700; // 300-1000ms
    } else {
      delay = 40 + Math.random() * 100; // 40-140ms for regular chars
    }
    
    // Type the character with the calculated delay
    await page.keyboard.press(text[i], { delay });
    
    // Occasionally pause between characters (2% chance)
    if (Math.random() < 0.02) {
      await humanPause(page, 200, 600);
    }
  }
  
  // Sometimes move cursor away after typing
  if (Math.random() < 0.3) {
    await page.mouse.move(300 + Math.random() * 100, 100 + Math.random() * 100, { steps: 3 });
  }
}

// Constants for selectors based on the recording
const LOGIN_URL = 'https://www.packtpub.com/login';
const EMAIL_SELECTOR = '#inline-form-input-username';
const PASSWORD_SELECTOR = '#inline-form-input-password';
const LOGIN_BUTTON = 'button.login-page__main__container__login__form__button__login, button[class*="login"]';
const ERROR_ALERT = '.alert.alert-danger';

/**
 * Log in to Packt Publishing account
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {number} retryCount - Number of retry attempts (default: 0)
 * @returns {Promise<{success: boolean, page: Page, message: string}>} Success status and page object
 */
async function login(email, password, retryCount = 0) {
  console.log(chalk.blue('\n📘 Logging in to Packt Publishing...'));
  
  // Maximum retry attempts
  const MAX_RETRIES = 3;
  
  // Create a new page
  const page = await newPage();
  
  // Set a longer default timeout
  page.setDefaultNavigationTimeout(60000);
  
  try {
    // Navigate to login page
    await page.goto(LOGIN_URL, { waitUntil: 'networkidle2' });
    
    // Check if we're already logged in (check for user account link or similar)
    const alreadyLoggedIn = await page.evaluate(() => {
      return document.querySelector('.login-page__main__container__login__form__button__login') === null;
    });
    
    if (alreadyLoggedIn) {
      console.log(chalk.green('✅ Already logged in!'));
      return { success: true, page, message: 'Already logged in' };
    }
    
    // Wait for email field and enter email
    await page.waitForSelector(EMAIL_SELECTOR, { timeout: 10000 }).catch(() => {
      console.log(chalk.yellow('⚠️ Could not find email field. Site structure may have changed.'));
      // Log to console instead of taking screenshot
      console.log(chalk.yellow('⚠️ Login page structure may have changed.'));
    });
    
    // Click on the email field first (like a human would)
    await page.click(EMAIL_SELECTOR);
    
    // Type email with human-like delays
    await humanLikeType(page, EMAIL_SELECTOR, email);
    
    // Short pause after typing email (like a human switching fields)
    await page.waitForTimeout(300 + Math.random() * 400);
    
    // Click on password field
    await page.click(PASSWORD_SELECTOR);
    
    // Type password with human-like delays
    await humanLikeType(page, PASSWORD_SELECTOR, password);
    
    // Pause briefly before clicking login (like a human would)
    await page.waitForTimeout(500 + Math.random() * 300);
    
    // Click login button and wait for navigation
    await Promise.all([
      page.click(LOGIN_BUTTON, { delay: 50 }), // Slight delay on mouse button
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {
        console.log(chalk.yellow('⚠️ Navigation timeout after login - continuing anyway'));
      })
    ]);
    
    // Handle CAPTCHA or other challenges
    await handleLoginChallenges(page);
    
    // Try navigating to the main Packt site to check if we're logged in
    await page.goto('https://subscription.packtpub.com/playlists', { waitUntil: 'networkidle2' });
    
    // Check if login succeeded - look for common elements for a logged-in user
    const loginSucceeded = await page.evaluate(() => {
      // Check for various indicators that we're logged in
      const noLoginButton = document.querySelector('.login-page__main__container__login__form__button__login') === null;
      const hasUserMenu = document.querySelector('#user-menu') !== null || 
                         document.querySelector('a[href*="account"]') !== null ||
                         document.querySelector('a[href*="logout"]') !== null;
      const hasPlaylistElement = document.querySelector('.panel-playlist') !== null || 
                              document.querySelector('.card') !== null ||
                              document.querySelector('a[href*="playlist"]') !== null;
                              
      return noLoginButton || hasUserMenu || hasPlaylistElement;
    });
    
    if (loginSucceeded) {
      console.log(chalk.green('✅ Login successful!'));
      return { success: true, page, message: 'Login successful' };
    } else {
      // Check for error messages
      const errorMessage = await page.evaluate(() => {
        const errorEl = document.querySelector('.error-field, .alert-danger, .error-message');
        return errorEl ? errorEl.textContent.trim() : 'Unknown login error';
      });
      
      // Log error details
      console.log(chalk.red('❌ Login page validation failed'));
      
      console.log(chalk.red(`❌ Login failed: ${errorMessage}`));
      return { success: false, page, message: errorMessage };
    }
  } catch (error) {
    console.error(chalk.red(`❌ Login error: ${error.message}`));
    
    // If we haven't exceeded the maximum retries, try again
    if (retryCount < MAX_RETRIES) {
      console.log(chalk.yellow(`⚠️ Retrying login (attempt ${retryCount + 1}/${MAX_RETRIES})...`));
      await page.close();
      return login(email, password, retryCount + 1);
    }
    
    return { success: false, page, message: error.message };
  }
}

/**
 * Handle any login challenges like CAPTCHA
 * @param {Page} page - Puppeteer page
 */
async function handleLoginChallenges(page) {
  // Check for CAPTCHA
  const hasCaptcha = await page.evaluate(() => {
    // Check for various CAPTCHA selectors
    return (
      !!document.querySelector('.grecaptcha-badge, iframe[src*="recaptcha"]') ||
      !!document.querySelector('.g-recaptcha') ||
      !!document.querySelector('iframe[title*="recaptcha"]') ||
      !!document.querySelector('iframe[src*="captcha"]')
    );
  });
  
  if (hasCaptcha) {
    console.log(chalk.yellow('⚠️ CAPTCHA detected'));
    console.log(chalk.cyan('👉 Please solve the CAPTCHA in the Chrome window, then the script will continue'));
    
    // Wait for manual CAPTCHA solving
    const maxWaitTime = 120000; // 2 minutes
    const startTime = Date.now();
    let isCaptchaSolved = false;
    
    while (!isCaptchaSolved && Date.now() - startTime < maxWaitTime) {
      await page.waitForTimeout(2000); // Check every 2 seconds
      
      // Check if we're logged in now
      const isLoggedIn = await page.evaluate(() => {
        // Check various success indicators
        return (
          // URL changed away from login
          !window.location.href.includes('login') ||
          // Login success elements present
          !!document.querySelector('a[href*="account"]') || 
          !!document.querySelector('a[href*="logout"]') ||
          !!document.querySelector('.user-menu') ||
          // Error messages gone
          document.querySelectorAll('.alert-danger, .error-message').length === 0
        );
      });
      
      if (isLoggedIn) {
        console.log(chalk.green('✅ CAPTCHA solved successfully'));
        isCaptchaSolved = true;
        break;
      }
      
      // Print countdown every 15 seconds
      const timeElapsed = Math.floor((Date.now() - startTime) / 1000);
      if (timeElapsed % 15 === 0) {
        const timeRemaining = Math.floor((maxWaitTime - (Date.now() - startTime)) / 1000);
        console.log(chalk.yellow(`⏱️ Waiting for CAPTCHA solution... ${timeRemaining} seconds remaining`));
      }
    }
    
    if (!isCaptchaSolved) {
      throw new Error('CAPTCHA could not be solved within the time limit');
    }
    
    // Give a moment for redirects to complete
    await humanPause(page, 1000, 2000);
  }
}

module.exports = login;