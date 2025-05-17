const chalk = require('chalk');
const ProgressBar = require('progress');

/**
 * Class to handle course operations
 */
class Course {
  /**
   * Create a new Course instance
   * @param {Page} page - Puppeteer page object
   * @param {string} courseUrl - URL of the course page
   */
  constructor(page, courseUrl) {
    this.page = page;
    this.courseUrl = courseUrl;
    this.courseDetails = {};
    this.currentVideo = 0;
  }

  /**
   * Extract course details from the course page
   * @returns {Promise<Object>} Course details object
   */
  async setCourseDetails() {
    try {
      console.log(chalk.blue(`🔗 Navigating to course URL: ${this.courseUrl}`));
      await this.page.goto(this.courseUrl, { waitUntil: 'networkidle2', timeout: 60000 });
      
      // Log that we're processing the course page
      console.log(chalk.blue('🔄 Processing course page details'));
      
      // Wait longer for page to fully load and for possible lazy-loaded content
      await this.page.waitForTimeout(5000);
      
      // Try to find and click any "View Course" buttons if present
      const hasViewButton = await this.page.evaluate(() => {
        const viewButtons = Array.from(document.querySelectorAll('a, button'))
          .filter(el => {
            const text = el.textContent.toLowerCase().trim();
            return text.includes('view course') || 
                   text.includes('watch course') || 
                   text.includes('start course') ||
                   text.includes('begin course');
          });
          
        if (viewButtons.length > 0) {
          viewButtons[0].click();
          return true;
        }
        return false;
      });
      
      if (hasViewButton) {
        console.log(chalk.blue('🖱️ Clicked "View Course" button'));
        // Wait for navigation after clicking the button
        await this.page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {
          console.log(chalk.yellow('⚠️ Navigation timeout after clicking View Course button'));
        });
        await this.page.waitForTimeout(3000);
        
        // Wait for page to update after clicking
        await this.page.waitForTimeout(1000);
      }
      
      // Wait for title or any main content to be visible
      await this.page.waitForSelector('h1, .main-content, .course-content, .toc', { timeout: 10000 }).catch(() => {
        console.log(chalk.yellow('⚠️ Could not find main course content elements'));
      });
      
      // Extract course details using page.evaluate with improved selectors
      this.courseDetails = await this.page.evaluate(() => {
        // Debug function to log DOM structure
        const logStructure = (element, prefix = '') => {
          if (!element) return;
          console.log(`${prefix}${element.tagName}: ${element.className} - ${element.id} - ${element.textContent.substring(0, 30).trim()}`);
          Array.from(element.children).forEach(child => logStructure(child, prefix + '  '));
        };
        
        // Output some debug info about the page structure
        console.log("Page title:", document.title);
        const h1 = document.querySelector('h1');
        if (h1) console.log("H1 text:", h1.textContent.trim());
        
        // Log some key elements to help understand the page structure
        const contentEl = document.querySelector('.course-content, .main-content, #content, main');
        if (contentEl) {
          console.log("Found main content element:", contentEl.tagName, contentEl.className);
          // logStructure(contentEl); // Uncomment if needed for deeper debugging
        }
        
        // Helper function to get all text from an element including children
        const getAllText = (element) => {
          if (!element) return '';
          return element.textContent.replace(/\\s+/g, ' ').trim();
        };
        
        // Helper function to get chapter video info with improved detection
        const getChapterVideoInfo = (chapterElement) => {
          if (!chapterElement) return [];
          
          // Look for video elements in various formats
          // 1. Direct links in the chapter element
          let videoElements = Array.from(chapterElement.querySelectorAll('a[href*="video"], a[href*="course"], a[href*="player"]'));
          
          // 2. If none found, look for likely video containers inside the chapter
          if (videoElements.length === 0) {
            const videoContainers = Array.from(chapterElement.querySelectorAll('.video-item, .lesson, .lecture, li, .video, .course-content-item'));
            videoElements = videoContainers.map(container => container.querySelector('a')).filter(Boolean);
          }
          
          // 3. If still none, look more broadly for anything that might be a video link
          if (videoElements.length === 0) {
            videoElements = Array.from(chapterElement.querySelectorAll('a')).filter(a => {
              const text = getAllText(a).toLowerCase();
              return text.includes('video') || 
                     text.includes('lesson') || 
                     text.includes('lecture') || 
                     a.href.includes('video') || 
                     a.href.includes('player');
            });
          }
          
          // Map the found elements to video objects
          return videoElements.map((videoElement, index) => {
            let title = getAllText(videoElement);
            
            // If the title seems too short, try to find a better title
            if (title.length < 3) {
              // Look for nearby elements that might contain the title
              const parentEl = videoElement.parentElement;
              if (parentEl) {
                const titleEls = parentEl.querySelectorAll('h3, h4, .title, .video-title, .lesson-title');
                if (titleEls.length > 0) {
                  title = getAllText(titleEls[0]);
                }
              }
            }
            
            // Clean up the title
            title = title.replace(/^[0-9\\.]+\\s*/, ''); // Remove leading numbers
            
            // Create a video object
            return {
              title: title || `Video ${index + 1}`,
              pageLink: videoElement.href
            };
          });
        };

        // Extract chapters with improved detection
        const extractChapters = () => {
          // Look for table of contents or course outline first
          const tocElements = document.querySelectorAll('.toc, .course-outline, .curriculum, .course-content');
          
          if (tocElements.length > 0) {
            console.log("Found table of contents element");
            // Use the first table of contents element found
            const toc = tocElements[0];
            
            // Try to find chapter elements within the TOC
            const chapterSelectors = [
              // Common chapter containers
              '.chapter, .section, .module, .unit',
              // Common chapter headers
              '.chapter-header, .section-header, .module-header',
              // Common heading patterns for chapters 
              'h2, h3',
              // Accordions that might contain chapters
              '.accordion, .accordion-header, .collapse-header',
              // Any element with 'chapter' in class or id
              '[class*="chapter"], [id*="chapter"]',
              '[class*="section"], [id*="section"]',
              // List items that might be chapters
              'li.chapter-item, li.section-item, li.module-item'
            ];
            
            // Try each selector until we find potential chapters
            let chapterElements = [];
            for (const selector of chapterSelectors) {
              const elements = toc.querySelectorAll(selector);
              if (elements.length > 0) {
                console.log(`Found ${elements.length} chapter elements using selector: ${selector}`);
                chapterElements = Array.from(elements);
                break;
              }
            }
            
            // If we found chapter elements, extract chapter info
            if (chapterElements.length > 0) {
              return chapterElements.map((chapterElement, index) => {
                // Find chapter title
                let chapterTitle = '';
                const titleEl = chapterElement.querySelector('.title, h2, h3, h4, .header, .heading');
                if (titleEl) {
                  chapterTitle = getAllText(titleEl);
                } else {
                  chapterTitle = getAllText(chapterElement);
                }
                
                // Clean up chapter title
                chapterTitle = chapterTitle.replace(/^[0-9\\.]+\\s*/, ''); // Remove leading numbers
                
                // Find chapter content container (for videos)
                let videoContainer = chapterElement;
                
                // Try to find the container with videos
                const potentialContainers = [
                  chapterElement.querySelector('.videos, .lessons, .lectures, .content'),
                  chapterElement.nextElementSibling,
                  chapterElement.querySelector('.chapter-content, .section-content'),
                  chapterElement.parentElement?.querySelector('.chapter-content, .section-content'),
                  chapterElement.parentElement
                ];
                
                for (const container of potentialContainers) {
                  if (container && container.querySelectorAll('a').length > 0) {
                    videoContainer = container;
                    break;
                  }
                }
                
                return {
                  title: chapterTitle || `Chapter ${index + 1}`,
                  videos: getChapterVideoInfo(videoContainer)
                };
              });
            }
          }
          
          // If no TOC found, or no chapters found in TOC, try alternative approaches
          
          // Approach 1: Look for elements that might be chapter containers
          const chapterContainerSelectors = [
            '.chapters, .sections, .modules',
            '.chapter-list, .section-list, .module-list',
            '.curriculum-items, .course-items',
            '.course-content > div, .main-content > div'
          ];
          
          for (const selector of chapterContainerSelectors) {
            const containers = document.querySelectorAll(selector);
            if (containers.length > 0) {
              console.log(`Found potential chapter container with selector: ${selector}`);
              // For each container, look for chapter elements
              const chapters = [];
              containers.forEach(container => {
                // Look for chapter elements within this container
                const chapterElements = container.querySelectorAll('h2, h3, .chapter, .section, .module');
                
                if (chapterElements.length > 0) {
                  chapterElements.forEach((chapterElement, index) => {
                    // Figure out what videos belong to this chapter
                    // (typically between this chapter header and the next, or within a child container)
                    let videoContainer = null;
                    
                    // Case 1: Videos are in a child container of the chapter
                    videoContainer = chapterElement.querySelector('.videos, .lessons, .content');
                    
                    // Case 2: Videos are in a sibling element after the chapter header
                    if (!videoContainer || !videoContainer.querySelectorAll('a').length) {
                      let nextEl = chapterElement.nextElementSibling;
                      while (nextEl && !nextEl.matches('h2, h3, .chapter, .section, .module')) {
                        if (nextEl.querySelectorAll('a').length > 0) {
                          videoContainer = nextEl;
                          break;
                        }
                        nextEl = nextEl.nextElementSibling;
                      }
                    }
                    
                    // If still no video container, use the chapter element itself
                    if (!videoContainer || !videoContainer.querySelectorAll('a').length) {
                      videoContainer = chapterElement;
                    }
                    
                    // Get chapter title
                    let chapterTitle = getAllText(chapterElement);
                    chapterTitle = chapterTitle.replace(/^[0-9\\.]+\\s*/, '');
                    
                    chapters.push({
                      title: chapterTitle || `Chapter ${index + 1}`,
                      videos: getChapterVideoInfo(videoContainer)
                    });
                  });
                }
              });
              
              if (chapters.length > 0) {
                return chapters;
              }
            }
          }
          
          // Approach 2: If all else fails, just treat the page as a single chapter
          console.log("Using fallback approach: treating page as a single chapter");
          
          // Get main content area
          const mainContent = document.querySelector('.course-content, .main-content, #content, main') || document.body;
          
          // Look for video links in the main content
          const videoLinks = mainContent.querySelectorAll('a');
          const videos = Array.from(videoLinks)
            .filter(a => {
              const href = a.href.toLowerCase();
              const text = getAllText(a).toLowerCase();
              
              return (
                href.includes('video') || 
                href.includes('player') || 
                href.includes('watch') ||
                text.includes('video') || 
                text.includes('lesson') || 
                text.includes('lecture') ||
                text.includes('watch')
              );
            })
            .map((a, index) => ({
              title: getAllText(a) || `Video ${index + 1}`,
              pageLink: a.href
            }));
            
          if (videos.length > 0) {
            return [{
              title: 'Course Content',
              videos: videos
            }];
          }
          
          // Absolute fallback - look for any links on the page
          console.log("Using last-resort approach: looking for any links");
          const anyLinks = Array.from(document.querySelectorAll('a'))
            .filter(a => a.href && !a.href.includes('#') && !a.href.includes('javascript:'))
            .map((a, index) => ({
              title: getAllText(a) || `Item ${index + 1}`,
              pageLink: a.href
            }));
            
          return [{
            title: 'Course Links',
            videos: anyLinks
          }];
        };

        // Get page title
        const pageTitle = document.querySelector('h1')?.textContent.trim() || 
                         document.title || 'Unknown Course';
        
        // Get author information
        let author = 'Unknown Author';
        const authorSelectors = [
          '.author, .instructor, .by-line', 
          '[itemprop="author"]',
          '.instructor-name',
          '.course-author'
        ];
        
        for (const selector of authorSelectors) {
          const authorElements = document.querySelectorAll(selector);
          if (authorElements.length > 0) {
            author = authorElements[0].textContent.replace('By', '').trim();
            break;
          }
        }
        
        // Get description
        let description = '';
        const descriptionSelectors = [
          '.description, .overview, .summary', 
          'p.lead',
          '[itemprop="description"]',
          'meta[name="description"]',
          '.course-description'
        ];
        
        for (const selector of descriptionSelectors) {
          const descElements = document.querySelectorAll(selector);
          if (descElements.length > 0) {
            if (selector === 'meta[name="description"]') {
              description = descElements[0].getAttribute('content');
            } else {
              description = descElements[0].textContent.trim();
            }
            break;
          }
        }
        
        // Create course details object
        const chapters = extractChapters();
        const totalVideos = chapters.reduce((count, chapter) => count + chapter.videos.length, 0);
        
        // Return course details
        return {
          title: pageTitle,
          author,
          description,
          chapters,
          totalVideos
        };
      });
      
      console.log(chalk.green(`✅ Extracted details for course: "${this.courseDetails.title}"`));
      console.log(chalk.blue(`📚 Total chapters: ${this.courseDetails.chapters.length}`));
      console.log(chalk.blue(`🎬 Total videos: ${this.courseDetails.totalVideos}`));
      
      return this.courseDetails;
    } catch (error) {
      console.error(chalk.red(`❌ Error extracting course details: ${error.message}`));
      // Log detailed error information
      console.error(chalk.red(`❌ Error details: ${error.stack || 'No stack trace available'}`));
      
      // Set minimal course details to avoid breaking the flow
      this.courseDetails = {
        title: 'Unknown Course',
        author: 'Unknown Author',
        description: 'Error extracting course details: ' + error.message,
        chapters: [],
        totalVideos: 0
      };
      return this.courseDetails;
    }
  }

  /**
   * Get video download URLs for all videos in the course
   * @param {number} chapterIndex - Chapter index to start with
   * @param {number} videoIndex - Video index to start with in the chapter
   * @returns {Promise<Object>} Updated course details with video URLs
   */
  async setVideos(chapterIndex = 0, videoIndex = 0) {
    // Check if we have chapters and videos
    if (!this.courseDetails.chapters || this.courseDetails.chapters.length === 0) {
      console.log(chalk.yellow('⚠️ No chapters found in course'));
      return this.courseDetails;
    }
    
    // Check if we've processed all chapters
    if (chapterIndex >= this.courseDetails.chapters.length) {
      return this.courseDetails;
    }
    
    // Get current chapter
    const chapter = this.courseDetails.chapters[chapterIndex];
    
    // Check if chapter has videos
    if (!chapter.videos || chapter.videos.length === 0) {
      console.log(chalk.yellow(`⚠️ No videos found in chapter ${chapterIndex + 1}: ${chapter.title}`));
      // Move to next chapter
      return this.setVideos(chapterIndex + 1, 0);
    }
    
    // Check if we've processed all videos in the current chapter
    if (videoIndex >= chapter.videos.length) {
      // Move to next chapter
      return this.setVideos(chapterIndex + 1, 0);
    }
    
    // Create a progress bar if this is the first video
    if (chapterIndex === 0 && videoIndex === 0) {
      this.progressBar = new ProgressBar('[:bar] :percent :current/:total :title', {
        total: this.courseDetails.totalVideos,
        width: 30,
        complete: '=',
        incomplete: ' '
      });
    }
    
    try {
      // Get current video
      const video = chapter.videos[videoIndex];
      
      // Log the video we're processing
      console.log(chalk.blue(`\n🎬 Processing video: ${video.title}`));
      console.log(chalk.blue(`🔗 Video page: ${video.pageLink}`));
      
      // Navigate to video page with longer timeout
      await this.page.goto(video.pageLink, { waitUntil: 'networkidle2', timeout: 60000 });
      
      // Log that we're processing the video page
      console.log(chalk.blue(`🔄 Processing video page for: Ch${chapterIndex+1} Video ${videoIndex+1}`));
      
      // Log current URL for debugging
      const videoPageUrl = await this.page.url();
      console.log(chalk.blue(`🔗 Current video page URL: ${videoPageUrl}`));
      
      // Wait for page to fully load
      await this.page.waitForTimeout(5000);
      
      // First, check specifically for video player with aria-label="Video Player"
      const targetPlayerCheck = await this.page.evaluate(() => {
        const targetPlayer = document.querySelector('video[aria-label="Video Player"]');
        if (targetPlayer) {
          return {
            found: true,
            type: 'target-player',
            tagName: targetPlayer.tagName,
            className: targetPlayer.className || 'no-class',
            id: targetPlayer.id || 'no-id',
            src: targetPlayer.src || 'none',
            currentSrc: targetPlayer.currentSrc || 'none',
            hasSources: targetPlayer.querySelectorAll('source').length > 0
          };
        }
        return { found: false };
      });
      
      if (targetPlayerCheck.found) {
        console.log(chalk.green(`✅ Found target video player with aria-label="Video Player"`));
        console.log(chalk.blue(`📝 Player details: ${JSON.stringify(targetPlayerCheck, null, 2)}`));
      } else {
        // Check for any active video player on the page as fallback
        const playerCheck = await this.page.evaluate(() => {
          const playerElements = document.querySelectorAll('video, .video-player, .vjs-tech, [class*="player"]');
          if (playerElements.length > 0) {
            return {
              found: true,
              count: playerElements.length,
              types: Array.from(playerElements).map(el => el.tagName)
            };
          }
          return { found: false };
        });
        
        if (playerCheck.found) {
          console.log(chalk.blue(`🎬 Found ${playerCheck.count} potential player elements: ${playerCheck.types.join(', ')}`));
        } else {
          console.log(chalk.yellow('⚠️ No video player elements found on page'));
        }
      }
      
      // Log that we're searching for video player
      console.log(chalk.blue('🔍 Searching for video player...'));
      
      // Scroll to ensure video player is in view
      await this.page.evaluate(() => {
        // Try to find and scroll to the video player
        const videoPlayer = document.querySelector('video[aria-label="Video Player"]') || 
                           document.querySelector('video') ||
                           document.querySelector('.video-player, .player-container');
        
        if (videoPlayer) {
          videoPlayer.scrollIntoView({ behavior: 'smooth', block: 'center' });
          console.log('Scrolled to video player');
        } else {
          // Scroll down a bit to try to load lazy content
          window.scrollTo(0, 300);
        }
      });
      
      // Wait a moment for scrolling to complete
      await this.page.waitForTimeout(2000);
      
      // Try to find and click play button(s)
      const playButtonClicked = await this.page.evaluate(() => {
        let clicked = false;
        
        // Priority 1: Look for play buttons near the target video player
        const targetPlayer = document.querySelector('video[aria-label="Video Player"]');
        if (targetPlayer) {
          // Look for play buttons within the player's parent container
          const playerContainer = targetPlayer.closest('.player-container, .video-container, [class*="player"]');
          if (playerContainer) {
            const containerPlayButtons = playerContainer.querySelectorAll(
              'button[aria-label="Play"], .play-button, .vjs-big-play-button, [class*="play-button"], [id*="play-button"]'
            );
            
            if (containerPlayButtons.length > 0) {
              try {
                containerPlayButtons[0].click();
                console.log('Clicked play button near target video player');
                clicked = true;
              } catch (e) {
                console.error('Error clicking play button near target player:', e);
              }
            }
          }
        }
        
        // Priority 2: Look for any play buttons on the page
        if (!clicked) {
          const playButtons = document.querySelectorAll(
            'button[aria-label="Play"], .play-button, .vjs-big-play-button, [class*="play-button"], [id*="play-button"]'
          );
          
          if (playButtons.length > 0) {
            console.log(`Found ${playButtons.length} play buttons`);
            try {
              playButtons[0].click();
              console.log('Clicked play button');
              clicked = true;
            } catch (e) {
              console.error('Error clicking play button:', e);
            }
          }
        }
        
        // Priority 3: Try clicking on the video player itself
        if (!clicked) {
          const videoPlayer = document.querySelector('video[aria-label="Video Player"]') || document.querySelector('video');
          if (videoPlayer) {
            try {
              videoPlayer.click();
              console.log('Clicked directly on video player');
              clicked = true;
            } catch (e) {
              console.error('Error clicking video player:', e);
            }
          }
        }
        
        return clicked;
      });
      
      if (playButtonClicked) {
        console.log(chalk.blue('🖱️ Clicked play button or video player'));
        // Wait for video to start playing
        await this.page.waitForTimeout(5000);
        
        // Log that video should be playing now
        console.log(chalk.blue('▶️ Video playback initiated'));
      }
      
      // Listen for network requests that might contain video information
      console.log(chalk.blue('🔍 Setting up network request monitoring...'));
      let videoRequests = [];
      const videoUrlPatterns = [
        /\.mp4/i, /\.m3u8/i, /\.mpd/i, /\.ts/i, /\/video\//i,
        /\/hls\//i, /\/dash\//i, /\/stream\//i, /\/media\//i
      ];
      
      // Setup network request interception
      try {
        await this.page.setRequestInterception(true);
        
        // Remove existing listeners to avoid duplicates
        this.page.removeAllListeners('request');
        
        this.page.on('request', request => {
          try {
            const url = request.url();
            if (videoUrlPatterns.some(pattern => pattern.test(url))) {
              videoRequests.push({
                url: url,
                type: 'network-request',
                resourceType: request.resourceType(),
                method: request.method()
              });
            }
            
            // Only continue the request if it hasn't been handled yet
            if (!request.isInterceptResolutionHandled()) {
              request.continue();
            }
          } catch (e) {
            console.log(chalk.yellow(`⚠️ Error handling request: ${e.message}`));
            // Attempt to continue anyway if not already handled
            try {
              if (!request.isInterceptResolutionHandled()) {
                request.continue();
              }
            } catch (continueError) {
              // Ignore errors from already handled requests
            }
          }
        });
      } catch (error) {
        console.log(chalk.yellow(`⚠️ Error setting up request interception: ${error.message}`));
      }
      
      // Try to interact with the page to trigger video loading
      await this.page.evaluate(() => {
        // Scroll the page to ensure all content is loaded
        window.scrollTo(0, 300);
        // Click on potential video containers
        document.querySelectorAll('.video-container, .player-container, .video-wrapper').forEach(container => {
          try { container.click(); } catch (e) {}
        });
      });
      await this.page.waitForTimeout(2000);
      
      // Specifically target the video player with aria-label="Video Player"
      const videoData = await this.page.evaluate(() => {
        const sources = [];
        
        // Method 1 (Priority): Look specifically for video player with aria-label="Video Player"
        console.log('Looking for video player with aria-label="Video Player"');
        const videoPlayer = document.querySelector('video[aria-label="Video Player"]');
        
        if (videoPlayer) {
          console.log('✅ Found video player with aria-label="Video Player"');
          
          // Check for direct source on the video element
          if (videoPlayer.src) {
            console.log(`Found direct src on video player: ${videoPlayer.src}`);
            sources.push({
              type: 'video-player',
              url: videoPlayer.src,
              quality: 'direct-player'
            });
          }
          
          // Check for source elements within the video player
          const playerSources = videoPlayer.querySelectorAll('source');
          if (playerSources.length > 0) {
            console.log(`Found ${playerSources.length} source elements within video player`);
            playerSources.forEach(source => {
              if (source.src) {
                sources.push({
                  type: 'video-player-source',
                  url: source.src,
                  quality: source.getAttribute('size') || source.getAttribute('label') || source.getAttribute('data-quality') || 'unknown'
                });
              }
            });
          }
          
          // Check for source URL in currentSrc property
          if (videoPlayer.currentSrc) {
            console.log(`Found currentSrc on video player: ${videoPlayer.currentSrc}`);
            sources.push({
              type: 'video-player-current',
              url: videoPlayer.currentSrc,
              quality: 'current-src'
            });
          }
        } else {
          console.log('⚠️ No video player with aria-label="Video Player" found, looking for other players...');
          
          // Try finding any video player with similar attributes
          const videoPlayers = document.querySelectorAll('video, [aria-label*="video" i], [aria-label*="player" i], [class*="video-player"], [id*="video-player"]');
          
          if (videoPlayers.length > 0) {
            console.log(`Found ${videoPlayers.length} potential video players`);
            
            videoPlayers.forEach((player, index) => {
              console.log(`Checking player ${index + 1}: ${player.tagName} - ${player.className || 'no-class'} - ${player.id || 'no-id'}`);
              
              if (player.src) {
                sources.push({
                  type: 'alt-player',
                  url: player.src,
                  quality: 'direct-src'
                });
              }
              
              if (player.currentSrc) {
                sources.push({
                  type: 'alt-player-current',
                  url: player.currentSrc,
                  quality: 'current-src'
                });
              }
              
              const playerSources = player.querySelectorAll('source');
              playerSources.forEach(source => {
                if (source.src) {
                  sources.push({
                    type: 'alt-player-source',
                    url: source.src,
                    quality: source.getAttribute('size') || source.getAttribute('label') || 'unknown'
                  });
                }
              });
            });
          }
        }
        
        // Method 2: Look for MP4 sources in the page
        console.log('Looking for MP4 sources in page content');
        const pageContent = document.documentElement.outerHTML;
        const mp4Matches = pageContent.match(/['"](https?:\/\/[^'"]+\.mp4[^'"]*)['"]/g);
        
        if (mp4Matches && mp4Matches.length > 0) {
          console.log(`Found ${mp4Matches.length} MP4 URLs in page content`);
          mp4Matches.forEach(match => {
            const url = match.replace(/['"]/g, '');
            sources.push({
              type: 'mp4-in-page',
              url: url,
              quality: 'unknown'
            });
          });
        }
        
        // Method 3: Look for media URLs in JSON data (focusing on MP4)
        try {
          console.log('Looking for video URLs in script tags');
          const scripts = document.querySelectorAll('script:not([src])');
          scripts.forEach(script => {
            const content = script.textContent;
            if (content.includes('videoUrl') || content.includes('mediaUrl') || content.includes('mp4') || content.includes('video')) {
              // Try to extract JSON objects from the script
              const jsonMatches = content.match(/[{]([^{}]|[{][^{}]*[}])*[}]/g);
              if (jsonMatches) {
                jsonMatches.forEach(jsonStr => {
                  try {
                    const obj = JSON.parse(jsonStr);
                    // Look for URLs in the object, prioritizing MP4
                    const extractUrls = (obj, prefix = '') => {
                      for (const key in obj) {
                        const fullKey = prefix ? `${prefix}.${key}` : key;
                        
                        if (typeof obj[key] === 'string' && 
                            (fullKey.toLowerCase().includes('url') || 
                             fullKey.toLowerCase().includes('src')) && 
                            obj[key].startsWith('http') &&
                            obj[key].includes('.mp4')) {
                          sources.push({
                            type: 'mp4-in-json',
                            key: fullKey,
                            url: obj[key],
                            quality: 'json-mp4'
                          });
                        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                          extractUrls(obj[key], fullKey);
                        }
                      }
                    };
                    
                    extractUrls(obj);
                  } catch (e) {
                    // Ignore JSON parse errors
                  }
                });
              }
            }
          });
        } catch (e) {
          console.error('Error parsing JSON from scripts:', e);
        }
        
        // Log counts of sources found
        console.log(`Found ${sources.length} potential video sources`);
        sources.forEach((source, i) => {
          console.log(`Source ${i+1}: ${source.type} - ${source.url.substring(0, 100)}${source.url.length > 100 ? '...' : ''}`);
        });
        
        return sources;
      });
      
      console.log(chalk.blue(`🔍 Found ${videoData.length} potential video sources`));
      
      // Add network requests to our video sources
      if (videoRequests.length > 0) {
        console.log(chalk.blue(`🔍 Found ${videoRequests.length} potential video requests in network traffic`));
        videoData.push(...videoRequests);
      }
      
      // Choose the best video source with prioritization
      let bestSource = null;
      
      // Priority 1: Direct MP4 sources from the video player with aria-label="Video Player"
      const videoPlayerSources = videoData.filter(s => 
        s.url && 
        s.url.includes('.mp4') && 
        (s.type === 'video-player' || s.type === 'video-player-source' || s.type === 'video-player-current')
      );
      
      if (videoPlayerSources.length > 0) {
        bestSource = videoPlayerSources[0].url;
        console.log(chalk.green(`✅ Selected MP4 source from Video Player: ${bestSource}`));
      }
      // Priority 2: Any MP4 sources from alternative video players
      else {
        const altPlayerSources = videoData.filter(s => 
          s.url && 
          s.url.includes('.mp4') && 
          (s.type === 'alt-player' || s.type === 'alt-player-source' || s.type === 'alt-player-current')
        );
        
        if (altPlayerSources.length > 0) {
          bestSource = altPlayerSources[0].url;
          console.log(chalk.green(`✅ Selected MP4 source from alternative player: ${bestSource}`));
        }
        // Priority 3: MP4 sources found in page content
        else {
          const mp4InPageSources = videoData.filter(s => 
            s.url && 
            s.url.includes('.mp4') && 
            s.type === 'mp4-in-page'
          );
          
          if (mp4InPageSources.length > 0) {
            bestSource = mp4InPageSources[0].url;
            console.log(chalk.green(`✅ Selected MP4 source from page content: ${bestSource}`));
          }
          // Priority 4: MP4 sources found in JSON/script tags
          else {
            const mp4InJsonSources = videoData.filter(s => 
              s.url && 
              s.url.includes('.mp4') && 
              s.type === 'mp4-in-json'
            );
            
            if (mp4InJsonSources.length > 0) {
              bestSource = mp4InJsonSources[0].url;
              console.log(chalk.green(`✅ Selected MP4 source from script data: ${bestSource}`));
            }
            // Priority 5: Any MP4 source as fallback
            else {
              const anyMp4Sources = videoData.filter(s => s.url && s.url.includes('.mp4'));
              
              if (anyMp4Sources.length > 0) {
                bestSource = anyMp4Sources[0].url;
                console.log(chalk.green(`✅ Selected MP4 source: ${bestSource}`));
              }
              // Last resort: Any source
              else if (videoData.length > 0) {
                bestSource = videoData[0].url;
                console.log(chalk.green(`✅ Selected source: ${bestSource}`));
                
                // If it's an HLS or DASH source, warn that special handling may be needed
                if (bestSource.includes('.m3u8') || bestSource.includes('.mpd')) {
                  console.log(chalk.yellow(`⚠️ Found streaming source (${bestSource.includes('.m3u8') ? 'HLS' : 'DASH'}) which may need special handling`));
                }
              } else {
                console.log(chalk.yellow(`⚠️ No video source found for "${video.title}"`));
              }
            }
          }
        }
      }
      
      // Debug output - log the selected source details
      if (bestSource) {
        const sourceDetails = videoData.find(s => s.url === bestSource);
        if (sourceDetails) {
          console.log(chalk.blue(`📝 Source details: Type=${sourceDetails.type}, Quality=${sourceDetails.quality || 'unknown'}`));
        }
      }
      
      // Update video object with download URL
      video.downloadUrl = bestSource;
      
      // Update progress
      this.currentVideo++;
      if (this.progressBar) {
        this.progressBar.tick({
          title: video.title.substring(0, 40) + (video.title.length > 40 ? '...' : '')
        });
      }
      
      // Process next video
      return this.setVideos(chapterIndex, videoIndex + 1);
    } catch (error) {
      console.error(chalk.red(`❌ Error processing video: ${error.message}`));
      
      // Log more detailed error information
      console.error(chalk.red(`❌ Error details: ${error.stack || 'No stack trace available'}`));
      
      this.currentVideo++;
      if (this.progressBar) {
        this.progressBar.tick({ title: 'Error - skipping video' });
      }
      
      // Continue with next video despite error
      return this.setVideos(chapterIndex, videoIndex + 1);
    }
  }

  /**
   * Get course details object
   * @returns {Object} Course details
   */
  getCourseDetails() {
    return this.courseDetails;
  }
}

module.exports = Course;