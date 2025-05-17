"use strict";
// src/automation.ts
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeBrowser = initializeBrowser;
exports.closeBrowser = closeBrowser;
exports.loginToWebsite = loginToWebsite;
const puppeteer_extra_1 = __importDefault(require("puppeteer-extra"));
const puppeteer_extra_plugin_stealth_1 = __importDefault(require("puppeteer-extra-plugin-stealth"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// puppeteer is the correct spelling no need to update this.
puppeteer_extra_1.default.use((0, puppeteer_extra_plugin_stealth_1.default)());
const screenshotsDir = path_1.default.resolve(__dirname, '../../screenshots');
const COMMON_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36';
/**
 * Ensures that the screenshots directory exists if in development mode.
 */
function ensureScreenshotsDirExists() {
    // Screenshots are only relevant in development mode when an error occurs
    if (process.env.NODE_ENV === 'development') {
        if (!fs_1.default.existsSync(screenshotsDir)) {
            fs_1.default.mkdirSync(screenshotsDir, { recursive: true });
            console.log(`Created screenshots directory (development mode): ${screenshotsDir}`);
        }
    }
}
/**
 * Initializes a new Puppeteer browser instance with stealth capabilities.
 * Uses system-installed Chromium via executablePath.
 * - Forces headless if no X display server is available (checks process.env.DISPLAY).
 * - Otherwise, respects the watchBrowser parameter from config.
 *
 * @param {boolean} [watchBrowser=false] - From config.watchBrowser (derived from .env WATCH).
 *                                         Determines headful/headless if a display server is available.
 * @returns {Promise<BrowserContext>} A promise that resolves to the browser instance and the main page.
 * @throws {Error} If the browser fails to launch.
 */
function initializeBrowser() {
    return __awaiter(this, arguments, void 0, function* (watchBrowser = false) {
        ensureScreenshotsDirExists();
        const chromiumPath = '/usr/bin/chromium';
        console.log(`Initializing browser using executable: ${chromiumPath}`);
        let effectiveHeadless;
        let modeDescription;
        const isDisplayAvailable = !!process.env.DISPLAY && process.env.DISPLAY.trim() !== '';
        if (!isDisplayAvailable) {
            console.log('No X display server available (DISPLAY environment variable is not set or empty). Forcing headless mode.');
            effectiveHeadless = true;
            modeDescription = 'forced headless (no display server)';
        }
        else {
            console.log(`X display server appears to be available (DISPLAY=${process.env.DISPLAY}). Respecting watchBrowser parameter (value: ${watchBrowser}).`);
            effectiveHeadless = !watchBrowser;
            modeDescription = effectiveHeadless ? 'headless (display available)' : 'headful (display available)';
        }
        console.log(`Attempting to launch in ${modeDescription}...`);
        const defaultArgs = [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu'
        ];
        const launchArgs = !effectiveHeadless ? defaultArgs.concat(['--start-maximized']) : defaultArgs;
        try {
            const browser = yield puppeteer_extra_1.default.launch({
                executablePath: chromiumPath,
                headless: effectiveHeadless,
                args: launchArgs,
            });
            const page = yield browser.newPage();
            // Set User-Agent and Accept-Language Headers
            yield page.setUserAgent(COMMON_USER_AGENT);
            yield page.setExtraHTTPHeaders({
                'Accept-Language': 'en-US,en;q=0.9'
            });
            yield page.setViewport({ width: 1920, height: 1080 });
            page.setDefaultNavigationTimeout(60000);
            page.setDefaultTimeout(30000);
            console.log(`Browser initialized successfully in ${modeDescription}.`);
            return { browser, page };
        }
        catch (error) {
            console.error(`Error initializing browser in ${modeDescription}:`, error);
            if (isDisplayAvailable && effectiveHeadless) {
                console.error(`Note: Display was thought to be available (DISPLAY=${process.env.DISPLAY}), but running headless due to watchBrowser=false.`);
            }
            else if (isDisplayAvailable && !effectiveHeadless) {
                console.error(`Note: Attempted headful mode with DISPLAY=${process.env.DISPLAY}.`);
            }
            throw new Error(`Failed to initialize browser with ${chromiumPath} (${modeDescription}). Error: ${error instanceof Error ? error.message : String(error)}`);
        }
    });
}
/**
 * Closes the Puppeteer browser instance.
 *
 * @param {Browser} browser - The browser instance to close.
 * @returns {Promise<void>} A promise that resolves when the browser is closed.
 */
function closeBrowser(browser) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!browser)
            return;
        console.log('Closing browser...');
        try {
            yield browser.close();
            console.log('Browser closed successfully.');
        }
        catch (error) {
            console.error('Error closing browser:', error);
        }
    });
}
/**
 * Logs into the Packt Publishing website.
 *
 * @param {Page} page - The Puppeteer page instance.
 * @param {string} email - The user's email.
 * @param {string} password - The user's password.
 * @param {string} loginUrl - The URL of the login page.
 * @returns {Promise<void>} A promise that resolves when login is successful.
 * @throws {Error} If login fails due to incorrect credentials, page structure changes, or CAPTCHAs.
 */
