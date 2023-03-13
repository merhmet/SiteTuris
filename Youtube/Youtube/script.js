// Setup Swiper-js 
// https://swiperjs.com/
// Params
var sliderSelector = ".swiper-container",
  options = {
    init: false,
    loop: true,
    speed: 800,
    slidesPerView: 2, // or 'auto'
    // spaceBetween: 10,
    centeredSlides: true,
    effect: "coverflow", // 'cube', 'fade', 'coverflow',
    coverflowEffect: {
      rotate: 50, // Slide rotate in degrees
      stretch: 0, // Stretch space between slides (in px)
      depth: 100, // Depth offset in px (slides translate in Z axis)
      modifier: 1, // Effect multipler
      slideShadows: true // Enables slides shadows
    },
    grabCursor: true,
    parallax: true,
    pagination: {
      el: ".swiper-pagination",
      clickable: false
    },
    navigation: {
      nextEl: ".swiper-button-next",
      prevEl: ".swiper-button-prev"
    },
    keyboard: {
      enabled: true,
      onlyInViewport: false
    },
    breakpoints: {
      1023: {
        slidesPerView: 1,
        spaceBetween: 0
      }
    },
    // Events
    on: {
      imagesReady: function () {
        this.el.classList.remove("loading");
      },
      slideChange: function () {
        //  Stop Video from Playing on Slide Change
        videoStop();
      }
    }
  };
var mySwiper = new Swiper(sliderSelector, options);

// Initialize slider
mySwiper.init();

//  Video Poster Setup

$(document).on("click", ".js-videoPoster", function (ev) {
  "use strict";
  ev.preventDefault();
  videoStop();
  var $poster = $(this);
  var $wrapper = $poster.closest(".js-videoWrapper");
  videoPlay($wrapper);
});

// play the targeted video (and hide the poster frame)
function videoPlay($wrapper) {
  "use strict";
  var $iframe = $wrapper.find(".js-videoIframe");
  var src = $iframe.data("src");
  // hide poster
  $wrapper.addClass("videoWrapperActive");
  // add iframe src in, starting the video
  $iframe.attr("src", src);
}

// stop the targeted/all videos (and re-instate the poster frames)
function videoStop($wrapper) {
  "use strict";
  // if we're stopping all videos on page
  if (!$wrapper) {
    var $wrapper = $(".js-videoWrapper");
    var $iframe = $(".js-videoIframe");
    // if we're stopping a particular video
  } else {
    var $iframe = $wrapper.find(".js-videoIframe");
  }
  // reveal poster
  $wrapper.removeClass("videoWrapperActive");
  // remove youtube link, stopping the video from playing in the background
  $iframe.attr("src", "");
}