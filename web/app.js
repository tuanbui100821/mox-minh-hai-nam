(() => {
  'use strict';
  const $=selector=>document.querySelector(selector);
  const $$=selector=>[...document.querySelectorAll(selector)];
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  const scrollTo=(element,block='start',instant=false)=>element.scrollIntoView({behavior:instant||motion.matches?'instant':'smooth',block});
  const premiere=$('#premiere'),film=$('#film-content'),openFilm=$('#open-film');
  const lightbox=$('#lightbox'),image=$('#lightbox-image');
  const cards=$$('#gallery [data-photo]'),chapters=$$('.memory-chapter');
  let activePhotos=[],activeIndex=0,categoryFilter='all';
  const eventFilter=$('#event-filter');

  function updateCalendar() {
    const state=StoryCalendar.at(new Date(),document.body.dataset.start,document.body.dataset.anniversary,document.body.dataset.displayMode);
    $('#days').textContent=String(state.elapsed); $('#counter-date').textContent=state.todayDisplay; $('#counter-date').dateTime=state.today;
    $('#counter-label').textContent=state.label;$('#counter-context').textContent=state.context;$('#celebration-note').textContent=state.note;
    $('#anniversary-status').textContent=state.status; $('#anniversary-lead').textContent=state.lead; $('#together-line').textContent=state.together;
  }
  updateCalendar(); setInterval(updateCalendar,60000);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)updateCalendar();});
  $('#film-look').addEventListener('click',()=>{
    const original=document.body.classList.toggle('original-photos');
    $('#film-look').setAttribute('aria-pressed',String(!original));
    $('#film-look').replaceChildren(document.createTextNode(original?'◉ Ảnh gốc ':'◉ Màu ảnh '));
    const hint=document.createElement('span');hint.textContent=original?'/ đổi màu ảnh':'/ xem ảnh gốc';$('#film-look').append(hint);
  });
  function applyAlbumFilters() {
    cards.forEach(card=>{
      const category=categoryFilter==='all'||(categoryFilter==='family'?['family','pet'].includes(card.dataset.category):card.dataset.category===categoryFilter);
      card.hidden=!category||(eventFilter.value!=='all'&&card.dataset.event!==eventFilter.value);
    });
    let count=0;
    chapters.forEach(chapter=>{
      const visible=[...chapter.querySelectorAll('[data-photo]')].filter(card=>!card.hidden).length;
      chapter.hidden=!visible; chapter.querySelector('.chapter-photos').classList.toggle('single',visible===1);chapter.querySelector('.chapter-photos').classList.toggle('duet',visible===2);
      chapter.querySelector('.chapter-count').textContent=visible+' ảnh';if(visible)count++;
    });
    const visible=cards.filter(card=>!card.hidden).length;
    $('#filter-empty').hidden=!!visible;$('#photo-count').textContent=`${visible} ảnh · ${count} mục`;
    $$('[data-filter]').forEach(button=>{const selected=button.dataset.filter===categoryFilter;button.classList.toggle('selected',selected);button.setAttribute('aria-pressed',String(selected));});
  }
  $$('[data-filter]').forEach(button=>button.addEventListener('click',()=>{categoryFilter=button.dataset.filter;applyAlbumFilters();}));
  eventFilter.addEventListener('change',applyAlbumFilters);applyAlbumFilters();
  function resetAlbum() { categoryFilter='all';eventFilter.value='all';applyAlbumFilters(); }
  $$('.journey-timeline a').forEach(link=>link.addEventListener('click',resetAlbum));

  function showPhoto(index) {
    if(!activePhotos.length)return;
    activeIndex=(index+activePhotos.length)%activePhotos.length;
    const card=activePhotos[activeIndex];
    $('#lightbox-error').hidden=true;$('#lightbox-state').hidden=false;image.hidden=false;
    lightbox.classList.add('is-loading');
    image.alt=card.dataset.alt||card.querySelector('img')?.alt||'Ảnh của hai đứa';
    image.src=card.dataset.photo;
    $('#lightbox-caption').textContent=card.dataset.caption||image.alt;
    $('#lightbox-position').textContent=`ẢNH GỐC · ${activeIndex+1} / ${activePhotos.length}`;
    $('#photo-prev').hidden=$('#photo-next').hidden=activePhotos.length<2;
  }
  $$('[data-photo]').forEach(card=>card.addEventListener('click',event=>{
    if(event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
    event.preventDefault();
    if(card.closest('#gallery')) activePhotos=cards.filter(photo=>!photo.hidden);
    else activePhotos=[card];
    showPhoto(activePhotos.indexOf(card));lightbox.showModal();document.body.classList.add('photo-open');$('#lightbox-close').focus();
  }));
  image.addEventListener('load',()=>{lightbox.classList.remove('is-loading');$('#lightbox-state').hidden=true;$('#lightbox-error').hidden=true;image.hidden=false;});
  image.addEventListener('error',()=>{lightbox.classList.remove('is-loading');$('#lightbox-state').hidden=true;image.hidden=true;$('#lightbox-error').hidden=false;});
  $('#retry-photo').addEventListener('click',()=>{showPhoto(activeIndex);image.src=activePhotos[activeIndex].dataset.photo+'?retry='+Date.now();});
  $('#photo-prev').addEventListener('click',()=>showPhoto(activeIndex-1));$('#photo-next').addEventListener('click',()=>showPhoto(activeIndex+1));
  $('#lightbox-close').addEventListener('click',()=>lightbox.close());
  lightbox.addEventListener('close',()=>{document.body.classList.remove('photo-open');image.removeAttribute('src');});
  lightbox.addEventListener('click',event=>{if(event.target!==lightbox)return;const box=lightbox.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)lightbox.close();});
  lightbox.addEventListener('keydown',event=>{if(event.key==='ArrowLeft'){event.preventDefault();showPhoto(activeIndex-1);}if(event.key==='ArrowRight'){event.preventDefault();showPhoto(activeIndex+1);}});
  let touch=null;
  $('.lightbox-picture').addEventListener('pointerdown',event=>{if(event.pointerType==='mouse')return;if(!event.isPrimary){touch=null;return;}touch={id:event.pointerId,x:event.clientX,y:event.clientY,t:event.timeStamp};});
  $('.lightbox-picture').addEventListener('pointerup',event=>{if(!touch||event.pointerId!==touch.id)return;const dx=event.clientX-touch.x,dy=event.clientY-touch.y,dt=event.timeStamp-touch.t;touch=null;if(dt<700&&Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.4)showPhoto(activeIndex+(dx<0?1:-1));});
  $('.lightbox-picture').addEventListener('pointercancel',()=>{touch=null;});
  $$('.photo-card img').forEach(preview=>{preview.addEventListener('error',()=>preview.closest('.photo-card').classList.add('photo-load-error'));preview.addEventListener('load',()=>preview.closest('.photo-card').classList.remove('photo-load-error'));});

  function burst(button) {
    if(motion.matches)return;
    const box=button.getBoundingClientRect();
    for(let i=0;i<6;i++){
      const heart=document.createElement('span');heart.className='hug-particle';heart.textContent='♡';
      heart.style.cssText=`--x:${box.left+box.width/2}px;--y:${box.top+box.height/2}px;--dx:${(Math.random()-.5)*160}px;--dy:${-45-Math.random()*100}px`;
      $('#particles').append(heart);setTimeout(()=>heart.remove(),1800);
    }
  }
  const letter=$('#letter-content'),seal=$('#seal');
  seal.addEventListener('click',()=>{
    $('#envelope-front').hidden=true;letter.hidden=false;seal.setAttribute('aria-expanded','true');letter.focus({preventScroll:true});scrollTo(letter);
  });
  function closeLetter(){letter.hidden=true;$('#envelope-front').hidden=false;seal.setAttribute('aria-expanded','false');seal.focus({preventScroll:true});scrollTo($('#envelope'),'center');}
  $('#close-letter').addEventListener('click',closeLetter);$('#close-letter-top').addEventListener('click',closeLetter);
  letter.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();closeLetter();}});
  const hugs=['Ôm em một cái. Anh ở đây.','Cảm ơn em vì đã ở bên anh.','Anh yêu em. Cả Sữa nữa, tất nhiên.'];let sent=0;
  $('#send-kiss').addEventListener('click',()=>{burst($('#send-kiss'));$('#kiss-message').textContent=hugs[sent++%hugs.length];});

  const music=$('#background-music'),sound=$('#sound'),soundLabel=$('.sound-label');
  let musicTimer=null,musicLoading=false,musicAttempt=0,musicFailed=false;
  music.volume=.28;
  function syncSoundState(){
    const playing=!music.paused&&!music.ended;
    sound.setAttribute('aria-pressed',String(playing));sound.setAttribute('aria-busy',String(musicLoading));
    sound.setAttribute('aria-label',musicFailed?'Thử bật nhạc nền lại':`${playing?'Tắt':'Bật'} nhạc nền I Love You Baby`);
    soundLabel.textContent=musicFailed?'thử bật nhạc lại':musicLoading?'đang tải nhạc…':playing?'tắt nhạc nền':'bật nhạc nền';
  }
  function stopMusic(failed=false){musicAttempt++;clearTimeout(musicTimer);musicLoading=false;musicFailed=failed;music.pause();syncSoundState();}
  async function startMusic(){
    const attempt=++musicAttempt;musicFailed=false;musicLoading=true;syncSoundState();
    clearTimeout(musicTimer);musicTimer=setTimeout(()=>{if(attempt===musicAttempt)stopMusic(true);},15000);
    try{if(music.error||music.networkState===HTMLMediaElement.NETWORK_NO_SOURCE)music.load();await music.play();if(attempt===musicAttempt){clearTimeout(musicTimer);musicLoading=false;syncSoundState();}}
    catch(error){if(attempt===musicAttempt)stopMusic(error.name!=='AbortError');}
  }
  music.addEventListener('play',syncSoundState);music.addEventListener('pause',syncSoundState);
  music.addEventListener('error',()=>stopMusic(true));music.querySelector('source').addEventListener('error',()=>stopMusic(true));
  sound.addEventListener('click',()=>{if(musicLoading||!music.paused)stopMusic();else startMusic();});syncSoundState();

  function revealFilm(withMusic=false,instant=false){
    if(!film.hidden)return;
    if(withMusic)startMusic();
    openFilm.disabled=true;$('#open-quietly').disabled=true;film.hidden=false;
    document.body.classList.remove('awaiting-premiere');premiere.inert=true;premiere.setAttribute('aria-hidden','true');premiere.classList.add('is-opening');
    if(instant||motion.matches)premiere.hidden=true;else setTimeout(()=>{premiere.hidden=true;},900);
    $('#story').focus({preventScroll:true});
  }
  openFilm.disabled=false;$('#open-quietly').disabled=false;
  openFilm.addEventListener('click',()=>{revealFilm(true);window.scrollTo({top:0,behavior:'instant'});});
  $('#open-quietly').addEventListener('click',()=>{revealFilm(false);window.scrollTo({top:0,behavior:'instant'});});
  function followHash(instant=false){
    let id;try{id=decodeURIComponent(location.hash.slice(1));}catch{return;}
    const target=id&&document.getElementById(id);
    if(!target||!film.contains(target))return;
    if(target.closest('.memory-chapter')||id==='gallery'||id==='journeys'||id==='memories')resetAlbum();
    revealFilm(false,true);
    requestAnimationFrame(()=>requestAnimationFrame(()=>scrollTo(target,'start',instant)));
  }
  const entryUrl=new URL(location.href);
  if(entryUrl.searchParams.get('unlocked')==='1'){
    revealFilm(false,true);entryUrl.searchParams.delete('unlocked');history.replaceState(null,'',entryUrl.pathname+entryUrl.search+entryUrl.hash);
  }
  window.addEventListener('hashchange',()=>followHash());
  if(location.hash){
    const initialHash=location.hash;let interacted=false;
    ['pointerdown','wheel','touchstart','keydown'].forEach(type=>window.addEventListener(type,()=>{interacted=true;},{once:true,passive:true}));
    followHash(true);
    // Web-font swaps can change the height of earlier scenes. Align once more,
    // but never move the page after the viewer has started interacting.
    const settleLink=()=>{if(!interacted&&location.hash===initialHash)followHash(true);};
    if(document.fonts)document.fonts.ready.then(settleLink);
    window.addEventListener('load',settleLink,{once:true});
  }
  let scrollFrame=0;
  const dock=$('.story-dock');
  function updateDock(){dock.hidden=film.hidden||scrollY<innerHeight*.8;scrollFrame=0;}
  window.addEventListener('scroll',()=>{if(!scrollFrame)scrollFrame=requestAnimationFrame(updateDock);},{passive:true});updateDock();
})();
