(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  $('#film-look').addEventListener('click', () => {
    const original = document.body.classList.toggle('original-photos');
    $('#film-look').setAttribute('aria-pressed',String(!original));
    $('#film-look').replaceChildren(document.createTextNode(original ? '◉ Ảnh gốc ' : '◉ Màu ảnh '));
    const hint = document.createElement('span'); hint.textContent = original ? '/ đổi màu ảnh' : '/ xem ảnh gốc'; $('#film-look').append(hint);
  });
  const cards = [...document.querySelectorAll('#gallery [data-photo]')];
  let activeIndex = 0, activePhotos = [];
  const eventFilter = $('#event-filter');
  const chapters = [...document.querySelectorAll('.memory-chapter')];
  let categoryFilter = 'all';
  function applyAlbumFilters() {
    cards.forEach(card => {
      const categoryMatches = categoryFilter === 'all' || (categoryFilter === 'family' ? ['family','pet'].includes(card.dataset.category) : card.dataset.category === categoryFilter);
      card.hidden = !categoryMatches || (eventFilter.value !== 'all' && card.dataset.event !== eventFilter.value);
    });
    let chapterCount = 0;
    chapters.forEach(chapter => {
      const visible = [...chapter.querySelectorAll('[data-photo]')].filter(card => !card.hidden).length;
      chapter.hidden = visible === 0;
      chapter.querySelector('.chapter-photos').classList.toggle('single',visible === 1);
      chapter.querySelector('.chapter-photos').classList.toggle('duet',visible === 2);
      chapter.querySelector('.chapter-count').textContent = visible + ' ảnh';
      if (visible) chapterCount++;
    });
    const visibleCount = cards.filter(card => !card.hidden).length;
    $('#filter-empty').hidden = visibleCount > 0;
    $('#photo-count').textContent = visibleCount + ' ảnh · ' + chapterCount + ' mục';
  }
  document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
    categoryFilter = button.dataset.filter;
    document.querySelectorAll('[data-filter]').forEach(other => { const on = other === button; other.classList.toggle('selected',on); other.setAttribute('aria-pressed',String(on)); });
    applyAlbumFilters();
  }));
  eventFilter.addEventListener('change',applyAlbumFilters);
  document.querySelectorAll('.journey-timeline a').forEach(link => link.addEventListener('click',() => {
    eventFilter.value = 'all'; categoryFilter = 'all';
    document.querySelectorAll('[data-filter]').forEach(button => { const on = button.dataset.filter === 'all'; button.classList.toggle('selected',on); button.setAttribute('aria-pressed',String(on)); });
    applyAlbumFilters();
  }));
  applyAlbumFilters();
  function showPhoto(index) {
    if (!activePhotos.length) return;
    activeIndex = (index + activePhotos.length) % activePhotos.length;
    const card = activePhotos[activeIndex];
    $('#lightbox-image').src = card.dataset.photo; $('#lightbox-image').alt = card.querySelector('img').alt;
    $('#lightbox-caption').textContent = card.dataset.caption || card.querySelector('img').alt;
    $('#photo-prev').hidden = $('#photo-next').hidden = activePhotos.length < 2;
  }
  document.querySelectorAll('[data-photo]').forEach(card => card.addEventListener('click', () => {
    activePhotos = card.closest('#gallery') ? cards.filter(photo => !photo.hidden) : [card];
    showPhoto(activePhotos.indexOf(card)); $('#lightbox').showModal();
  }));
  $('#photo-prev').addEventListener('click', () => showPhoto(activeIndex - 1));
  $('#photo-next').addEventListener('click', () => showPhoto(activeIndex + 1));
  $('#lightbox-close').addEventListener('click', () => $('#lightbox').close());
  $('#lightbox').addEventListener('click', event => { if (event.target === $('#lightbox')) $('#lightbox').close(); });
  $('#lightbox').addEventListener('keydown', event => { if (event.key === 'ArrowLeft') { event.preventDefault(); showPhoto(activeIndex - 1); } if (event.key === 'ArrowRight') { event.preventDefault(); showPhoto(activeIndex + 1); } });
  function burst(button) {
    if (reducedMotion) return;
    const box = button.getBoundingClientRect();
    for (let i = 0; i < 12; i++) {
      const heart = document.createElement('span'); heart.className = 'hug-particle'; heart.textContent = '♡';
      heart.style.cssText = `--x:${box.left+box.width/2}px;--y:${box.top+box.height/2}px;--dx:${(Math.random()-.5)*280}px;--dy:${-60-Math.random()*180}px`;
      $('#particles').append(heart); setTimeout(() => heart.remove(), 1800);
    }
  }
  $('#seal').addEventListener('click', () => {
    burst($('#seal')); $('#envelope-front').hidden = true; $('#letter-content').hidden = false;
    $('#letter-content').focus({preventScroll:true}); $('#letter-content').scrollIntoView({behavior:reducedMotion?'instant':'smooth',block:'start'});
  });
  $('#close-letter').addEventListener('click', () => {
    $('#letter-content').hidden = true; $('#envelope-front').hidden = false; $('#seal').focus({preventScroll:true});
    $('#envelope').scrollIntoView({behavior:reducedMotion?'instant':'smooth',block:'center'});
  });
  const hugs = ['Cho anh ôm một cái nhé.', 'Cảm ơn em vì đã ở bên anh.', 'kiss Rockiss. Thương em.'];
  let sent = 0;
  $('#send-kiss').addEventListener('click', () => { burst($('#send-kiss')); $('#kiss-message').textContent = hugs[sent++ % hugs.length]; });
  const music = $('#background-music'), sound = $('#sound'), soundLabel = $('.sound-label');
  music.volume = .28;
  function syncSoundState() {
    const playing = !music.paused && !music.ended;
    sound.setAttribute('aria-pressed',String(playing));
    sound.setAttribute('aria-label',`${playing ? 'Tắt' : 'Bật'} nhạc nền I Love You Baby`);
    soundLabel.textContent = playing ? 'tắt nhạc nền' : 'bật nhạc nền';
  }
  music.addEventListener('play',syncSoundState);
  music.addEventListener('pause',syncSoundState);
  music.addEventListener('error',() => {
    syncSoundState(); soundLabel.textContent = 'thử bật nhạc lại';
  });
  async function startMusic() {
    try {
      if (music.error) music.load();
      await music.play();
    } catch (error) {
      syncSoundState();
      if (error.name === 'AbortError') return;
      soundLabel.textContent = error.name === 'NotAllowedError' ? 'chạm để bật nhạc' : 'thử bật nhạc lại';
    }
  }
  sound.addEventListener('click',() => {
    if (!music.paused) { music.pause(); return; }
    startMusic();
  });
  syncSoundState();
  const premiere = $('#premiere'), openFilm = $('#open-film'), film = $('#film-content');
  openFilm.disabled = false;
  openFilm.addEventListener('click',() => {
    // Keep playback in this click's user activation, before any transition or navigation.
    startMusic();
    openFilm.disabled = true;
    film.hidden = false;
    film.inert = false;
    document.body.classList.remove('awaiting-premiere');
    window.scrollTo({top:0,behavior:'instant'});
    $('#story').focus({preventScroll:true});
    premiere.inert = true;
    premiere.setAttribute('aria-hidden','true');
    premiere.classList.add('is-opening');
    if (reducedMotion) premiere.hidden = true;
    else {
      premiere.addEventListener('transitionend',event => {
        if (event.target === premiere) premiere.hidden = true;
      },{once:true});
      setTimeout(() => { premiere.hidden = true; },1000);
    }
  },{once:true});
})();
