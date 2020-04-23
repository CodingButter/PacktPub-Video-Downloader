const http = require('https');
const fs = require('fs');
const sanitize = require("sanitize-filename")
const {getArg} = require('./Utilities.js');
const dir = getArg("--directory");

class CourseBuilder {
    constructor(course) {
        this.course = course;
    }
    buildCourse() {
        console.log('\nDownloading Videos in the background');
        var html_file = `
        <h1>${
            this.course.course_details.title
        }</h1>
        <h3>By - ${
            this.course.course_details.author
        }</h3>
        <h3>${
            this.course.course_details.date
        }</h3>
        <h3>${
            this.course.course_details.quick_description
        }</h3>
        <h3>Key Features</h3>
        ${
            this.course.course_details.key_features
        }
        <h3>What you will learn</h3>
        ${
            this.course.course_details.what_you_will_learn
        }
        <h3>About</h3>
        <div>${
            this.course.course_details.about
        }</div>
        <h3>About Author</h3>
        <div>${
            this.course.course_details.about_author
        }</div>
        <h3>Table of Contents</h3>
        <div>${
            this.course.course_details.table_of_contents
        }</div>
        `;
        const rd = dir + sanitize(this.course.course_details.title) + "/";
        if (! fs.existsSync(rd)) {
            fs.mkdirSync(rd);
        }
        fs.writeFile(rd + "Course.html", html_file, () => {}, () => {});

        this.course.course_details.chapters.forEach((chapter, index) => {
            var chapter_name = (index + 1 < 10) ? "0" + (
                index + 1
            ) : index + 1;
            chapter_name += " " + chapter.title.replace(/^[0-9]+/, '');

            var chapter_path = rd + sanitize(chapter_name) + "/"

            if (! fs.existsSync(chapter_path)) 
                fs.mkdirSync(chapter_path);
            


            chapter.videos.forEach((video, index) => {
                var video_title = chapter_path + (index < 10) ? "0" + (
                    index + 1
                ) : index + 1;
                video_title += " " + sanitize(video.title.replace(/^[0-9]+/, '')) + ".mp4"


                this.downloadVideo(chapter_path + video_title, video.download_url, index);
            })
        })
    }
    downloadVideo(path, link, index) {
        if (! fs.existsSync(path)) {
            const file = fs.createWriteStream(path);
            const request = http.get(link, function (response) {
                response.pipe(file);
            });
        }
    }
}
module.exports = CourseBuilder;
