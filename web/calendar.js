/* Calendar days in Vietnam; no device-timezone or daylight-saving offset. */
const StoryCalendar = (() => {
  const formatter = new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit'});
  const ordinal = date => { const [y,m,d] = date.split('-').map(Number); return Date.UTC(y,m-1,d)/86400000; };
  const display = date => date.split('-').reverse().join('.');
  function at(now,start,anniversary,mode='live') {
    const parts=Object.fromEntries(formatter.formatToParts(now).filter(p=>p.type!=='literal').map(p=>[p.type,p.value]));
    const today=mode==='anniversary'?anniversary:`${parts.year}-${parts.month}-${parts.day}`;
    const remaining=ordinal(anniversary)-ordinal(today);
    return {today,todayDisplay:display(today),label:mode==='anniversary'?'Hôm nay':'Tính đến',context:mode==='anniversary'?'hai năm của chúng mình':'theo giờ Việt Nam',note:remaining===0?'Chúc mừng hai năm của chúng mình.':'Cảm ơn em vì đã ở bên anh.',elapsed:Math.max(0,ordinal(today)-ordinal(start)),remaining,
      status:remaining>0?`Còn ${remaining} ngày đến kỷ niệm hai năm · ${display(anniversary)}`:remaining===0?'Hôm nay, mình tròn hai năm.':`Mốc hai năm của mình · ${display(anniversary)}`,
      lead:remaining>0?'Sắp hai năm rồi.':remaining===0?'Hai năm rồi.':'Từ ngày mình có nhau,',
      together:remaining>0?'sắp bên nhau hai năm.':remaining===0?'đã bên nhau hai năm.':'vẫn đang viết tiếp.'};
  }
  return Object.freeze({at});
})();
