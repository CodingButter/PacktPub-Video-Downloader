# Upgrade Notes

This document summarizes the changes made to update the PacktPub Video Downloader.

## Major Changes

1. **Replaced Nightmare.js with Puppeteer**
   - Nightmare.js had not been maintained for several years
   - Puppeteer provides better performance and more reliable automation
   - Added stealth mode to avoid detection

2. **Modern CLI Interface**
   - Added interactive prompts for easier use
   - Support for command line arguments
   - Environment variable integration with dotenv
   - Detailed help output

3. **Improved File Organization**
   - Modular code structure in src/ directory
   - Separate utils/ and modules/ folders
   - Consistent error handling

4. **Better User Experience**
   - Progress bars for downloads
   - Colored console output
   - Detailed error messages
   - Course info HTML files with better formatting

5. **NPX Support**
   - Can be run directly with npx
   - Easy global installation option

## Testing

A test script is included to verify functionality without downloading videos:

```bash
npm test
```

## Usage

The tool can be used in three ways:

1. **Interactive Mode**: Run without arguments to be prompted for all required information
   ```bash
   npm start
   # or
   node cli.js
   ```

2. **Command Line Arguments**: Provide all information via CLI
   ```bash
   node cli.js --email user@example.com --password pass123 --directory /path/to/save --playlist "My Playlist"
   ```

3. **Environment Variables**: Create a .env file with your credentials
   ```
   PACKT_EMAIL=user@example.com
   PACKT_PASSWORD=pass123
   PACKT_PLAYLISTS=My Playlist, Another Playlist
   OUTPUT_DIRECTORY=/path/to/save
   ```