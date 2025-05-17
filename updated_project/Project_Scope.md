# Project Scope: Stealthy Course Downloader with Local Interface

This document outlines the scope and build process for a browser automation tool designed to download videos and documents from user-specified online courses and playlists. The tool will prioritize stealth, utilize modern automation technology, be built with TypeScript, use `pnpm` for package management, be executable via `npx`, and generate an HTML interface for local viewing.

## 1. Project Goals

*   Create a robust and stealthy browser automation tool capable of logging into a website and extracting video and document download links from user-specified courses/playlists.
*   Download all identified videos and documents, organizing them into a user-friendly local file structure.
*   Implement a caching mechanism to store and manage download links, content metadata, and download status.
*   Generate a simple HTML interface to allow users to browse and access their downloaded courses locally.
*   Provide flexible user input methods for necessary information (e.g., credentials, URLs).
*   Ensure the tool is easily executable using `npx`.
*   Develop the tool in TypeScript for improved code quality and maintainability.
*   Maintain a simple project structure, avoiding unnecessary abstractions.

## 2. Technology Stack

*   **Language:** TypeScript
*   **Browser Automation:** A leading-edge, stealth-focused library (e.g., Playwright).
*   **Package Manager:** `pnpm`
*   **Configuration:** `dotenv` for `.env` file parsing (optional), and `inquirer` (or similar) for interactive CLI prompts.
*   **Caching:** JSON file storage.
*   **Local Interface:** Basic HTML, CSS, and JavaScript.
*   **Execution:** Node.js, `npx`.

## 3. Build Steps

This section details the steps required to build the project.

### Step 1: Project Setup and Initialization

1.  **Create Project Directory:** `mkdir updated_project` (if not already present).
2.  **Navigate into Directory:** `cd updated_project`
3.  **Initialize `pnpm`:** `pnpm init` to create a `package.json` file.
4.  **Install Dependencies:** Install core dependencies using `pnpm`:
    ```bash
    pnpm add typescript playwright dotenv inquirer @types/node @types/dotenv @types/inquirer
    pnpm add -D typescript @types/node # Ensure typescript and @types/node are dev dependencies if not already
    ```
5.  **Initialize TypeScript:** `pnpm exec tsc --init` to create a `tsconfig.json` file. Configure `outDir` (e.g., to `dist`) and other necessary options.

### Step 2: Directory Structure

Create the following simplified directory structure:
```
updated_project/
├── src/
│   ├── automation.ts    # Browser automation (login, navigation, data extraction)
│   ├── cache.ts         # Caching logic for course/video/document info
│   ├── downloader.ts    # Handles video and document downloads
│   ├── interface.ts     # Generates the HTML viewing interface
│   ├── types.ts         # TypeScript type definitions
│   └── index.ts         # Main entry point
├── downloads/           # Default root directory for downloaded courses
├── .env.example         # Example .env file for credentials, etc.
├── package.json         # Project configuration and scripts
├── pnpm-lock.yaml       # pnpm lock file
├── tsconfig.json        # TypeScript compiler options
├── README.md
├── Project_Overview.md
└── Project_Scope.md
```

### Step 3: User Input and Configuration

1.  Implement logic in `index.ts` or a dedicated `config.ts` (if preferred, though we aim for flatter structure) to:
    *   Load environment variables using `dotenv` (e.g., username, password).
    *   If necessary variables are missing, use `inquirer` to prompt the user for input (e.g., credentials, course/playlist URLs, download path).

### Step 4: Browser Automation (`automation.ts`)

1.  **Initialize Automation Library:** Set up Playwright (or chosen library) for stealthy browser operations.
2.  **Login Logic:** Implement functions to log into the target website.
3.  **Navigation and Data Extraction:** 
    *   Navigate to user-provided course/playlist URLs.
    *   Extract video links, video titles, and any associated document links (PDFs, text files, etc.) and their names.
    *   Gather necessary metadata for organization (e.g., course title, module/section names).

### Step 5: Caching Mechanism (`cache.ts`)

1.  **Cache File:** Use a JSON file (e.g., `downloads/.cache.json`) to store information.
2.  **Cache Structure:** Design a structure to hold:
    *   Course information (title, URL).
    *   Video details (title, download URL, local path, download status).
    *   Document details (title, download URL, local path, download status).
3.  **Cache Operations:** Implement functions for loading, saving, and updating cache entries.

### Step 6: Downloading and Organization (`downloader.ts`)

1.  **Download Logic:** Implement functions to download files (videos, documents) from URLs.
2.  **File System Organization:** 
    *   Create a main folder for downloads (e.g., `downloads/`).
    *   Inside, create subfolders for each course by its title.
    *   Optionally, further organize by modules/sections if this information is available and useful.
    *   Save videos and documents into their respective course folders.
3.  **Update Cache:** Mark items as "downloaded" in the cache and store their local paths.

### Step 7: HTML Interface Generation (`interface.ts`)

1.  **HTML Structure:** Define a simple HTML template for the main index page and potentially for individual course pages.
2.  **Content Population:** 
    *   Read the cache or scan the `downloads` directory structure.
    *   Dynamically generate HTML content listing downloaded courses.
    *   For each course, list downloaded videos (with `<video>` tags or links to local files) and documents (links to local files).
3.  **Interface Generation:** Create a function that generates an `index.html` file in the `downloads` directory (or a dedicated interface directory).

### Step 8: Main Entry Point (`index.ts`)

1.  Coordinate the overall process:
    *   Get user input/configuration.
    *   Load or initialize the cache.
    *   Run browser automation to gather content information.
    *   Update the cache with new findings.
    *   Initiate downloads for pending items.
    *   Once downloads are complete (or on user command), generate/update the HTML interface.
    *   Ensure graceful browser closure.

### Step 9: `npx` Integration

1.  **`package.json`:** Add/update the `bin` field to point to the compiled output of `index.ts` (e.g., `"bin": {"course-downloader": "./dist/index.js"}`).
2.  **Shebang:** Add `#!/usr/bin/env node` to the top of `src/index.ts`.
3.  **Build Script:** Add a build script to `package.json` (e.g., `"build": "tsc"`).
4.  **Execution:** After building (`pnpm run build`), the tool should be runnable via `npx .` from the `updated_project` directory or `npx course-downloader` if published/linked globally.

## 4. Out of Scope

*   Complex CAPTCHA solving beyond basic stealth.
*   Multi-factor authentication (MFA) beyond simple username/password.
*   Advanced video/audio quality selection (will aim for best available by default).
*   Conversion of video formats.
*   Streaming or DRM-protected content that isn't directly downloadable.
*   A dynamic web server for the HTML interface (it will be static files).

## 5. Success Criteria

*   The tool successfully logs into the target platform.
*   It extracts links for videos and documents from specified courses/playlists.
*   All extracted content is downloaded and organized into a clear local directory structure.
*   A local HTML interface is generated, allowing users to browse and access downloaded content.
*   The caching mechanism works, preventing re-downloads and allowing resumption.
*   The tool is executable via `npx` using `pnpm` as the package manager.
*   The project structure remains relatively flat and easy to understand.

This scope guides the development of a stealthy and user-friendly course downloading tool with local playback capabilities, built using TypeScript and modern practices. 
