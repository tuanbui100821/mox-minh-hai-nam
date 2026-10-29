(() => {
  'use strict';
  const $=selector=>document.querySelector(selector);
  document.querySelectorAll('[data-look]').forEach(button=>{
    if(button.tagName!=='BUTTON')return;
    button.addEventListener('click',()=>{
      document.body.dataset.look=button.dataset.look;
      document.querySelectorAll('button[data-look]').forEach(other=>{const active=other===button;other.classList.toggle('active',active);other.setAttribute('aria-pressed',String(active));});
      // Selecting a colour world also turns the film display back on.
      document.body.classList.remove('original-photos');
      const toggle=$('#film-look');toggle.setAttribute('aria-pressed','true');
      toggle.replaceChildren(document.createTextNode('◉ Màu ảnh '));const hint=document.createElement('span');hint.textContent='/ xem ảnh gốc';toggle.append(hint);
    });
  });
  const scenes=[
  {
    "file": "thang-long-img_1894.jpg",
    "alt": "Mox và Tuấn Minh chụp chung tại Hoàng thành Thăng Long",
    "caption": "Đi chơi mà mặc như đi đá bóng.",
    "note": "02.09.2025 · Hoàng thành Thăng Long"
  },
  {
    "file": "sua-img_2683.jpg",
    "alt": "Sữa mặc áo đỏ",
    "caption": "Mặc áo đỏ, được bế, rất hợp tác.",
    "note": "21.01.2026"
  },
  {
    "file": "hue-arch-img_3829.jpg",
    "alt": "Hai đứa mặc áo dài và nhìn nhau dưới vòm cổng ở Huế",
    "caption": "Tấm trước nhìn máy, tấm này nhìn nhau.",
    "note": "Huế"
  },
  {
    "file": "bay-mau-img_3747.jpg",
    "alt": "Mox và Tuấn Minh đội nón và ghép tay thành hình trái tim trên thuyền thúng ở Bảy Mẫu",
    "caption": "Hai đứa góp tay mới được cái tim.",
    "note": "03.09.2026 · Bảy Mẫu"
  },
  {
    "file": "hoi-an-img_3760.jpg",
    "alt": "Hai bạn chụp chung dưới đèn lồng ở Hội An",
    "caption": "Đèn lồng nhiều, ảnh hai đứa cũng nhiều.",
    "note": "03.09.2026 · Hội An"
  },
  {
    "file": "da-nang-img_3773.jpg",
    "alt": "Hai bạn chụp chung bên biển lúc bình minh ở Đà Nẵng",
    "caption": "Em chụp ảnh, anh ngắm biển.",
    "note": "04.09.2026 · Đà Nẵng"
  },
  {
    "file": "da-nang-img_3785.jpg",
    "alt": "Hai bạn đội mũ bảo hiểm với thành phố Đà Nẵng sáng đèn phía sau",
    "caption": "Cảnh đẹp phía sau, hai cái mũ phía trước.",
    "note": "04.09.2026 · Đà Nẵng"
  },
  {
    "file": "nha-minh-co-sua.jpg",
    "alt": "Mox, Tuấn Minh và Sữa cùng chụp ảnh",
    "caption": "Chụp hai người, thành ra ba.",
    "note": "Mox · Tuấn Minh · Sữa"
  }
];
  let current=0;
  const image=$('#reel-image'),caption=$('#reel-caption'),number=$('#reel-number'),note=$('#reel-note');
  function showScene(next){
    current=(next+scenes.length)%scenes.length;const scene=scenes[current];
    image.src='assets/photos/'+scene.file;image.alt=scene.alt;caption.textContent=scene.caption;note.textContent=scene.note;
    number.textContent=String(current+1).padStart(2,'0')+' / '+String(scenes.length).padStart(2,'0');
    image.dataset.scene=String(current);
  }
  $('#reel-prev').addEventListener('click',()=>showScene(current-1));
  $('#reel-next').addEventListener('click',()=>showScene(current+1));
  $('.reel-projector').addEventListener('keydown',event=>{if(event.key==='ArrowLeft'){event.preventDefault();showScene(current-1);}if(event.key==='ArrowRight'){event.preventDefault();showScene(current+1);}});
  $('#last-line-button').addEventListener('click',()=>{
    const line=$('#last-line');line.hidden=false;$('#last-line-button').setAttribute('aria-expanded','true');$('#last-line-button').hidden=true;line.focus({preventScroll:true});
    line.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'center'});
  });
})();
