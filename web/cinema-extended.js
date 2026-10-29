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
    "file": "nha-minh-co-sua.jpg",
    "alt": "Hai bạn và Sữa cùng chụp ảnh",
    "caption": "Hai người, một vòng tay.\nVà Sữa ở giữa.",
    "note": "Có những tấm hình khiến anh muốn giữ nguyên một ngày, cả ánh sáng lẫn những người trong đó."
  },
  {
    "file": "chung-khung-hinh.jpg",
    "alt": "Hai bạn chụp chung trong gương",
    "caption": "Gương giữ bóng hình.\nAnh giữ ngày có em.",
    "note": "Trong ô gương ấy, hai đứa đứng gần nhau. Anh muốn năm tháng sau này vẫn còn những tấm hình như thế."
  },
  {
    "file": "gan-nhau.jpg",
    "alt": "Mox và Tuấn Minh tựa gần bên nhau",
    "caption": "Xin giờ khắc chậm trôi.\nEm đang ở rất gần.",
    "note": "Nếu có thể giữ một khoảng yên giữa dòng ngày vội vã, anh muốn giữ lúc ngồi cạnh em."
  },
  {
    "file": "hai-dua.jpg",
    "alt": "Hai bạn chụp dưới ánh đèn xanh",
    "caption": "Đêm khoác màu xanh.\nHai đứa ở trong cùng ánh sáng.",
    "note": "Ánh đèn nhuộm khác gương mặt mình. Còn người anh muốn đứng cạnh vẫn là em."
  },
  {
    "file": "mot-ngay-ben-em.jpg",
    "alt": "Mox và Tuấn Minh cùng chụp ảnh",
    "caption": "Thêm một ngày đi qua.\nThêm một lần muốn giữ.",
    "note": "Mong những năm chưa tới cũng để lại cho mình nhiều tấm hình, để tuổi nào nhìn lại cũng thấy có nhau."
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
