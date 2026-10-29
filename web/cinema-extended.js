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
      toggle.replaceChildren(document.createTextNode('◉ Màu phim '));const hint=document.createElement('span');hint.textContent='/ xem ảnh gốc';toggle.append(hint);
    });
  });
  const scenes=[
  {
    "file": "thang-long-img_1894.jpg",
    "alt": "Mox và Tuấn Minh chụp chung tại Hoàng thành Thăng Long",
    "caption": "Hôm đi Hoàng thành.\nHai đứa mặc áo giống nhau.",
    "note": "02.09.2025 · Hoàng thành Thăng Long."
  },
  {
    "file": "sua-img_2683.jpg",
    "alt": "Sữa được ôm với chiếc khăn đỏ",
    "caption": "Sữa đeo khăn đỏ.\nChụp riêng cho Sữa một tấm.",
    "note": "21.01.2026 · Sữa."
  },
  {
    "file": "hue-close-img_3647.jpg",
    "alt": "Hai đứa chụp gần trong buổi tối ở Huế",
    "caption": "Tối ở Huế.\nHai đứa chụp chung một tấm.",
    "note": "01.09.2026 · Huế."
  },
  {
    "file": "bay-mau-img_3724.jpg",
    "alt": "Mox và Tuấn Minh đội nón ngồi trên thuyền ở rừng dừa Bảy Mẫu",
    "caption": "Hai đứa ngồi thuyền.\nTấm này đang nhìn nhau.",
    "note": "03.09.2026 · Rừng dừa Bảy Mẫu."
  },
  {
    "file": "hoi-an-img_3760.jpg",
    "alt": "Hai bạn chụp chung dưới đèn lồng ở Hội An",
    "caption": "Hội An buổi tối.\nChụp chung dưới đèn lồng.",
    "note": "03.09.2026 · Hội An."
  },
  {
    "file": "da-nang-img_3773.jpg",
    "alt": "Hai bạn chụp chung bên biển lúc bình minh ở Đà Nẵng",
    "caption": "Hai đứa ra biển\nlúc trời vừa sáng.",
    "note": "04.09.2026 · Đà Nẵng."
  },
  {
    "file": "da-nang-img_3785.jpg",
    "alt": "Hai bạn đội mũ bảo hiểm với thành phố Đà Nẵng sáng đèn phía sau",
    "caption": "Đà Nẵng lên đèn.\nHai đứa chụp thêm một tấm.",
    "note": "04.09.2026 · Đà Nẵng."
  },
  {
    "file": "nha-minh-co-sua.jpg",
    "alt": "Mox, Tuấn Minh và Sữa cùng chụp ảnh",
    "caption": "Có cả Sữa nữa.\nChụp đủ ba một tấm.",
    "note": "Mox, Tuấn Minh và Sữa."
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
