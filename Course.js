


const COURSE_TITLE = '[ng-bind-html="productController.title"]';

class Course {
    constructor(nightmare, course_link) {
        this.nightmare = nightmare;
        this.course_link = course_link;
        this.course_details = {};
        this.current_video = 0;
    }
    setCourseDetails() {
        return new Promise((resolve, reject) => {
            this.nightmare.goto(this.course_link).wait(COURSE_TITLE).evaluate(() => {
                const getChapterVideoInfo = (chapter_index) => {
                    const root_elm = document.querySelector(`#toc-item-${chapter_index}`);
                    var videos = [];
                    Array.from(root_elm.querySelectorAll("a")).forEach((a, index) => {
                        videos[index] = {
                            title: a.innerText.trim(),
                            page_link: a.href
                        }
                    });
                    return videos;
                }

                const getChapters = () => {
                    var chapters = [];
                    document.querySelectorAll('.cover-toc__section-name.cover-toc__section-name--has-icon.ng-scope').forEach((chapter_title, index) => {
                        chapters[index] = {
                            title: chapter_title.innerText.trim().replace("\n", " "),
                            videos: getChapterVideoInfo(index)
                        }
                    })
                    return chapters;
                }

                const setChapters = () => {
                    const root_elm = document.querySelector('[ng-repeat="(key, chapter) in productController.tableOfContents track by $index"]');
                    const chapters = getChapters()
                    return chapters;
                }


                document.querySelector(".badge.badge-video").innerHTML = "";
                const root = '[ng-show="!showSpinner"] ';
                const hs = document.querySelectorAll(root + "h6");
                const uls = document.querySelectorAll(root + "ul");
                var course_details = {
                    title: document.querySelectorAll('[ng-bind-html="productController.title"]')[0].innerText.replace("[", "").replace("]", "").replace("Video", "").replace("\n", "").trim(),
                    author: hs[0].innerText.replace("By ", "").trim(),
                    date: hs[1].innerText.trim(),
                    quick_description: document.querySelectorAll(root + "p")[0].innerHTML,
                    key_features: "<ul>" + uls[1].innerHTML + "</ul>",
                    what_you_will_learn: "<ul>" + uls[2].innerHTML + "</ul>",
                    about: document.querySelector('[ng-bind-html="productController.productSummary.about"]').innerHTML,
                    about_author: document.querySelector('[ng-repeat="(key, author) in productController.productSummary.authorList"]').innerHTML,
                    table_of_contents: document.querySelector('.cover-toc__level-wrapper').innerHTML,
                    chapters: setChapters(),
                    total_videos: 0
                }
                course_details.chapters.map(chapters => {
                    chapters.videos.map(videos => {
                        course_details.total_videos += 1;
                    })
                })

                return course_details
            }).then(course_details => {


                this.course_details = course_details
                console.log(`\nScraping: ${
                    this.course_details.title
                }\nTotal Chapters: ${
                    this.course_details.chapters.length
                }\nTotal Videos: ${this.course_details.total_videos}`);
                resolve(course_details);
            });
        })
    }

    async setVideos(chapter_index = 0, video_index = 0) {
        return new Promise((resolve, reject) => {
            this.nightmare.goto(this.course_details.chapters[chapter_index].videos[video_index].page_link).wait("video").evaluate(() => {
                return document.querySelector("video").src;
            }).then(download_url => {
                this.course_details.chapters[chapter_index].videos[video_index].download_url = download_url;
                this.current_video++;
                process.stdout.clearLine();
                process.stdout.cursorTo(0);
                process.stdout.write(`${Math.round(10*(100*(this.current_video/this.course_details.total_videos))/10)}% - Completed [${ this.course_details.chapters[chapter_index].videos[video_index].title}]`)
                if (video_index == this.course_details.chapters[chapter_index].videos.length - 1) {
                    chapter_index += 1;
                    video_index = -1;
                }
                video_index += 1;
                if (this.course_details.chapters[chapter_index]) {
                    this.setVideos(chapter_index, video_index).then(() => {
                        resolve(this.course_details.chapters);
                    })

                } else {
                    resolve(this.course_details.chapter);
                }
            })
        })
    }

    getCourseDetails() {
        return this.course_details;
    }
}
module.exports = Course;
