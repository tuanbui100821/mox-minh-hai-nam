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
    "caption": "Hoàng thành Thăng Long, năm 2025.\nHai đứa đứng trong cùng khung hình.",
    "note": "02.09.2025 · Một kỷ niệm của hai đứa ở Hoàng thành Thăng Long."
  },
  {
    "file": "sua-img_2683.jpg",
    "alt": "Sữa được ôm với chiếc khăn đỏ",
    "caption": "Sữa và chiếc khăn đỏ.\nMột chỗ nhỏ trong câu chuyện của mình.",
    "note": "21.01.2026 · Có thêm một vai diễn mang tên Sữa."
  },
  {
    "file": "hue-close-img_3647.jpg",
    "alt": "Hai đứa chụp gần trong buổi tối ở Huế",
    "caption": "Huế, một buổi tối.\nChụp gần thêm một chút.",
    "note": "01.09.2026 · Hai đứa trong cùng một khung hình."
  },
  {
    "file": "bay-mau-img_3724.jpg",
    "alt": "Mox và Tuấn Minh đội nón ngồi trên thuyền ở rừng dừa Bảy Mẫu",
    "caption": "Hai chiếc nón, một chuyến thuyền.\nNgoảnh sang, thấy em đang cười.",
    "note": "03.09.2026 · Rừng dừa Bảy Mẫu."
  },
  {
    "file": "hoi-an-img_3760.jpg",
    "alt": "Hai bạn chụp chung dưới đèn lồng ở Hội An",
    "caption": "Phố lên đèn.\nMình vẫn đứng cạnh nhau.",
    "note": "03.09.2026 · Buổi tối ở Hội An."
  },
  {
    "file": "da-nang-img_3773.jpg",
    "alt": "Hai bạn chụp chung bên biển lúc bình minh ở Đà Nẵng",
    "caption": "Trời vừa sáng.\nHai đứa ở bên biển.",
    "note": "04.09.2026 · Một buổi sáng ở Đà Nẵng."
  },
  {
    "file": "da-nang-img_3785.jpg",
    "alt": "Hai bạn đội mũ bảo hiểm với thành phố Đà Nẵng sáng đèn phía sau",
    "caption": "Thành phố sáng đèn phía sau.\nHai đứa ở trong cùng một tấm hình.",
    "note": "04.09.2026 · Đà Nẵng về đêm."
  },
  {
    "file": "nha-minh-co-sua.jpg",
    "alt": "Mox, Tuấn Minh và Sữa cùng chụp ảnh",
    "caption": "Đi đâu rồi cũng muốn\ncó một tấm hình đủ cả ba.",
    "note": "Mox · Tuấn Minh · Sữa. Một khung hình của nhà mình."
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
