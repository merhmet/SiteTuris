//global
var Plist;
const message = document.getElementById("mess-box");
const userlink = document.getElementById("UserUrl");
// 1. get user list
function userList() {
  // need some more code to security check and validate sanitize input links
  if (userlink.value == "") {
    userlink.placeholder = " THIS IS REQUIRED !!";
    return;
  }

  let str = userlink.value;
  if (str.includes("list=") == false) {
    message.innerHTML =
      "  Lütfen Playlist olarak Yapistirin  URL,  'list=' ";
    return;
  }

  const getid = str.split("list="); //splits url string into parts
  var ytlist = getid[1].split("&");
  Plist = ytlist[0];
  message.innerHTML = " Playlistiniz Hazir  : " + Plist; // optional visual display
  player.stopVideo(); //stops current video if playing
  onPlayerReady(); // youtube player event to load user list
}

// 2. This code loads the IFrame Player API code asynchronously.
var tag = document.createElement("script");
tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName("script")[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// 3. This function creates an <iframe>(YouTube player) with in div tag id='player' after the API code downloads.
//  ---------- player function -----------------------------
var player;

function onYouTubeIframeAPIReady() {
  player = new YT.Player("player", {
    playerVars: {
      enablejsapi: 1,
      loop: 1,
      controls: 1,
      showinfo: 1,
      modestbranding: 1
    },
    events: {
      onReady: onPlayerReady
      // onStateChange: onPlayerStateChange
    }
  });
}
//----------------end player-------------------

// 4. The API will call this function when the video player is ready.

function onPlayerReady(event) {
  player.cuePlaylist({ list: Plist }); //loads and cues list .
  console.log(Plist);
}

function onPlayerStateChange(event) {}

//---added functions

// very simple YT shuffle command then starts at first video in the new list.
function shuff_list() {
  player.setShuffle(true);
  // start at index 0
  player.playVideoAt(0);
  //player.stopVideo(); //uncomment to stop video playing after shuffle
}
/* things to do

display Youtube channel and list name requires api keys*/