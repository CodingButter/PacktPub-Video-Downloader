# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This repository contains a tool for downloading video courses from Packt Publishing (packtpub.com). It works by:

1. Logging into a Packt Publishing account
2. Accessing user-created playlists
3. Finding all courses in those playlists
4. Downloading the video content along with course information

The tool uses Nightmare.js for browser automation to navigate the Packt Publishing website, extract course information, and retrieve video URLs for downloading.

## Running the Application

The main application can be run with:

```bash
node index.js --email [YourEmail] --password [YourPassword] --directory path/to/download/directory/ --playlist "Playlist Name"
```

Required parameters:
- `--email` - Your Packt Publishing account email
- `--password` - Your Packt Publishing account password
- `--directory` - Local directory where courses will be saved
- `--playlist` - Name of the Packt playlist containing courses to download (case insensitive)

You can provide multiple playlists by separating them with commas:
```bash
node index.js --email [email] --password [password] --directory [path] --playlist "Playlist 1, Playlist 2"
```

## Dependencies

This project requires the following npm packages:
- nightmare (v3.0.2+) - Browser automation
- progress (v2.0.3+) - Terminal progress bar
- sanitize-filename (v1.6.3+) - Clean filenames for saving

Installation:
```bash
npm install
# or
pnpm install
```

## Architecture

The application follows a modular design with separate classes for different parts of the process:

1. **Login.js** - Handles authentication with Packt Publishing
2. **PlaylistLink.js** - Retrieves the URL for a specific playlist
3. **Playlist.js** - Extracts courses from a playlist
4. **Course.js** - Scrapes course details and video URLs
5. **CourseBuilder.js** - Downloads videos and creates HTML documentation
6. **Utilities.js** - Common utility functions

Flow:
1. The user provides their credentials and playlist information
2. The app logs in using Nightmare.js automation
3. It locates and navigates to the specified playlist(s)
4. For each course, it scrapes metadata and video URLs
5. Videos are downloaded in the background while the next course is being processed
6. An HTML file containing course information is created in each course directory

## Limitations

1. The application does not include comprehensive error handling
2. Downloads happen in the background with limited progress information
3. No retry mechanism for failed downloads
4. Requires adding courses to a playlist before downloading

## Development Notes

- The application uses direct DOM selectors to find elements on the Packt website
- Changes to the Packt website structure may break functionality
- Nightmare.js enables headless browser automation (though this implementation shows the browser with `{show: true}`)
- Async/await is used extensively for managing browser automation flow