const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);

const playlist = $(".playlist");
const player = $(".player");
const dashboard = $(".dashboard");
const heading = $(".song_name");
const cd = $(".cd");
const cdThumb = $(".cd_thumb");
const progress = $("#progress");
const audio = $("#audio");
const playBtn = $(".btn-toggle-play");
const nextBtn = $(".btn-next");
const prevBtn = $(".btn-prev");
const randomBtn = $(".btn-random");
const repeatBtn = $(".btn-repeat");

const songs = [
  {
    name: "Vì Mẹ Anh Bắt Chia Tay",
    singer: "Miu Lê, Karik, Châu Đăng Khoa",
    path: "https://cdn.muzikmp3indir.com/mp3_files/37f4a8a6d51c9dc2984000387fbb0c36.mp3",
    image:
      "https://photo-resize-zmp3.zmdcdn.me/w240_r1x1_webp/avatars/e/2/9/8/e2983a18669da0f3e941f159ce892b04.jpg",
  },
  {
    name: "Tệ thật, Anh nhớ em",
    singer: "Thanh Hưng",
    path: "https://cdn.muzikmp3indir.com/mp3_files/37f4a8a6d51c9dc2984000387fbb0c36.mp3",
    image:
      "https://avatar-ex-swe.nixcdn.com/song/2022/03/03/0/1/3/6/1646267009685_500.jpg",
  },
  {
    name: "Hai mươi hai",
    singer: "Amee",
    path: "https://cdn.muzikmp3indir.com/mp3_files/37f4a8a6d51c9dc2984000387fbb0c36.mp3",
    image:
      "https://avatar-ex-swe.nixcdn.com/song/2022/05/24/9/6/e/a/1653363505428_500.jpg",
  },
  {
    name: "Từng thương",
    singer: "Phan Duy Anh, ACV",
    path: "https://cdn.muzikmp3indir.com/mp3_files/37f4a8a6d51c9dc2984000387fbb0c36.mp3",
    image:
      "https://avatar-ex-swe.nixcdn.com/song/2022/04/19/e/7/3/c/1650360805680_500.jpg",
  },
  {
    name: "Người Em Cố Đô",
    singer: "Rum, Đaa",
    path: "https://cdn.muzikmp3indir.com/mp3_files/37f4a8a6d51c9dc2984000387fbb0c36.mp3",
    image:
      "https://avatar-ex-swe.nixcdn.com/song/2021/01/06/1/6/a/7/1609922114277_500.jpg",
  },
  {
    name: "Ánh Sao Và Bầu Trời",
    singer: "T.R.I",
    path: "https://cdn.muzikmp3indir.com/mp3_files/37f4a8a6d51c9dc2984000387fbb0c36.mp3",
    image:
      "https://avatar-ex-swe.nixcdn.com/song/2021/09/09/f/c/f/d/1631155238247_500.jpg",
  },
  {
    name: "Yêu Em Mỗi Ngày",
    singer: "Andiez",
    path: "https://cdn.muzikmp3indir.com/mp3_files/37f4a8a6d51c9dc2984000387fbb0c36.mp3",
    image:
      "https://avatar-ex-swe.nixcdn.com/song/2022/03/11/1/a/0/3/1647001991460_500.jpg",
  },
];

