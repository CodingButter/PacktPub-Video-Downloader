const Nightmare = require('nightmare');
const {getArg} = require('./Utilities.js')
const Login = require('./Login.js');
const getPlaylistLink = require("./PlaylistLink.js");
const Playlist = require("./Playlist.js");

const email = getArg("--email");
const password = getArg("--password");
const playlists = getArg("--playlist").split(", ").map(list => {
    return list.toLowerCase()
});
const course_list = [];


// Viewport must have a width at least 1040 for the desktop version of Packt's blog
const nightmare = new Nightmare({show: false}).viewport(1024, 768);
Login(nightmare, email, password).then((logged_in) => {
    if (logged_in) {
        playlists.forEach((playlist) => {
            getPlaylistLink(nightmare, playlist).then((link) => {
                var playlist = new Playlist(nightmare, link);
                playlist.getCourses().then(() => {
                    playlist.getCourseDetails().then(course_details => {
                        console.log(JSON.stringify(course_details))
                    });
                })
            })
        });
    }
});
