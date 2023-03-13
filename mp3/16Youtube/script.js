const load = (function () {
    "use strict";

    function _load(tag) {
        return function (url) {
            return new Promise(function (resolve) {
                const element = document.createElement(tag);
                const parent = "body";
                const attr = "src";
                element.onload = function () {
                    resolve(url);
                };
                element[attr] = url;
                document[parent].appendChild(element);
            });
        };
    }
    return {
        js: _load("script")
    };
}());
(function manageCover() {
    "use strict";

    function hide(el) {
        el.classList.add("hide");
    }

    function coverClickHandler(evt) {
        const cover = evt.currentTarget;
        hide(cover);
    }
    const cover = document.querySelector(".jacket");
    cover.addEventListener("click", coverClickHandler);
}());
const videoPlayer = (function makeVideoPlayer() {
    "use strict";

    function onPlayerReady(event) {
        const player = event.target;
        player.setVolume(100); // percent
    }
    let hasShuffled = false;

    function onPlayerStateChange(event) {
        const player = event.target;
        const shufflePlaylist = true;

        if (!hasShuffled) {
            player.setShuffle(shufflePlaylist);
            player.playVideoAt(0);
            hasShuffled = true;
        }
    }

    function addVideo(video) {

        const playlist = "PLbMRkajUSrSlmXKzgc5074cZZnsrwAglS,-Xgi_way56U,CHahce95B1g";

        new YT.Player(video, {
            videoId: video.dataset.id,
            width: 640,
            height: 360,
            host: "https://www.youtube-nocookie.com",
            playerVars: {
                autoplay: 1,
                controls: 1,
                rel: 0,
                iv_load_policy: 3,
                cc_load_policy: 0,
                fs: 0,
                disablekb: 1,
                playlist
            },
            events: {
                "onReady": onPlayerReady,
                "onStateChange": onPlayerStateChange
            }
        });
    }

    function init(opts) {
        load.js("https://www.youtube.com/player_api").then(function () {
            YT.ready(function () {
                addVideo(opts.video);
            });
        });
    }
    return {
        init
    };
}());

(function iife() {
    "use strict";

    function show(el) {
        el.classList.remove("hide");
    }

    function initPlayer(wrapper) {
        videoPlayer.init({
            video: wrapper.querySelector(".video")
        });
    }

    function coverClickHandler(evt) {
        const wrapper = evt.currentTarget.nextElementSibling;
        show(wrapper);
        initPlayer(wrapper);
    }

    const cover = document.querySelector(".jacket");
    cover.addEventListener("click", coverClickHandler);
}());