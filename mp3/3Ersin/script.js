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




    {'icon': iconImage, 'title': 'Aman Tertip Can Tertip', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/b4691b38c93cca8c7bc2ca72a397107b.mp3'},
   
    {'icon': iconImage, 'title': 'Beni Muhammede Götürün', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/8202c5af3cadbf67975e99f1b70a51df.mp3'},

    {'icon': iconImage, 'title': 'Bir Ayrılık Bir Yoksulluk Bir Ölüm', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/d7f294198025f8fd30442fd3ec62f610.mp3'},

    {'icon': iconImage, 'title': 'Bugün Bana Yarın Sana', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/366c6982c9af77e384ae08b1a0fde2c6.mp3'},

    {'icon': iconImage, 'title': 'Çalın Davulları', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/9c2763695bd6f2b5668d5b652b7bb056.mp3'},

    {'icon': iconImage, 'title': 'Dağlar Seni Delik Delik Delerim', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/f3acf832124182e614a35443da3256f5.mp3'},

    {'icon': iconImage, 'title': 'Dere Boyu Kavaklar', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/9fd1cb3a08e350493491086c63218126.mp3'},

    {'icon': iconImage, 'title': 'Dostlar Beni Hatırlasın', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/857e80b35d2002b17971dd3d5e960cae.mp3'},

    {'icon': iconImage, 'title': 'Eklemedir Koca Konak', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/04969072b93387ae5d3ec77f004818a6.mp3'},

    {'icon': iconImage, 'title': 'Garip Gönlüm', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/5ccc2f9a9eca4f7e56b41aa49392668c.mp3'},

    {'icon': iconImage, 'title': 'Geçmiyor Günler', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/d0201d1f3f216cabadd154e9f25bce43.mp3'},

    {'icon': iconImage, 'title': 'Güneşe Dön Çiçeğim', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/41541634094931d65abf41bf3d2f7866.mp3'},

    {'icon': iconImage, 'title': 'Kirpiklerin Ok Ok Eyle', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/6fef6ab77ce9d44a197f6a74dcf5a5c2.mp3'},

    {'icon': iconImage, 'title': 'Kozan Dağı', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/8e467eb40e17b85a285b865dabc556b5.mp3'},

    {'icon': iconImage, 'title': 'Nalına Da Vur', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/e189e3d174b4360ebec9ca49e34b69fa.mp3'},

    {'icon': iconImage, 'title': 'Niye Çattın Kaşlarını', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/23fef19bca977514236023dd82a28227.mp3'},

    {'icon': iconImage, 'title': 'Ömür Biter Yollar Bitmez', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/57eddae2d180f6bc969aec7f17f1c305.mp3'},

    {'icon': iconImage, 'title': 'Paşa Gönlün Bilir', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/8daafdfad4c329829e9504f27c60a053.mp3'},

    {'icon': iconImage, 'title': 'Polis Haydar', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/451240b6b7b1c20a860b7d85e3ca6a11.mp3'}

   








  ]
});