const tag = document.createElement("script");
tag.src = "https://www.youtube.com/iframe_api";
document.head.appendChild(tag);
var player;
function onYouTubeIframeAPIReady() {
 player = new YT.Player("yt-player", {
  height: "250",
  width: "250",
  videoId: "jt74rQymY0I",
  events: {}
 });
}

const video_choices = document.querySelectorAll(".video-choice");

const base_yt_url_template =
 "https://www.youtube.com/embed/VIDEO_ID?enablejsapi=1&amp;widgetid=1";

const build_thumbnail_url = (video_id) =>
 `https://img.youtube.com/vi/${video_id}/hqdefault.jpg`;

const play_video = ({ video_id }) => {
 player.loadVideoById(video_id);
 player.playVideo();
};

Array.from(video_choices).forEach((elm) => {
 elm.style.backgroundImage = `url('${build_thumbnail_url(
  elm.dataset.identifier
 )}')`;
 elm.addEventListener("click", (e) => {
  e.preventDefault();
  play_video({
   video_id: elm.dataset.identifier
  });
 });
});