;(function(window, undefined) {

'use strict';

var AudioPlayer = (function() {

  // Player vars
  var
  player = document.getElementById('ap'),
  playBtn,
  prevBtn,
  nextBtn,
  plBtn,
  repeatBtn,
  volumeBtn,
  progressBar,
  preloadBar,
  curTime,
  durTime,
  trackTitle,
  audio,
  index = 0,
  playList,
  volumeBar,
  volumeLength,
  repeating = false,
  seeking = false,
  rightClick = false,
  apActive = false,
  // playlist vars
  pl,
  plLi,
  // settings
  settings = {
    volume   : .500,
    autoPlay : true,
    notification: false,
    playList : []
  };

  function init(options) {

    if(!('classList' in document.documentElement)) {
      return false;
    }

    if(apActive || player === null) {
      return;
    }

    settings = extend(settings, options);

    // get player elements
    playBtn        = player.querySelector('.ap-toggle-btn');
    prevBtn        = player.querySelector('.ap-prev-btn');
    nextBtn        = player.querySelector('.ap-next-btn');
    repeatBtn      = player.querySelector('.ap-repeat-btn');
    volumeBtn      = player.querySelector('.ap-volume-btn');
    plBtn          = player.querySelector('.ap-playlist-btn');
    curTime        = player.querySelector('.ap-time--current');
    durTime        = player.querySelector('.ap-time--duration');
    trackTitle     = player.querySelector('.ap-title');
    progressBar    = player.querySelector('.ap-bar');
    preloadBar     = player.querySelector('.ap-preload-bar');
    volumeBar      = player.querySelector('.ap-volume-bar');

    playList = settings.playList;

    playBtn.addEventListener('click', playToggle, false);
    volumeBtn.addEventListener('click', volumeToggle, false);
    repeatBtn.addEventListener('click', repeatToggle, false);

    progressBar.parentNode.parentNode.addEventListener('mousedown', handlerBar, false);
    progressBar.parentNode.parentNode.addEventListener('mousemove', seek, false);
    document.documentElement.addEventListener('mouseup', seekingFalse, false);

    volumeBar.parentNode.parentNode.addEventListener('mousedown', handlerVol, false);
    volumeBar.parentNode.parentNode.addEventListener('mousemove', setVolume);
    document.documentElement.addEventListener('mouseup', seekingFalse, false);

    prevBtn.addEventListener('click', prev, false);
    nextBtn.addEventListener('click', next, false);


    apActive = true;

    // Create playlist
    renderPL();
    plBtn.addEventListener('click', plToggle, false);

    // Create audio object
    audio = new Audio();
    audio.volume = settings.volume;



    if(isEmptyList()) {
      empty();
      return;
    }

    audio.src = playList[index].file;
    audio.preload = 'auto';
    trackTitle.innerHTML = playList[index].title;
    volumeBar.style.height = audio.volume * 100 + '%';
    volumeLength = volumeBar.css('height');

    audio.addEventListener('error', error, false);
    audio.addEventListener('timeupdate', update, false);
    audio.addEventListener('ended', doEnd, false);

    if(settings.autoPlay) {
      audio.play();
      playBtn.classList.add('playing');
      plLi[index].classList.add('pl-current');
    }
  }

/**
 *  PlayList methods
 */
    function renderPL() {
      var html = [];
      var tpl =
        '<li data-track="{count}">'+
          '<div class="pl-number">'+
            '<div class="pl-count">'+
              '<svg fill="#000000" height="20" viewBox="0 0 24 24" width="20" xmlns="http://www.w3.org/2000/svg">'+
                  '<path d="M0 0h24v24H0z" fill="none"/>'+
                  '<path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>'+
              '</svg>'+
            '</div>'+
            '<div class="pl-playing">'+
              '<div class="eq">'+
                '<div class="eq-bar"></div>'+
                '<div class="eq-bar"></div>'+
                '<div class="eq-bar"></div>'+
              '</div>'+
            '</div>'+
          '</div>'+
          '<div class="pl-title">{title}</div>'+
          '<button class="pl-remove">'+
              '<svg fill="#000000" height="20" viewBox="0 0 24 24" width="20" xmlns="http://www.w3.org/2000/svg">'+
                  '<path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>'+
                  '<path d="M0 0h24v24H0z" fill="none"/>'+
              '</svg>'+
          '</button>'+
        '</li>';

      playList.forEach(function(item, i) {
        html.push(
          tpl.replace('{count}', i).replace('{title}', item.title)
        );
      });

      pl = create('div', {
        'className': 'pl-container hide',
        'id': 'pl',
        'innerHTML': !isEmptyList() ? '<ul class="pl-list">' + html.join('') + '</ul>' : '<div class="pl-empty">PlayList is empty</div>'
      });

      player.parentNode.insertBefore(pl, player.nextSibling);

      plLi = pl.querySelectorAll('li');

      pl.addEventListener('click', listHandler, false);
    }

    function listHandler(evt) {
      evt.preventDefault();
      if(evt.target.className === 'pl-title') {
        var current = parseInt(evt.target.parentNode.getAttribute('data-track'), 10);
        index = current;
        play();
        plActive();
      }
      else {
        var target = evt.target;
        while(target.className !== pl.className) {
          if(target.className === 'pl-remove') {
            var isDel = parseInt(target.parentNode.getAttribute('data-track'), 10);

            playList.splice(isDel, 1);
            target.parentNode.parentNode.removeChild(target.parentNode);

            plLi = pl.querySelectorAll('li');

            [].forEach.call(plLi, function(el, i) {
              el.setAttribute('data-track', i);
            });

            if(!audio.paused) {

              if(isDel === index) {
                play();
              }

            }
            else {
              if(isEmptyList()) {
                empty();
              }
              else {
                // audio.currentTime = 0;
                audio.src = playList[index].file;
                document.title = trackTitle.innerHTML = playList[index].title;
                progressBar.style.width = 0;
              }
            }
            if(isDel < index) {
              index--;
            }

            return;
          }
          target = target.parentNode;
        }

      }
    }

    function plActive() {
      if(audio.paused) {
        plLi[index].classList.remove('pl-current');
        return;
      }
      var current = index;
      for(var i = 0, len = plLi.length; len > i; i++) {
        plLi[i].classList.remove('pl-current');
      }
      plLi[current].classList.add('pl-current');
    }


/**
 *  Player methods
 */
  function error() {
    !isEmptyList() && next();
  }
  function play() {

    index = (index > playList.length - 1) ? 0 : index;
    if(index < 0) index = playList.length - 1;

    if(isEmptyList()) {
      empty();
      return;
    }

    audio.src = playList[index].file;
    audio.preload = 'auto';
    document.title = trackTitle.innerHTML = playList[index].title;
    audio.play();
    notify(playList[index].title, {
      icon: playList[index].icon,
      body: 'Now playing',
      tag: 'music-player'
    });
    playBtn.classList.add('playing');
    plActive();
  }

  function prev() {
    index = index - 1;
    play();
  }

  function next() {
    index = index + 1;
    play();
  }

  function isEmptyList() {
    return playList.length === 0;
  }

  function empty() {
    audio.pause();
    audio.src = '';
    trackTitle.innerHTML = 'queue is empty';
    curTime.innerHTML = '--';
    durTime.innerHTML = '--';
    progressBar.style.width = 0;
    preloadBar.style.width = 0;
    playBtn.classList.remove('playing');
    pl.innerHTML = '<div class="pl-empty">PlayList is empty</div>';
  }

  function playToggle() {
    if(isEmptyList()) {
      return;
    }
    if(audio.paused) {
      audio.play();
      notify(playList[index].title, {
        icon: playList[index].icon,
        body: 'Now playing'
      });
      this.classList.add('playing');
    }
    else {
      audio.pause();
      this.classList.remove('playing');
    }
    plActive();
  }

  function volumeToggle() {
    if(audio.muted) {
      if(parseInt(volumeLength, 50) === 0) {
        volumeBar.style.height = '100%';
        audio.volume = 20;
      }
      else {
        volumeBar.style.height = volumeLength;
      }
      audio.muted = false;
      this.classList.remove('muted');
    }
    else {
      audio.muted = true;
      volumeBar.style.height = 0;
      this.classList.add('muted');
    }
  }

  function repeatToggle() {
    var repeat = this.classList;
    if(repeat.contains('ap-active')) {
      repeating = false;
      repeat.remove('ap-active');
    }
    else {
      repeating = true;
      repeat.add('ap-active');
    }
  }

  function plToggle() {
    this.classList.toggle('ap-active');
    pl.classList.toggle('hide');
  }

  function update() {
    if(audio.readyState === 0) return;

    var barlength = Math.round(audio.currentTime * (100 / audio.duration));
    progressBar.style.width = barlength + '%';

    var
    curMins = Math.floor(audio.currentTime / 60),
    curSecs = Math.floor(audio.currentTime - curMins * 60),
    mins = Math.floor(audio.duration / 60),
    secs = Math.floor(audio.duration - mins * 60);
    (curSecs < 10) && (curSecs = '0' + curSecs);
    (secs < 10) && (secs = '0' + secs);

    curTime.innerHTML = curMins + ':' + curSecs;
    durTime.innerHTML = mins + ':' + secs;

    var buffered = audio.buffered;
    if(buffered.length) {
      var loaded = Math.round(100 * buffered.end(0) / audio.duration);
      preloadBar.style.width = loaded + '%';
    }
  }

  function doEnd() {
    if(index === playList.length - 1) {
      if(!repeating) {
        audio.pause();
        plActive();
        playBtn.classList.remove('playing');
        return;
      }
      else {
        index = 0;
        play();
      }
    }
    else {
      index = (index === playList.length - 1) ? 0 : index + 1;
      play();
    }
  }

  function moveBar(evt, el, dir) {
    var value;
    if(dir === 'horizontal') {
      value = Math.round( ((evt.clientX - el.offset().left) + window.pageXOffset) * 100 / el.parentNode.offsetWidth);
      el.style.width = value + '%';
      return value;
    }
    else {
      var offset = (el.offset().top + el.offsetHeight)  - window.pageYOffset;
      value = Math.round((offset - evt.clientY));
      if(value > 100) value = 100;
      if(value < 0) value = 0;
      volumeBar.style.height = value + '%';
      return value;
    }
  }

  function handlerBar(evt) {
    rightClick = (evt.which === 3) ? true : false;
    seeking = true;
    seek(evt);
  }

  function handlerVol(evt) {
    rightClick = (evt.which === 3) ? true : false;
    seeking = true;
    setVolume(evt);
  }

  function seek(evt) {
    if(seeking && rightClick === false && audio.readyState !== 0) {
      var value = moveBar(evt, progressBar, 'horizontal');
      audio.currentTime = audio.duration * (value / 100);
    }
  }

  function seekingFalse() {
    seeking = false;
  }

  function setVolume(evt) {
    volumeLength = volumeBar.css('height');
    if(seeking && rightClick === false) {
      var value = moveBar(evt, volumeBar.parentNode, 'vertical') / 100;
      if(value <= 0) {
        audio.volume = 100;

      }
      else {

        audio.volume = value;

      }
    }
  }

  function notify(title, attr) {
    if(!settings.notification) {
      return;
    }
    if(window.Notification === undefined) {
      return;
    }
    window.Notification.requestPermission(function(access) {
      if(access === 'granted') {
        var notice = new Notification(title.substr(0, 110), attr);
        notice.onshow = function() {
          setTimeout(function() {
            notice.close();
          }, 5000);
        }
        // notice.onclose = function() {
        //   if(noticeTimer) {
        //     clearTimeout(noticeTimer);
        //   }
        // }
      }
    })
  }

/* Destroy method. Clear All */
  function destroy() {
    if(!apActive) return;

    playBtn.removeEventListener('click', playToggle, false);
    volumeBtn.removeEventListener('click', volumeToggle, false);
    repeatBtn.removeEventListener('click', repeatToggle, false);
    plBtn.removeEventListener('click', plToggle, false);

    progressBar.parentNode.parentNode.removeEventListener('mousedown', handlerBar, false);
    progressBar.parentNode.parentNode.removeEventListener('mousemove', seek, false);
    document.documentElement.removeEventListener('mouseup', seekingFalse, false);

    volumeBar.parentNode.parentNode.removeEventListener('mousedown', handlerVol, false);
    volumeBar.parentNode.parentNode.removeEventListener('mousemove', setVolume);
    document.documentElement.removeEventListener('mouseup', seekingFalse, false);

    prevBtn.removeEventListener('click', prev, false);
    nextBtn.removeEventListener('click', next, false);

    audio.removeEventListener('error', error, false);
    audio.removeEventListener('timeupdate', update, false);
    audio.removeEventListener('ended', doEnd, false);
    player.parentNode.removeChild(player);

    // Playlist
    pl.removeEventListener('click', listHandler, false);
    pl.parentNode.removeChild(pl);

    audio.pause();
    apActive = false;
  }


/**
 *  Helpers
 */
  function extend(defaults, options) {
    for(var name in options) {
      if(defaults.hasOwnProperty(name)) {
        defaults[name] = options[name];
      }
    }
    return defaults;
  }
  function create(el, attr) {
    var element = document.createElement(el);
    if(attr) {
      for(var name in attr) {
        if(element[name] !== undefined) {
          element[name] = attr[name];
        }
      }
    }
    return element;
  }

  Element.prototype.offset = function() {
    var el = this.getBoundingClientRect(),
    scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
    scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    return {
      top: el.top + scrollTop,
      left: el.left + scrollLeft
    };
  };

  Element.prototype.css = function(attr) {
    if(typeof attr === 'string') {
      return getComputedStyle(this, '')[attr];
    }
    else if(typeof attr === 'object') {
      for(var name in attr) {
        if(this.style[name] !== undefined) {
          this.style[name] = attr[name];
        }
      }
    }
  };


/**
 *  Public methods
 */
  return {
    init: init,
    destroy: destroy
  };

})();

window.AP = AudioPlayer;

})(window);