const app = {
  currentIndex: 0,
  isPlaying: false,
  isRandom: false,
  isRepeat: false,
  songs: songs,
  defineProperties: function () {
    Object.defineProperty(this, "currentSong", {
      get: function () {
        return this.songs[this.currentIndex];
      },
    });
  },

  renderSong: function () {
    var html = "";
    this.songs.forEach((song, index) => {
      html += `
      <div class="song ${
        index === this.currentIndex ? "active" : ""
      }" data-index="${index}">
          <div
            class="thumb"
            style="
              background-image: url(${song.image});
            "
          ></div>
          <div class="body">
            <h3 class="title">${song.name}</h3>
            <p class="author">${song.singer}</p>
          </div>
          <div class="option">
            <i class="fas fa-ellipsis-h"></i>
          </div>
        </div>

      `;
    });
    playlist.innerHTML = html;
  },

  handleEvent: function () {
    // Handle hide CD While Scrolling
    const cdWidth = cd.offsetWidth;
    document.onscroll = function () {
      const scrollTop = document.documentElement.scrollTop || window.scrollY;
      const newCdWidth = cdWidth - scrollTop;

      cd.style.width = newCdWidth > 0 ? newCdWidth + "px" : 0;
      cd.style.opacity = newCdWidth / cdWidth;
    };

    // Handle Play Song...
    playBtn.addEventListener("click", () => {
      if (app.isPlaying) {
        audio.pause();
      } else {
        audio.play();
      }

      audio.onplay = () => {
        app.isPlaying = true;
        player.classList.add("playing");
        cdThumb.style.animation = "rotateCD 10s infinite linear";
      };

      audio.onpause = () => {
        app.isPlaying = false;
        player.classList.remove("playing");
        cdThumb.style.animationPlayState = "paused";
      };

      audio.ontimeupdate = () => {
        if (audio.currentTime)
          progress.value = (audio.currentTime / audio.duration) * 100;
      };

      progress.onchange = function (e) {
        const seekTime = (audio.duration / 100) * e.target.value;
        audio.currentTime = seekTime;
      };
    });

    // Handle Next or Prev Song...
    nextBtn.onclick = () => {
      if (app.isRandom) {
        app.playRandomSong();
      } else {
        app.nextSong();
      }
      player.classList.add("playing");
      app.renderSong();
      app.scrollToActiveSong();
      audio.play();
    };

    prevBtn.onclick = () => {
      if (app.isRandom) {
        app.playRandomSong();
      } else {
        app.prevSong();
      }
      player.classList.add("playing");
      app.renderSong();
      app.scrollToActiveSong();
      audio.play();
    };

    // Handle Random Song...
    randomBtn.onclick = () => {
      app.isRandom = !app.isRandom;
      console.log(app.isRandom);
      randomBtn.classList.toggle("active", app.isRandom);
    };

    // Handle Ended Song...
    audio.onended = () => {
      if (app.isRepeat) {
        audio.play();
      } else {
        nextBtn.click();
      }
    };

    // Handle Repeat Song...
    repeatBtn.onclick = () => {
      this.isRepeat = !this.isRepeat;
      repeatBtn.classList.toggle("active", this.isRepeat);
    };

    playlist.onclick = function (e) {
      const songNode = e.target.closest(".song:not(.active)");
      if (songNode || e.target.closest(".option")) {
        if (songNode) {
          app.currentIndex = Number(songNode.dataset.index);
          app.loadCurrentSong();
          app.renderSong();
          if (app.isPlaying) {
            player.classList.add("playing");
            audio.play();
          }
        } else {
        }
      }
    };

    // Handle Active Song...
    // heading.onchange = () => {
    //   $(".song.active").classList.remove("active");
    //   songs[currentIndex].classList.add("active");
    // };
  },

  scrollToActiveSong: () => {
    setTimeout(
      () =>
        $(".song.active").scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        }),
      300
    );
  },

  loadCurrentSong: function () {
    heading.textContent = this.currentSong.name;
    cdThumb.style.backgroundImage = `url('${this.currentSong.image}')`;
    audio.src = this.currentSong.path;
  },

  nextSong: function () {
    this.currentIndex++;
    if (this.currentIndex == this.songs.length) {
      this.currentIndex = 0;
    }
    this.loadCurrentSong();
  },

  prevSong: function () {
    this.currentIndex--;
    if (this.currentIndex < 0) {
      this.currentIndex = this.songs.length - 1;
    }
    this.loadCurrentSong();
  },

  playRandomSong: function () {
    let newIndex;
    do {
      newIndex = Math.floor(Math.random() * this.songs.length);
    } while (this.currentIndex === newIndex);
    this.currentIndex = newIndex;
    console.log(this.currentIndex);
    this.loadCurrentSong();
  },

  start: function () {
    this.defineProperties();
    this.handleEvent();
    this.loadCurrentSong();
    this.renderSong();
  },
};

app.start();