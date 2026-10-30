(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const scrollTo = element => element.scrollIntoView({behavior:motion.matches ? 'instant' : 'smooth', block:'start'});

  function updateCounter(now = new Date()) {
    const state = StoryCalendar.at(now, document.body.dataset.start, document.body.dataset.anniversary);
    $('#days').textContent = String(state.elapsed);
    $('#counter-date').textContent = state.todayDisplay;
    $('#counter-date').dateTime = state.today;
    $('#anniversary-status').textContent = state.status;
  }
  updateCounter();
  setInterval(updateCounter, 60000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) updateCounter(); });

  const album = $('#album-dialog'), lightbox = $('#lightbox');
  const featured = $$('#gallery [data-photo]'), allPhotos = $$('#all-photos [data-photo]');
  const image = $('#lightbox-image'), imageError = $('#image-error');
  let activePhotos = [], activeIndex = 0;
  const syncScrollLock = () => document.body.classList.toggle('modal-open', album.open || lightbox.open);
  $('#open-album').addEventListener('click', () => { album.showModal(); syncScrollLock(); $('#close-album').focus(); });
  $('#close-album').addEventListener('click', () => album.close());
  [album, lightbox].forEach(dialog => {
    dialog.addEventListener('close', syncScrollLock);
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const box = dialog.getBoundingClientRect();
      if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
    });
  });
  $('#event-filter').addEventListener('change', event => {
    let count = 0;
    $$('#all-photos .memory-chapter').forEach(chapter => {
      chapter.hidden = event.target.value !== 'all' && chapter.dataset.event !== event.target.value;
      if (!chapter.hidden) count += chapter.querySelectorAll('[data-photo]').length;
    });
    $('#photo-count').textContent = `${count} ảnh`;
  });
  function showPhoto(index) {
    activeIndex = (index + activePhotos.length) % activePhotos.length;
    const card = activePhotos[activeIndex];
    image.hidden = false; imageError.hidden = true;
    image.alt = card.querySelector('img').alt;
    image.src = card.dataset.photo;
    $('#lightbox-caption').textContent = card.dataset.caption;
    $('#lightbox-position').textContent = `${String(activeIndex + 1).padStart(2,'0')} / ${String(activePhotos.length).padStart(2,'0')}`;
    $('#photo-prev').hidden = $('#photo-next').hidden = activePhotos.length < 2;
  }
  $$('.photo-card').forEach(card => {
    card.addEventListener('click', () => {
      activePhotos = card.closest('#all-photos') ? allPhotos.filter(photo => !photo.closest('.memory-chapter').hidden) : featured;
      showPhoto(activePhotos.indexOf(card)); lightbox.showModal(); syncScrollLock(); $('#lightbox-close').focus();
    });
    const preview = card.querySelector('img');
    preview.addEventListener('error', () => card.classList.add('photo-load-error'));
    preview.addEventListener('load', () => card.classList.remove('photo-load-error'));
    if (preview.complete && !preview.naturalWidth) card.classList.add('photo-load-error');
  });
  image.addEventListener('error', () => { image.hidden = true; imageError.hidden = false; });
  image.addEventListener('load', () => { image.hidden = false; imageError.hidden = true; });
  $('#retry-image').addEventListener('click', () => {
    image.hidden = false; imageError.hidden = true;
    image.src = `${activePhotos[activeIndex].dataset.photo}?retry=${Date.now()}`;
  });
  $('#photo-prev').addEventListener('click', () => showPhoto(activeIndex - 1));
  $('#photo-next').addEventListener('click', () => showPhoto(activeIndex + 1));
  $('#lightbox-close').addEventListener('click', () => lightbox.close());
  lightbox.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); showPhoto(activeIndex - 1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); showPhoto(activeIndex + 1); }
  });

  const envelope = $('#envelope'), seal = $('#seal'), letter = $('#letter-content');
  function setLetter(open) {
    envelope.classList.toggle('is-open',open); letter.hidden = !open;
    seal.setAttribute('aria-expanded',String(open));
    seal.setAttribute('aria-label',open ? 'Gấp thư anh gửi Mox' : 'Mở lá thư anh gửi Mox');
    $('.envelope-prompt').replaceChildren(document.createTextNode(open ? 'Gấp thư lại ↗' : 'Mở thư anh viết ↗'));
    if (open) { letter.focus({preventScroll:true}); scrollTo(letter); }
    else { seal.focus({preventScroll:true}); scrollTo(seal); }
  }
  seal.addEventListener('click', () => setLetter(letter.hidden));
  $('#close-letter').addEventListener('click', () => setLetter(false));
  letter.addEventListener('keydown', event => { if (event.key === 'Escape') { event.preventDefault(); setLetter(false); } });

  const hugs = ['Ôm em một cái. Hôm nay vất vả rồi.', 'Có anh ở đây. Mình cứ từ từ nhé.', 'Anh yêu em. Cả Sữa nữa, tất nhiên.'];
  let hugCount = 0;
  $('#send-kiss').addEventListener('click', () => {
    $('#kiss-message').textContent = hugs[hugCount++ % hugs.length];
    // A single heart beside the button, never a full-screen effect.
    const wrap = $('.hug-wrap');
    wrap.classList.remove('is-hugged');
    if (motion.matches) { wrap.classList.add('is-hugged'); return; }
    requestAnimationFrame(() => requestAnimationFrame(() => wrap.classList.add('is-hugged')));
  });

  const music = $('#background-music'), sound = $('#sound'), soundLabel = $('.sound-label');
  music.volume = .28;
  function syncSound() {
    const playing = !music.paused && !music.ended;
    sound.setAttribute('aria-pressed',String(playing));
    sound.setAttribute('aria-label',`${playing ? 'Tắt' : 'Bật'} nhạc nền I Love You Baby`);
    soundLabel.textContent = playing ? 'Tắt nhạc' : 'Bật nhạc';
  }
  music.addEventListener('play',syncSound); music.addEventListener('pause',syncSound);
  function musicFailed() {
    music.pause(); syncSound();
    soundLabel.textContent = 'Thử lại'; sound.setAttribute('aria-label','Thử bật nhạc nền lại');
    sound.disabled = false; sound.removeAttribute('aria-busy');
  }
  // A failed <source> does not consistently dispatch an error on <audio>.
  music.addEventListener('error',musicFailed);
  music.querySelector('source').addEventListener('error',musicFailed);
  sound.addEventListener('click', async () => {
    if (!music.paused) { music.pause(); return; }
    sound.disabled = true; sound.setAttribute('aria-busy','true');
    const deadline = setTimeout(musicFailed,15000);
    try { if (music.error || music.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) music.load(); await music.play(); }
    catch { musicFailed(); }
    finally { clearTimeout(deadline); sound.disabled = false; sound.removeAttribute('aria-busy'); }
  });
  syncSound();

  // Content is readable immediately. These short transitions never gate a chapter.
  if ('IntersectionObserver' in window) {
    if (!motion.matches) {
      const reveal = new IntersectionObserver(entries => entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('soft-reveal'); reveal.unobserve(entry.target); }
      }), {threshold:.08});
      $$('.section-heading,.begin-grid,.letter-intro,.ending-grid').forEach(element => reveal.observe(element));
    }
    const links = $$('.chapter-nav a');
    const chapters = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) links.forEach(link => {
        if (link.hash === `#${entry.target.id}`) link.setAttribute('aria-current','location'); else link.removeAttribute('aria-current');
      }); });
    }, {rootMargin:'-12% 0px -62% 0px'});
    $$('main > .chapter').forEach(chapter => chapters.observe(chapter));
  }
  // Keep earlier shared links useful after merging the old scenes.
  const aliases = {'#postcredits':'#tomorrow','#pet':'#sua-note-title','#ticket':'#home','#night-city':'#memories','#reel':'#memories','#quiet-notes':'#letter','#red-room':'#begin','#journeys':'#memories'};
  if (aliases[location.hash]) $(aliases[location.hash]).scrollIntoView({behavior:'instant',block:'start'});
})();
