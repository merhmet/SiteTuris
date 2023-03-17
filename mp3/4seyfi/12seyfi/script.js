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
       {'icon': iconImage, 'title': '♫ Aşkı Çekene Sor  ', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/64c71460efb749be2c697b0cc40a7dcb.mp3 '},      
   
       {'icon': iconImage, 'title': ' ♫ Hasret Bana Dertler Bana', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/bab40cc7f610061f5dd4261d74169ae6.mp3'},       
   
       {'icon': iconImage, 'title': ' ♫ Benim Kitabımda Ayrılık Yazmaz', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/6af2ce3a2858b04349d0b1c13da8231c.mp3 '},      
   
       {'icon': iconImage, 'title': ' ♫ Gözün Sevem', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/db235aa983402599af740f7b835d79fb.mp3 '},      
   
       {'icon': iconImage, 'title': '♫ Ne Yaptım Ki Ben ', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/284947a3c3481f885e889b88264689f2.mp3'},       
   
       {'icon': iconImage, 'title': '♫ Dön Garibim', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/e731d1c1f2a1a65362bff39996f6d35a.mp3 '},      
   
       {'icon': iconImage, 'title': ' ♫ Ölünmezmi De Hele', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/04e26ff04c4a34c476ebe9b3a8c7c477.mp3'},       
   
       {'icon': iconImage, 'title': ' ♫ Dağlar Gibi', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/564c7e1e8c1be1f0cd922209dad55c8a.mp3'},       
   
       {'icon': iconImage, 'title': '♫ Dersimo  ', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/c831f0e7d0e1518a0916e9fa32926b14.mp3'},      
   
       {'icon': iconImage, 'title': '  ♫ Kim Vurduya Gitti Ömrüm ', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/e043e629c1f595280c0f814c35168689.mp3 '},    
   
       {'icon': iconImage, 'title': ' ♫ Öl Deseydin Ölmezmiydim', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/ea23ce1b384497f04b8a51e1d83a5ea8.mp3 '},      

       {'icon': iconImage, 'title': '  ♫ Sebebi Sensin', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/196c8afd551099d60530b1b8b7b8df58.mp3'},      
   
       {'icon': iconImage, 'title': '♫ Olmayınca ', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/9e78bef53383ea33d9b33eb6e1751ae8.mp3'},       
   
       {'icon': iconImage, 'title': '♫ Çekemem ', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/33c4729f594cc4835ab56b26c62f491e.mp3'},       
   
       {'icon': iconImage, 'title': ' ♫ Elazığ Göl Arası', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/947a235453901ade8f296cade1251748.mp3'},       
   
       {'icon': iconImage, 'title': '♫ Kime Ne ', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/572bce77c1597a00ee395224c96433e8.mp3'},       
   
       {'icon': iconImage, 'title': ' ♫ Kara Kaş Altında Gözler ', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/988124ecc8c5b5475ff88b4d6aa798c0.mp3 '},     
   
       {'icon': iconImage, 'title': ' ♫ Bizi Bizden Ayırdılar', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/e80b8f879a561c13513eaa2f7cfc4811.mp3'},       
   
       {'icon': iconImage, 'title': ' ♫ Pişman Olursun ', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/c2b51ae3ecaf306ee43a3b157f135262.mp3'},      
   
       {'icon': iconImage, 'title': '♫ Pişman Olursun ', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/c2b51ae3ecaf306ee43a3b157f135262.mp3'},       
   
       {'icon': iconImage, 'title': '♫ Ben Nice Bir Dayanağım ', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/302cef857f97c24026b4e63a6ea2ffc1.mp3 '},      
 
       {'icon': iconImage, 'title': ' ♫ Yaban Eller', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/d2b2d724cd1531f7688467c71460df27.mp3 '},      
   
       {'icon': iconImage, 'title': '♫ Demirden Mi Taştan Mısın   ', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/1da7f0c54be4cd80aa14a919e337768e.mp3'},     
   
       {'icon': iconImage, 'title': '♫ Gelmedin Gelecektin ', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/0ea85f8b88127281c8a03dbb672dc160.mp3'},       
   
       {'icon': iconImage, 'title': ' ♫ Hain  ', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/ffcea58f5a8f4e0a3bb8159482c7783f.mp3 '},    
   
       {'icon': iconImage, 'title': '♫ Geri Gel ', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/770b18c4105c12bfe9a60ffafec59074.mp3  '},     
   
       {'icon': iconImage, 'title': ' ♫ İşte Doktor', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/d670f79b1f89766b7d70cbd283f63ef7.mp3 '},      
   
       {'icon': iconImage, 'title': ' ♫ Aman Felek ', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/5c35f2dbe95a51174e614585ce60457e.mp3 '},     
   
       {'icon': iconImage, 'title': ' ♫ Bu Dere ', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/5bf5d03371d499ba71bc6e84f72d82d1.mp3  '},    

       {'icon': iconImage, 'title': ' ♫ Benden Gizli İşlerin Mi Var', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/bb9c2940b6e7d1b1abb93f713dbddd4b.mp3 '},      
   
       {'icon': iconImage, 'title': '♫ Düşürdün Beni ', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/61ed047be724fab2c2463ac925c0b321.mp3  '},     
   
       {'icon': iconImage, 'title': ' ♫ Çocuk Gibi ', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/3fa45fc8edb76fe807e67785b678cf33.mp3 '},     
   
       {'icon': iconImage, 'title': '♫ Delidir Seni Sevmeyen ', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/96e414521f2ae27880c10bcddaebe465.mp3 '},      
   
       {'icon': iconImage, 'title': ' ♫ Veremediler ', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/bf7630bcd63068466fe6ababff442b0e.mp3'},      
   
       {'icon': iconImage, 'title': '♫ Nerdesin  ', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/4362c6db87c10d23718928958b6bc8bb.mp3'},      
   
       {'icon': iconImage, 'title': '  ♫ Kollarına Al Beni', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/d0596195d876bb9c5613dced38818ca7.mp3'},      
   
       {'icon': iconImage, 'title': ' ♫ Fatma ', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/a7251e388db062bae0794616de34b82a.mp3'},       
   
       {'icon': iconImage, 'title': ' ♫ Bağın Kurusun ', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/c99a9eb54e8a816d91e782c56948bafc.mp3'},      

       {'icon': iconImage, 'title': '  ♫ Yollara Düşerim ', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/cbd103089863c30afe40305a482b24b9.mp3 '},    
   
       {'icon': iconImage, 'title': '♫ Vahlar Bana ', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/9bd62ab386908eb147e0d67f689cf0ad.mp3'},       
   
       {'icon': iconImage, 'title': ' ♫ Sır Oldun ', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/bc738dc181a533b1f1a936a16c7391a2.mp3 '},     
   
       {'icon': iconImage, 'title': ' ♫ Senin Elde Ne İşin Var ', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/f274356647368cd26a71eea2b41a4da2.mp3'},      
   
       {'icon': iconImage, 'title': ' ♫ Sebebim Oy', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/6c24a95c762620dcf61f7b75507869a5.mp3 '},      
   
       {'icon': iconImage, 'title': ' ♫ Kötü Şansım', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/f8bdf1ce8ecdadebc344f62457675bc6.mp3 '},      
   
       {'icon': iconImage, 'title': '♫ İsyan ', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/7ae5a1984820447c2e474c57fe504f9d.mp3'},       
   
       {'icon': iconImage, 'title': ' ♫ İstanbula Gelme  ', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/1ac95ec7c927a35683f3b807695b2827.mp3'},     
   
       {'icon': iconImage, 'title': ' ♫ Duvarlarda Konuşmuyor', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/0af906098aeb911ae82206793f579030.mp3 '},      
   
       {'icon': iconImage, 'title': ' ♫ Ölüm Ölüm Öldüm Burda', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/1fb57f8a5b4b1e61666d93381431abfa.mp3 '},      

       {'icon': iconImage, 'title': ' ♫ Sermayem Sırtımda', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/a3dabac459ce5491c23d91afddca2457.mp3'},       
   
       {'icon': iconImage, 'title': ' ♫ Biçare Düşün', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/4ba078ca1360e5856144349374cf4d24.mp3'},       
   
       {'icon': iconImage, 'title': ' ♫ Zalim Hasret', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/7b78b82a62f18a5148f8a31325fd124c.mp3 '},      
   
       {'icon': iconImage, 'title': ' ♫ Sevda', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/c21d4519001b77fb3f2584923c64a5f9.mp3'},       
   
       {'icon': iconImage, 'title': '♫ Yıkarım Hozatı ', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/3599c6146a64e87a75e39ea61999617e.mp3'},       
   
       {'icon': iconImage, 'title': ' ♫ Çarsamba Beyleri', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/2f71e058c1c635c66e1f0f7b974b2d76.mp3'},       
   
       {'icon': iconImage, 'title': ' ♫ Küs Bana ', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/c0866ab457e74eed7253944647180cb7.mp3 '},     
   
       {'icon': iconImage, 'title': '♫ Ne Diyeceğim  ', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/84fdb148a675e7a575e8fef6a384b33b.mp3  '},    

       {'icon': iconImage, 'title': '♫ Aralarda ', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/93f8aa57da8b811c56d6685c1ec7298c.mp3 '},      
   
       {'icon': iconImage, 'title': '  ♫ Yak Felek  ', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/c2d64884156991d45ded409ead477435.mp3 '},   
   
       {'icon': iconImage, 'title': '  ♫  Senin Yüzünden', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/f1d75ca467c1e305a5787a57e4b5932c.mp3'},      
   
       {'icon': iconImage, 'title': ' ♫ Gitti', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/4b1a95354a5313723cc01f2b83d97202.mp3'},       
   
       {'icon': iconImage, 'title': '♫ Ben Ağlarsam  ', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/756839cdbebcbdb52662e883461b6a0c.mp3'},      
   
       {'icon': iconImage, 'title': ' ♫ Günün Birinde ', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/011d6ac65c569ed6dd721a8f386d48e1.mp3 '},     
   
       {'icon': iconImage, 'title': ' ♫ Söyleyin  ', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/4bea15537b99710d03cdf49f26ebdafe.mp3'},     
   
       {'icon': iconImage, 'title': '♫ Unutulmuyor  ', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/d910eca612deeb80c8ff307331a42dea.mp3'},      
   
       {'icon': iconImage, 'title': ' ♫ Gelmeyince', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/4fbd47089f59358c39514a8e0139d2c4.mp3'},       
   
       {'icon': iconImage, 'title': '  ♫ Yaşlandım mı Ne ', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/c7a0686e35192300b31e7bed43dbfce5.mp3 '},    
   
       {'icon': iconImage, 'title': ' ♫ Ni Deyim ', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/4286d6048ae566d95a19c6ab9dac5193.mp3 '},     
   
       {'icon': iconImage, 'title': ' ♫ Mavi Yelek', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/555a56e4aa9682c138bd6159949705a1.mp3'},       
 
       {'icon': iconImage, 'title': '  ♫ Hevalo ', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/10ab40f8d34814a229e3339b5125076b.mp3 '},     
   
       {'icon': iconImage, 'title': '♫ Bul Beni  ', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/8d335d49fa46cd0dc76ab27ff89c15be.mp3'},      
   
       {'icon': iconImage, 'title': '  ♫ Yüzün Gülmesin', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/c0738ae759f0ca92eadd4cb540964541.mp3'},      
   
       {'icon': iconImage, 'title': '♫ El Et  ', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/6182eb4d78c0af472d60064248dc80a1.mp3 '},     
   
       {'icon': iconImage, 'title': '♫ Zorundamıyım  ', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/737786dc285b064bc4db2527b2a0738f.mp3'},      
   
       {'icon': iconImage, 'title': '♫ Teslim Oldum ', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/301ea0f206a2d42d324e7c47b956c70b.mp3'},       
   
       {'icon': iconImage, 'title': '♫ Topraklar Başıma ', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/4812ec85f00f9c5c08231fd4fb649913.mp3 '},     
   
       {'icon': iconImage, 'title': ' ♫ Sevdim ', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/97163469543e8b495de10922e575c6e5.mp3 '},     
   
       {'icon': iconImage, 'title': '  ♫ Yürü Kervanlarım ', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/edb18c91143d979acc63de05043894ee.mp3 '},    
   
       {'icon': iconImage, 'title': '♫ Tu Dersimi Ez Serhedim  ', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/9f547f56f9c24e40336c1ab45e0f6a60.mp3 '},     

       {'icon': iconImage, 'title': ' ♫ Sevmem', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/b3c77f1cad045e31c9fc6a3d179f5225.mp3 '},      
   
       {'icon': iconImage, 'title': ' ♫ Aramasın', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/8f8ea0b85890a54ff64137ef59f54a46.mp3'},       
   
       {'icon': iconImage, 'title': '♫ Ver İçem ', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/bf92ca1b91bae5cc761969125ecbbafb.mp3'},     
   
       {'icon': iconImage, 'title': '  ♫ Allah Kahretsin ', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/913fe801277375cae3f141664fe4d930.mp3'},     
   
       {'icon': iconImage, 'title': '♫ Bu Ayrılık Neyin Nesi ', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/c14b4f4178441d3b0808abaca14ad429.mp3'},       
   
       {'icon': iconImage, 'title': ' ♫ Saçımın Akına Bakmayın  ', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/9e0d7e61f1275baebbb5122c11a2f4db.mp3 '},    
   
       {'icon': iconImage, 'title': ' ♫ Kaderin Tuzakları', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/c9679514dfc36e8e8ed03768ebbc5793.mp3'},       
   
       {'icon': iconImage, 'title': '♫ Kaderim Kader Olsaydı ', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/06834367d5632170d5fe9b840c71de40.mp3 '},      

       {'icon': iconImage, 'title': ' ♫ Dayı', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/253ad7a3db975ab6ee008c4a86a14fa0.mp3 '},      
   
       {'icon': iconImage, 'title': ' ♫ Sen Geleydin', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/37de9ae9ed71896298dab713485f6bb7.mp3'},       
   
       {'icon': iconImage, 'title': ' ♫ Unutma Yeter', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/0b4674dc1fed58ffce5bf9ee05df3cb0.mp3 '},      
   
       {'icon': iconImage, 'title': '♫ Aşk Acısı  ', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/265771b80416e7452c769d823c149045.mp3'},      
   
       {'icon': iconImage, 'title': ' ♫ Git Yoluna', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/6d57c9888578d27e8638bb9c0a1da250.mp3'},       
   
       {'icon': iconImage, 'title': '  ♫ Hemi', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/05fea19d3d30a116ead547d217bbaf3d.mp3 '},     
   
       {'icon': iconImage, 'title': ' ♫ Meyhaneci', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/3220bc8727e3bba9a08df34f6366dd9f.mp3 '},      
   
       {'icon': iconImage, 'title': '♫ Sevda Yemini ', 'file': 'https://cdn.muzikmp3indir.com/mp3_files/892942e835d929910fe3712711109265.mp3 '}  
   








  ]
});