function loginToWebsite(page, email, password, loginUrl) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`Attempting to log in as ${email} to ${loginUrl}...`);
        if (!email || !password) {
            throw new Error('Email and password are required for login.');
        }
        try {
            console.log(`Navigating to login page: ${loginUrl} (waiting for networkidle0)`);
            // Stricter Wait Condition for Initial Page Load
            yield page.goto(loginUrl, { waitUntil: 'networkidle0' });
            console.log('Login page loaded.');
            // Debug: Save Initial Screenshot and HTML Content
            if (process.env.NODE_ENV === 'development') {
                const initialScreenshotPath = path_1.default.join(screenshotsDir, `login_page_idle_${Date.now()}.png`);
                yield page.screenshot({ path: initialScreenshotPath, fullPage: true });
                console.log(`Initial page screenshot taken (dev mode): ${initialScreenshotPath}`);
                const htmlContent = yield page.content();
                const htmlDebugPath = path_1.default.resolve(__dirname, '../../tmp_login_page.html');
                fs_1.default.writeFileSync(htmlDebugPath, htmlContent);
                console.log(`HTML content saved for debugging (dev mode): ${htmlDebugPath}`);
            }
            const emailSelector = '#login-input-email';
            const passwordSelector = '#login-input-password';
            const loginButtonSelector = '.login-page__main__container__login__form__button__login'; // This selector seems less stable, consider a more robust one if issues arise.
            console.log('Waiting for email input...');
            yield page.waitForSelector(emailSelector, { visible: true });
            yield page.type(emailSelector, email, { delay: 100 });
            console.log('Email entered.');
            if (process.env.NODE_ENV === 'development') {
                const afterEmailScreenshotPath = path_1.default.join(screenshotsDir, `login_after_email_${Date.now()}.png`);
                yield page.screenshot({ path: afterEmailScreenshotPath, fullPage: true });
                console.log(`Screenshot after email input (dev mode): ${afterEmailScreenshotPath}`);
            }
            console.log('Waiting for password input...');
            yield page.waitForSelector(passwordSelector, { visible: true });
            yield page.type(passwordSelector, password, { delay: 100 });
            console.log('Password entered.');
            if (process.env.NODE_ENV === 'development') {
                const afterPasswordScreenshotPath = path_1.default.join(screenshotsDir, `login_after_password_${Date.now()}.png`);
                yield page.screenshot({ path: afterPasswordScreenshotPath, fullPage: true });
                console.log(`Screenshot after password input (dev mode): ${afterPasswordScreenshotPath}`);
            }
            let loginButtonClicked = false;
            try {
                console.log(`Attempting to click login button with selector: ${loginButtonSelector}`);
                yield page.waitForSelector(loginButtonSelector, { visible: true, timeout: 10000 });
                yield page.click(loginButtonSelector);
                loginButtonClicked = true;
                console.log('Login button clicked.');
                // Stricter Wait Condition After Login Button Click
                console.log('Waiting for navigation to complete after login click (networkidle0)...');
                yield page.waitForNavigation({ waitUntil: 'networkidle0' });
                console.log('Navigation complete after login click.');
            }
            catch (e) {
                console.warn(`Login button with selector ${loginButtonSelector} not found or not clickable. Error: ${e instanceof Error ? e.message : String(e)}`);
                if (process.env.NODE_ENV === 'development') {
                    const screenshotPath = path_1.default.join(screenshotsDir, `login_failure_buttonclick_${Date.now()}.png`);
                    yield page.screenshot({ path: screenshotPath, fullPage: true });
                    console.error(`Screenshot taken (dev mode) on button click failure: ${screenshotPath}`);
                }
                throw new Error(`Failed to find or click login button with selector ${loginButtonSelector}. Error: ${e instanceof Error ? e.message : String(e)}`);
            }
            if (!loginButtonClicked) {
                throw new Error('Login button was not clicked, though an error should have been thrown earlier.');
            }
            console.log('Waiting for post-login confirmation element...');
            const postLoginSelector = '[data-testid="avatar-button-desktop"], a[href*="/account"], .user-avatar, #dashboard';
            yield page.waitForSelector(postLoginSelector, { visible: true, timeout: 20000 });
            console.log('Login appears to be successful.');
        }
        catch (error) {
            console.error('Login failed:', error);
            if (process.env.NODE_ENV === 'development') {
                const timestamp = Date.now();
                const screenshotPath = path_1.default.join(screenshotsDir, `login_failure_${timestamp}.png`);
                try {
                    if (page && typeof page.screenshot === 'function') {
                        yield page.screenshot({ path: screenshotPath, fullPage: true });
                        console.log(`Screenshot taken on failure (dev mode): ${screenshotPath}`);
                    }
                }
                catch (screenshotError) {
                    console.error('Failed to take screenshot (dev mode): ', screenshotError);
                }
            }
            if (error instanceof Error && error.message.includes('CAPTCHA')) {
                throw new Error('Login failed: CAPTCHA detected. Manual intervention may be required.');
            }
            throw new Error(`Login failed. Please check your credentials and ensure the website structure hasn't changed. Error: ${error instanceof Error ? error.message : String(error)}`);
        }
    });
}
// Add other browser automation functions here (e.g., extractData, navigateToUrl, etc.)
