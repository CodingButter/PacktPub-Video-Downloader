const Course = require("./Course.js");
const CourseBuilder = require("./CourseBuilder.js");

class Playlist {
    constructor(nightmare, url) {
        this.nightmare = nightmare;
        this.url = url;
        this.courses = [];
        this.links = [];
    }
    async getCourses() {
        return new Promise((resolve, reject) => {
            console.log("Gathering Playlist Courses")
            this.nightmare.goto(this.url).wait(5000).evaluate(() => {
                const links = Array.from(document.querySelectorAll("a")).map((a) => {
                    if (a.innerText.trim().toLowerCase() == "watch now") {
                        return a.href
                    }
                }).filter(function (el) {
                    return el != null;
                })
                return links;
            }).then(links => {
                this.links = links;
                resolve(this.links);
            });
        });
    }

    async getCourseDetails(course_index = 0) {
        return new Promise((resolve, reject) => {
            console.log("Gathering Course Details");
            const course_link = this.links[course_index];
            var course = new Course(this.nightmare, course_link);
            this.courses[course_index] = course;
            course.setCourseDetails().then((course_details) => {
                course.setVideos().then(course_details => {
                    const course_builder = new CourseBuilder(course);
                    course_builder.buildCourse();
                    if (course_index < this.links.length) {
                        course_index += 1;
                        this.getCourseDetails(course_index).then();
                    } else {
                        resolve(this.courses)
                    }
                });
            })
        });
    }
}

module.exports = Playlist;