// test image for web notifications
var iconImage = 'http://funkyimg.com/i/21pX5.png';

AP.init({
  playList: [
    {'icon': iconImage, 'title': 'Masal Akarsu Yazan Kalem Siyah', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/4b11832e689f391e16a9f4033c5e831c.mp3'},
   
    {'icon': iconImage, 'title': 'Yazan Kalem Siyah', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/4b11832e689f391e16a9f4033c5e831c.mp3'},

    {'icon': iconImage, 'title': 'Allah Allah Ya Baba (Remix', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/64e4cb3e0cbb0b5d2bc7412d3453b6b0.mp3'},

    {'icon': iconImage, 'title': 'Alper Eğri Pablo Pablo (Remix)', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/4575fb140b92053d908f7fe32733885c.mp3'},

    {'icon': iconImage, 'title': 'Ağamda Şimdi Gelir (Remix)', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/317d147cded09ff2f7e08f538e6275db.mp3'},

    {'icon': iconImage, 'title': 'Ersan Er-Tanrım (Remix)', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/67771b52283ace8e5abcce8736beebb3.mp3'},

    {'icon': iconImage, 'title': 'Hamarat-At Kendini (Remix)', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/c646a7ee929734a94f293521191a963b.mp3'},

    {'icon': iconImage, 'title': 'Namussuz (Remix)', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/d647f3b8e4959ad76ca697c6a8c00ee5.mp3'},

    {'icon': iconImage, 'title': 'Alıştım Artık Yalnızlığa (Remix)', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/cd8d0732c61f47136f5341ec607d9365.mp3'},

    {'icon': iconImage, 'title': 'Ara Sıra (Fatih Yılmaz Remix)', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/474b58466c2c71a748f3f09e592917e3.mp3'},

    {'icon': iconImage, 'title': 'Yavrum Nerdesin (Remix)', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/0e804cf7a9dd2454699a6dfae28bc924.mp3'},

    {'icon': iconImage, 'title': 'Reynmen Leila (Remix)', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/8fd333f1cff59db7a448a48708141250.mp3'},

    {'icon': iconImage, 'title': 'Ben Asla Yaşayamam (Remix)', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/20684ffa246bae3905a60892b5beb682.mp3'},

    {'icon': iconImage, 'title': 'Beni Bu Geceden Öldür (Remix)', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/32cf44699079a34a1467545356a3006b.mp3'},

    {'icon': iconImage, 'title': 'Uslanmıyor Bu (Remix)', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/988095692c53362a8bf4694e82a30261.mp3'},

    {'icon': iconImage, 'title': 'Uzi Kervan (Remix)', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/26e488b183972303dc05ba412a39105f.mp3'},

    {'icon': iconImage, 'title': 'Gönlüm Vay (Remix)', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/9f98c46bc5b0195f740ccb2ffc6a54c1.mp3'},

    {'icon': iconImage, 'title': 'Masal Gibi (Remix)', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/3289c865f29fd7e103412e40e9db78e9.mp3'},

    {'icon': iconImage, 'title': 'Ah Keşkem (Remix)', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/9f3f5f9f1f8eef6677375db37758d7ce.mp3'},

    {'icon': iconImage, 'title': 'Aramam (Remix)', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/3ccf505a7a207ba797a162830aa662f9.mp3'},

    {'icon': iconImage, 'title': 'Leylayım Ben Sana (Remix)', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/49d81670f5eb047721b665993ef77e06.mp3'},

    {'icon': iconImage, 'title': '10 Numara (Remix)', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/92c56c3df1b1bc6068ce9118224df676.mp3'},

    {'icon': iconImage, 'title': 'Kafama Sıkasım Var (Remix)', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/e8a4097ac49c865d262d568271672558.mp3'},

    {'icon': iconImage, 'title': 'Derdim Olsun (Remix)', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/146a5b442f52694db10bf162a8ec29c5.mp3'},

    {'icon': iconImage, 'title': 'Eşarbını Yan Bağlama (Remix)', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/9223e3d28842301dff0fa4beb278b6e3.mp3'},

    {'icon': iconImage, 'title': 'Es Deli Deli (Remix)', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/4c8f57476fe1c86e47fe24b5f6de4864.mp3'},

    {'icon': iconImage, 'title': 'Ağrı Dağı (Remix)', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/6304c7bbb893e8cc98f4f25c26e6df84.mp3'},

    {'icon': iconImage, 'title': 'Ya Lili (Remix)', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/646f3129e1bd9364137c8d8fc960fa2a.mp3'},

    {'icon': iconImage, 'title': 'Tosuno (Remix)', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/5a67c3849cbf0c590ec4300b31e99067.mp3'},

    {'icon': iconImage, 'title': 'Aşkla Aynı Değil (Remix)', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/c38e58b561023d316b835c589d9e1ffc.mp3'},

    {'icon': iconImage, 'title': 'Yürekli Ol (Remix)', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/1d7f207b9851d5f9194cd4244532032c.mp3'},

    {'icon': iconImage, 'title': 'Duam Belli Duyan Belli (Remix)', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/5b0120b404537e34305fc1d39db85bd0.mp3'},

    {'icon': iconImage, 'title': 'Tren Gelir Hoş Gelir (Remix)', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/01e6194f1431cb1c595b56e0f5768a3a.mp3'},

    {'icon': iconImage, 'title': 'Ben Asla Yaşayamam (Remix)', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/2170769734bb38fc532884a9c03af361.mp3'},

    {'icon': iconImage, 'title': 'Eyvah Neye Yarar (Remix)', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/57e6eff976bb2a0113f178c298f88c03.mp3'},

    {'icon': iconImage, 'title': 'Tamam Aşkım (Remix)', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/d8672b2262d4723d6688856ab31ed116.mp3'},

    {'icon': iconImage, 'title': 'Gel Gör (Remix)', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/8276259d38d1a7a2ac621e0129e03d21.mp3'},

    {'icon': iconImage, 'title': 'Dom Dom Kurşunu (Remix)', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/4bb6acc980a0fa450f18ee4a1bd0ad4a.mp3'},

    {'icon': iconImage, 'title': 'Mavişim (Remix)', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/e37285282bc2c1ea18e2fb74d0f3ff44.mp3'},

    {'icon': iconImage, 'title': 'Bana Ayrılmak Düşer (Remix)', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/2e4d883796d8c5fc029360489a42fc67.mp3'},

    {'icon': iconImage, 'title': 'Daha Daha Nasılsınız (Remix)', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/fb5f1d78c51678dee40c9a94378a0de3.mp3'},

    {'icon': iconImage, 'title': 'Yaz Gülü (Remix)', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/b0bebc3bdbd0964b98f5bf003fc987fc.mp3'},





    {'icon': iconImage, 'title': 'Ara Sıra (Remix)', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/b72a026e0bc329670f7fbe74d8025602.mp3'}

   








  ]
});