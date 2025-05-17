const fs = require('fs');
const path = require('path');
const https = require('https');
const chalk = require('chalk');
const sanitize = require('sanitize-filename');
const ProgressBar = require('progress');

/**
 * Class to handle downloading and organizing course content
 */
class CourseBuilder {
  /**
   * Create a new CourseBuilder instance
   * @param {Course} course - Course object with course details
   * @param {string} outputDir - Directory where course files will be saved
   */
  constructor(course, outputDir) {
    this.course = course;
    this.outputDir = outputDir;
  }

  /**
   * Build course directory structure and download videos
   * @returns {Promise<void>}
   */
  async buildCourse() {
    const courseDetails = this.course.getCourseDetails();
    if (!courseDetails || !courseDetails.title) {
      console.log(chalk.red('❌ No course details available to build'));
      return;
    }
    
    console.log(chalk.blue(`\n🔧 Building course: ${courseDetails.title}`));
    
    // Create course directory
    const courseDir = path.join(
      this.outputDir, 
      sanitize(courseDetails.title.replace('[Video]', '').trim())
    );
    
    if (!fs.existsSync(courseDir)) {
      fs.mkdirSync(courseDir, { recursive: true });
    }
    
    // Create course info HTML file
    await this.createCourseInfoFile(courseDir);
    
    // Create chapter directories and download videos
    const totalVideos = courseDetails.chapters.reduce(
      (total, chapter) => total + chapter.videos.length, 
      0
    );
    
    let downloadedVideos = 0;
    let skippedVideos = 0;
    let errorVideos = 0;
    
    console.log(chalk.blue(`\n📥 Downloading ${totalVideos} videos...`));
    
    const downloadBar = new ProgressBar('[:bar] :percent :current/:total :file', {
      total: totalVideos,
      width: 30,
      complete: '=',
      incomplete: ' '
    });
    
    // Process each chapter
    for (let chapterIndex = 0; chapterIndex < courseDetails.chapters.length; chapterIndex++) {
      const chapter = courseDetails.chapters[chapterIndex];
      
      // Format chapter folder name
      const chapterNum = (chapterIndex + 1).toString().padStart(2, '0');
      const chapterName = `${chapterNum} ${chapter.title.replace(/^[0-9]+/, '').trim()}`;
      const chapterDir = path.join(courseDir, sanitize(chapterName));
      
      // Create chapter directory
      if (!fs.existsSync(chapterDir)) {
        fs.mkdirSync(chapterDir, { recursive: true });
      }
      
      // Process each video in the chapter
      for (let videoIndex = 0; videoIndex < chapter.videos.length; videoIndex++) {
        const video = chapter.videos[videoIndex];
        
        // Format video filename
        const videoNum = (videoIndex + 1).toString().padStart(2, '0');
        const videoTitle = video.title.replace(/^[0-9]+/, '').trim();
        const videoFileName = `${videoNum} ${sanitize(videoTitle)}.mp4`;
        const videoPath = path.join(chapterDir, videoFileName);
        
        // Download the video
        try {
          if (video.downloadUrl) {
            const downloaded = await this.downloadVideo(
              video.downloadUrl, 
              videoPath,
              videoFileName
            );
            
            if (downloaded) {
              downloadedVideos++;
            } else {
              skippedVideos++;
            }
          } else {
            console.log(chalk.yellow(`⚠️ No download URL for video: ${videoTitle}`));
            errorVideos++;
          }
        } catch (error) {
          console.error(chalk.red(`❌ Error downloading video: ${error.message}`));
          errorVideos++;
        }
        
        // Update progress bar
        downloadBar.tick({ file: videoFileName.substring(0, 30) + '...' });
      }
    }
    
    console.log(chalk.green(`\n✅ Course build completed: ${courseDetails.title}`));
    console.log(chalk.blue(`📊 Summary:`));
    console.log(chalk.blue(`   - Downloaded: ${downloadedVideos} videos`));
    console.log(chalk.blue(`   - Skipped: ${skippedVideos} videos (already existed)`));
    console.log(chalk.blue(`   - Errors: ${errorVideos} videos`));
  }

  /**
   * Create a HTML file with course information
   * @param {string} courseDir - Course directory path
   * @returns {Promise<void>}
   */
  async createCourseInfoFile(courseDir) {
    const courseDetails = this.course.getCourseDetails();
    
    // Build HTML content
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${courseDetails.title}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1, h2, h3 { color: #333; }
    .section { margin-bottom: 30px; }
    .chapter { margin-bottom: 20px; }
    .video-list { margin-left: 20px; }
    .meta { color: #666; font-style: italic; }
  </style>
</head>
<body>
  <h1>${courseDetails.title}</h1>
  
  <div class="section">
    <p class="meta">By ${courseDetails.author}</p>
    <p>${courseDetails.description || 'No description available.'}</p>
  </div>
  
  <div class="section">
    <h2>Table of Contents</h2>
    ${courseDetails.chapters.map((chapter, chapterIndex) => `
      <div class="chapter">
        <h3>${(chapterIndex + 1).toString().padStart(2, '0')}. ${chapter.title}</h3>
        <ul class="video-list">
          ${chapter.videos.map((video, videoIndex) => `
            <li>${(videoIndex + 1).toString().padStart(2, '0')}. ${video.title}</li>
          `).join('')}
        </ul>
      </div>
    `).join('')}
  </div>
  
  <div class="section">
    <p class="meta">Downloaded on ${new Date().toLocaleString()}</p>
    <p class="meta">Generated by Packt Video Downloader</p>
  </div>
</body>
</html>
    `.trim();
    
    // Write the file
    const filePath = path.join(courseDir, 'Course Info.html');
    fs.writeFileSync(filePath, html);
    
    console.log(chalk.green(`✅ Created course info file: Course Info.html`));
  }

  /**
   * Download a video file
   * @param {string} url - Video URL
   * @param {string} filePath - Path where file will be saved
   * @param {string} fileName - Name of the file (for logging)
   * @returns {Promise<boolean>} True if downloaded, false if skipped
   */
  downloadVideo(url, filePath, fileName) {
    return new Promise((resolve, reject) => {
      // Check if file already exists and has content
      if (fs.existsSync(filePath) && fs.statSync(filePath).size > 0) {
        // Skip download if file exists
        resolve(false);
        return;
      }
      
      // Create write stream for the file
      const fileStream = fs.createWriteStream(filePath);
      
      // Request the file from the URL
      const request = https.get(url, (response) => {
        // Check if response is successful
        if (response.statusCode !== 200) {
          fileStream.close();
          fs.unlink(filePath, () => {}); // Delete the file if it was created
          reject(new Error(`Failed to download video: HTTP ${response.statusCode}`));
          return;
        }
        
        // Pipe the response to the file
        response.pipe(fileStream);
        
        // When the file is fully downloaded
        fileStream.on('finish', () => {
          fileStream.close();
          resolve(true);
        });
      });
      
      // Handle request errors
      request.on('error', (error) => {
        fileStream.close();
        fs.unlink(filePath, () => {}); // Delete the file if it was created
        reject(error);
      });
      
      // Handle file stream errors
      fileStream.on('error', (error) => {
        fileStream.close();
        fs.unlink(filePath, () => {}); // Delete the file if it was created
        reject(error);
      });
    });
  }
}

module.exports = CourseBuilder;