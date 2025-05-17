# Project Overview: Stealthy Course Downloader

## Project Goal
The primary goal of this project is to develop a robust and user-friendly browser automation tool capable of stealthily logging into a specified website, navigating to a user's courses and playlists, identifying downloadable video links and course documents within those, and managing the download process. The tool should be highly resistant to bot detection and captchas, leverage modern web automation technologies, be executable via `npx`, and provide a simple HTML interface for viewing downloaded content.

## Key Features

*   **Stealthy Browser Automation:** Utilize advanced techniques to mimic human browsing behavior and avoid detection by anti-bot systems and captchas.
*   **TypeScript Implementation:** Develop the entire codebase in TypeScript for improved code maintainability, readability, and type safety.
*   **`npx` Executable:** Allow users to run the tool directly using `npx`, simplifying installation and execution.
*   **User-Provided Information:** The user will provide all necessary information (credentials, course/playlist URLs) to retrieve and download content.
*   **Video and Document Downloading:** Download all videos and associated documents (e.g., PDFs, supplementary materials) from courses.
*   **Organized Downloads:** Structure downloaded content logically by course and chapter/module for easy navigation.
*   **Local HTML Interface:** Generate a simple HTML interface to allow users to browse and watch their downloaded courses locally.
*   **Intelligent Caching:** Implement a caching mechanism using a JSON file to store extracted information (video links, document links, download status, local file paths). This cache will prevent redundant website visits and facilitate resuming interrupted downloads.
*   **Simplified Project Structure:** Maintain a project structure similar to the original project at the root, avoiding excessive abstractions.
*   **Error Handling and Reporting:** Implement robust error handling to gracefully manage unexpected situations during automation and provide informative feedback to the user.

## Technology Stack

*   **TypeScript:** The primary programming language for the project.
*   **Leading-edge Browser Automation Library:** Selection of a modern, stealth-focused browser automation library (e.g., Playwright with specific configurations, or a library designed for anti-detection).
*   **`pnpm`:** For package management.
*   **`dotenv`:** For loading configuration from a `.env` file (optional).
*   **`inquirer` (or similar):** For creating interactive command-line prompts if configuration is not fully provided.
*   **Node.js:** The runtime environment for executing the TypeScript code.
*   **JSON:** For the cache file format.
*   **HTML/CSS/JavaScript (basic):** For the local viewing interface.

## Project Structure (Proposed)

```
updated_project/
├── src/
│   ├── automation.ts    # Browser automation logic (login, navigation, extraction)
│   ├── cache.ts         # Caching logic
│   ├── downloader.ts    # Video and document download logic
│   ├── interface.ts     # Logic for generating the HTML interface
│   ├── types.ts         # TypeScript type definitions
│   └── index.ts         # Entry point of the application
├── downloads/           # Default directory for downloaded courses (organized by course name)
├── .env.example         # Example .env file
├── package.json         # Project dependencies and scripts (using pnpm)
├── pnpm-lock.yaml       # pnpm lock file
├── tsconfig.json        # TypeScript configuration
├── README.md            # General project information
├── Project_Overview.md  # Detailed project overview (this file)
└── Project_Scope.md     # Detailed project scope
```

## Development Phases

1.  **Setup and Core Structure:**
    *   Initialize the Node.js project with TypeScript using `pnpm`.
    *   Set up the flattened directory structure.
    *   Install necessary dependencies.
    *   Configure TypeScript compilation.
2.  **Configuration and CLI:**
    *   Implement `.env` file loading.
    *   Develop interactive command-line prompts for user input.
3.  **Browser Automation - Login and Navigation:**
    *   Implement stealthy login.
    *   Develop logic to navigate to user courses/playlists.
4.  **Content Link Extraction (Videos & Documents):**
    *   Implement logic to scrape course/playlist URLs.
    *   Implement logic to extract video download links and document links.
5.  **Caching Mechanism:**
    *   Develop logic to read/write cache data.
    *   Integrate caching into the link extraction process.
6.  **Downloading and Organization:**
    *   Implement reliable video and document downloading.
    *   Organize downloads into structured folders.
    *   Update cache status and file paths.
7.  **HTML Interface Generation:**
    *   Develop functionality to generate a simple HTML interface for browsing and playing downloaded content.
8.  **Error Handling and Refinement:**
    *   Implement comprehensive error handling.
    *   Refine stealth mechanisms.
9.  **Packaging and Distribution:**
    *   Configure `package.json` for `npx` execution.
10. **Documentation:**
    *   Complete `README.md`, `Project_Overview.md`, and `Project_Scope.md`.

This project aims to provide a powerful yet simple solution for users to download and manage their online course content locally, with a focus on stealth, ease of use, and organized access.
