(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const start = new Date(document.body.dataset.start + 'T00:00:00+07:00');
  const anniversary = new Date(document.body.dataset.anniversary + 'T00:00:00+07:00');
  const dateText = new Intl.DateTimeFormat('en-GB', {day:'2-digit',month:'2-digit',year:'numeric',timeZone:'Asia/Bangkok'}).format(anniversary).replaceAll('/', '.');
  function updateDays() {
    $('#days').textContent = Math.max(0, Math.floor((Date.now() - start.getTime()) / 86400000)).toLocaleString('vi-VN');
    const left = Math.ceil((anniversary.getTime() - Date.now()) / 86400000);
    $('#anniversary-status').textContent = left > 0 ? `${dateText}. Còn ${left} ngày đến hai năm.` : `${dateText}. Hai năm. Mình vẫn đi tiếp.`;
  }
  updateDays(); setInterval(updateDays, 60000);
  $('#film-look').addEventListener('click', () => {
    const original = document.body.classList.toggle('original-photos');
    $('#film-look').setAttribute('aria-pressed',String(!original));
    $('#film-look').replaceChildren(document.createTextNode(original ? '◉ Ảnh gốc ' : '◉ Màu phim '));
    const hint = document.createElement('span'); hint.textContent = original ? '/ trở lại màu phim' : '/ xem ảnh gốc'; $('#film-look').append(hint);
  });
  const cards = [...document.querySelectorAll('#gallery [data-photo]')];
  let activeIndex = 0, activePhotos = [];
  document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
    document.querySelectorAll('[data-filter]').forEach(other => { const on = other === button; other.classList.toggle('selected', on); other.setAttribute('aria-pressed', String(on)); });
    cards.forEach(card => { card.hidden = button.dataset.filter !== 'all' && card.dataset.category !== button.dataset.filter; });
    const visibleCount = cards.filter(card => !card.hidden).length;
    $('#filter-empty').hidden = visibleCount > 0;
    $('#gallery').classList.toggle('single',visibleCount === 1);
  }));
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
  const hugs = ['Lại gần anh, cho đêm bớt rộng.', 'Giờ khắc cứ trôi. Mình ở đây thêm một chút.', 'kiss RockKiss. Anh vẫn chọn em.'];
  let sent = 0;
  $('#send-kiss').addEventListener('click', () => { burst($('#send-kiss')); $('#kiss-message').textContent = hugs[sent++ % hugs.length]; });
  // A quiet original piano-like loop synthesized locally. Starts only on request.
  let audio, bus, playing = false, timer;
  const notes = [261.63,311.13,392,466.16,392,293.66,261.63,349.23,415.30,523.25,415.30,349.23,233.08,293.66,349.23,440,349.23,293.66];
  let noteIndex = 0;
  function note(frequency, when, volume=.11) {
    const voice = audio.createGain(); voice.gain.setValueAtTime(0,when); voice.gain.linearRampToValueAtTime(volume,when+.025); voice.gain.exponentialRampToValueAtTime(.0001,when+2.8); voice.connect(bus);
    for (const [overtone,level] of [[1,1],[2,.23],[3,.06]]) {
      const osc = audio.createOscillator(), partial = audio.createGain(); osc.type='sine'; osc.frequency.value=frequency*overtone; partial.gain.value=level;
      osc.connect(partial); partial.connect(voice); osc.start(when); osc.stop(when+3);
    }
    setTimeout(() => voice.disconnect(),3500);
  }
  function playStep() {
    if (!playing) return;
    note(notes[noteIndex % notes.length],audio.currentTime+.02);
    if (noteIndex % 3===0) note([130.81,174.61,116.54][Math.floor(noteIndex / 6) % 3],audio.currentTime+.02,.045);
    noteIndex++; timer=setTimeout(playStep,1050);
  }
  $('#sound').addEventListener('click',async () => {
    try {
      if (!audio) { const Audio=window.AudioContext||window.webkitAudioContext; if(!Audio)throw new Error('unsupported'); audio=new Audio(); bus=audio.createGain(); bus.gain.value=.35; bus.connect(audio.destination); }
      await audio.resume(); playing=!playing;
      if(playing){bus.gain.setTargetAtTime(.35,audio.currentTime,.2);playStep();}
      else{clearTimeout(timer);bus.gain.setTargetAtTime(0,audio.currentTime,.3);}
      $('#sound').setAttribute('aria-pressed',String(playing)); $('.sound-label').textContent=playing?'tắt nhạc':'bật một chút nhạc';
    } catch { $('.sound-label').textContent='Âm thanh chưa mở được.'; }
  });
})();
