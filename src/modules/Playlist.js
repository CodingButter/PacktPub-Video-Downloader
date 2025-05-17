const chalk = require('chalk');
const Course = require('./Course');

/**
 * Class to handle Packt playlist operations
 */
class Playlist {
  /**
   * Create a new Playlist instance
   * @param {Page} page - Puppeteer page object
   * @param {string} url - The URL of the playlist
   */
  constructor(page, url) {
    this.page = page;
    this.url = url;
    this.courses = [];
    this.links = [];
  }

  /**
   * Get all course links from the playlist
   * @returns {Promise<string[]>} Array of course URLs
   */
  async getCourses() {
    console.log(chalk.blue('\n📋 Fetching courses from playlist...'));
    
    try {
      await this.page.goto(this.url, { waitUntil: 'networkidle2' });
      
      // Log that we're processing the playlist page
      console.log(chalk.blue('🔄 Processing playlist page...'));
      
      // Wait longer to ensure all content is loaded (especially for dynamic sites)
      await this.page.waitForTimeout(5000);
      
      // Get all course links with improved detection
      this.links = await this.page.evaluate(() => {
        // Function to extract visible text including nested elements
        const getVisibleText = (element) => {
          if (!element) return '';
          return Array.from(element.childNodes)
            .map(node => {
              if (node.nodeType === Node.TEXT_NODE) return node.textContent.trim();
              if (node.nodeType === Node.ELEMENT_NODE && window.getComputedStyle(node).display !== 'none') {
                return getVisibleText(node);
              }
              return '';
            })
            .join(' ')
            .replace(/\\s+/g, ' ')
            .trim();
        };
        
        // Look for any link that might be a course
        const allLinks = Array.from(document.querySelectorAll('a'));
        const courseLinks = [];
        
        // Look for card-style links (common in modern web design)
        const cardLinks = allLinks.filter(a => {
          // Check if it's inside what looks like a card
          const isCard = a.closest('.card, [class*="card"], [class*="course"], [class*="item"], article, .playlist-item');
          if (isCard) return true;
          
          // Check for attributes that suggest it's a course link
          const href = a.href.toLowerCase();
          if (href.includes('/course/') || href.includes('/video/') || href.includes('/book/')) return true;
          
          // Check for typical course-related text
          const text = getVisibleText(a).toLowerCase();
          if (text.includes('watch') || text.includes('view') || text.includes('start') || 
              text.includes('course') || text.includes('learn') || text.includes('read')) return true;
              
          return false;
        });
        
        // Prioritize card links first
        cardLinks.forEach(link => courseLinks.push(link.href));
        
        // If we didn't find any card links, look for other potential course links
        if (courseLinks.length === 0) {
          // Find any link with a title attribute or contains course-like text
          allLinks.forEach(a => {
            const text = getVisibleText(a).toLowerCase();
            const href = a.href.toLowerCase();
            const hasTitle = a.hasAttribute('title') && a.getAttribute('title').trim() !== '';
            
            if (hasTitle || 
                href.includes('/course/') || 
                href.includes('/video/') || 
                href.includes('/book/') ||
                text.includes('course') || 
                text.includes('chapter') || 
                text.includes('video')) {
              courseLinks.push(a.href);
            }
          });
        }
        
        // If we still don't have links, get any link that's a main element in the page
        if (courseLinks.length === 0) {
          const mainElements = document.querySelectorAll('main, [role="main"], .main-content, #content, #main');
          if (mainElements.length > 0) {
            mainElements.forEach(main => {
              const mainLinks = main.querySelectorAll('a');
              mainLinks.forEach(a => {
                if (a.href && !a.href.includes('#') && !a.href.includes('javascript:')) {
                  courseLinks.push(a.href);
                }
              });
            });
          }
        }
        
        // Add debug info about what we found
        console.log("Found potential course links:", courseLinks.length > 0 ? courseLinks : "None");
        
        // Return unique links
        return [...new Set(courseLinks)];
      });
      
      if (this.links.length === 0) {
        console.log(chalk.yellow('⚠️ No courses found in playlist using standard detection'));
        
        // Take another approach - directly search for all links and filter them
        this.links = await this.page.evaluate(() => {
          // Get ALL links on the page
          const allLinks = Array.from(document.querySelectorAll('a'))
            .filter(a => {
              const href = a.href;
              // Filter out common non-course links
              if (!href || 
                  href.includes('javascript:') || 
                  href.includes('#') || 
                  href.includes('login') ||
                  href.includes('register') ||
                  href.includes('about') ||
                  href.includes('contact') ||
                  href.includes('support')) {
                return false;
              }
              return true;
            })
            .map(a => a.href);
            
          return [...new Set(allLinks)]; // Remove duplicates
        });
        
        console.log(chalk.blue(`📊 Found ${this.links.length} potential links in the page`));
        
        // If still no links, we really can't find anything
        if (this.links.length === 0) {
          console.log(chalk.red('❌ No links found in playlist at all'));
        } else {
          console.log(chalk.green(`✅ Found ${this.links.length} potential links to check`));
        }
      } else {
        console.log(chalk.green(`✅ Found ${this.links.length} courses`));
      }
      
      return this.links;
    } catch (error) {
      console.error(chalk.red(`❌ Error fetching courses: ${error.message}`));
      return [];
    }
  }

  /**
   * Get details for all courses in the playlist
   * @param {number} courseIndex - Index of the course to start with
   * @returns {Promise<Course[]>} Array of Course objects
   */
  async getCourseDetails(courseIndex = 0) {
    if (this.links.length === 0) {
      console.log(chalk.yellow('⚠️ No course links available. Call getCourses() first.'));
      return [];
    }
    
    if (courseIndex >= this.links.length) {
      return this.courses;
    }
    
    try {
      console.log(chalk.blue(`\n📖 Getting details for course ${courseIndex + 1}/${this.links.length}...`));
      
      const courseUrl = this.links[courseIndex];
      const course = new Course(this.page, courseUrl);
      this.courses[courseIndex] = course;
      
      await course.setCourseDetails();
      await course.setVideos();
      
      // Continue with next course
      return this.getCourseDetails(courseIndex + 1);
    } catch (error) {
      console.error(chalk.red(`❌ Error getting course details: ${error.message}`));
      
      // Continue with next course despite error
      return this.getCourseDetails(courseIndex + 1);
    }
  }
}

module.exports = Playlist;