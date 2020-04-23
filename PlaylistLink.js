const PLAYLIST_PANEL = ".panel.panel-default.panel-playlist";
const PLAYLISTS_URLS = "https://subscription.packtpub.com/playlists";

const getPlaylistLink = (nightmare, plist) => {
    return new Promise((resolve, reject) => {
        console.log('Retrieving Playlist Link')
        nightmare.goto(PLAYLISTS_URLS).wait(PLAYLIST_PANEL).evaluate((plist) => {
            return Array.from(document.querySelectorAll('a')).map(a => {
                let inner_text = a.innerText.trim().toLowerCase();
                let link = a.href;
                if (inner_text === plist) {
                    return link;
                }
            }).filter(function (el) {
                return el != null;
            })[0];
        }, plist).then((link) => {
            resolve(link)
        });
    })
}

module.exports = getPlaylistLink;
