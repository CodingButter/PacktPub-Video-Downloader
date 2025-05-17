# PacktPub Video Course Downloader

A CLI tool for downloading video courses from Packt Publishing playlists.

## Features

- Download entire video courses from your Packt Publishing playlists
- Interactive prompts for missing credentials
- Environment variable support for automation
- Progress tracking for downloads
- Stealth mode to avoid detection
- Organized output with proper file structure

## Installation

### Global Installation

```bash
npm install -g packtpub-video-downloader
```

### Local Installation

```bash
git clone https://github.com/JamieNichols/PacktPub-Video-Downloader.git
cd PacktPub-Video-Downloader
npm install
```

## Before You Begin

You must have a Packt Publishing account. [Register Here](https://account.packtpub.com/register)

You can try out their 7-day trial. This may or may not work for paid courses once your trial begins.

### Finding Your Playlist ID

1. Go to the "Watch Now" section of a course and add it to a playlist. Create a new playlist or add it to an existing one.
2. Navigate to your playlists page: https://subscription.packtpub.com/playlists
3. Click on the playlist you want to download from
4. Look at your browser's address bar - the URL will be in this format:
   ```
   https://subscription.packtpub.com/playlists/123456
   ```
5. The number at the end (e.g., `123456`) is your **Playlist ID**. You'll need this to use the downloader.

## Usage

### Running with npx

The easiest way to use this tool is with npx:

```bash
npx packtpub-video-downloader
```

This will prompt you for your credentials, playlist IDs, and download directory.

### Command Line Options

```bash
npx packtpub-video-downloader --email [YourEmail] --password [YourPassword] --directory path/to/download/directory/ --playlist-id "123456"
```

#### Options:

- `-e, --email <email>` - Your Packt Publishing account email
- `-p, --password <password>` - Your Packt Publishing account password
- `-d, --directory <path>` - Directory to save courses (default: current directory)
- `-i, --playlist-id <id>` - Playlist ID(s) (comma-separated for multiple)
- `--show-browser` - Show browser during the process
- `--no-stealth` - Disable stealth mode
- `-h, --help` - Display help information
- `-v, --version` - Display version number

### Multiple Playlists

To download courses from multiple playlists, separate the IDs with commas:

```bash
npx packtpub-video-downloader --playlist-id "123456,789012,345678"
```

### Environment Variables

Create a `.env` file in the project directory with your credentials:

```
PACKT_EMAIL=your.email@example.com
PACKT_PASSWORD=your_password
PACKT_PLAYLIST_IDS=123456,789012
OUTPUT_DIRECTORY=/path/to/save/courses
WATCH=true  # Set to 'true' to display the browser window
```

A template `.env.example` file is provided for reference.

## Output Structure

The downloaded courses will be organized in the following structure:

```
output_directory/
├── Course Name 1/
│   ├── Course Info.html
│   ├── 01 Chapter Name/
│   │   ├── 01 Video Name.mp4
│   │   ├── 02 Video Name.mp4
│   │   └── ...
│   ├── 02 Chapter Name/
│   │   └── ...
│   └── ...
├── Course Name 2/
│   └── ...
└── ...
```

## MIT License

Copyright (c) 2020 Jamie Nichols

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.