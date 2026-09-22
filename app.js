const cats=["상의","하의","아우터","신발","액세서리"];
const colors=["검정","흰색","회색","네이비","베이지","브라운","블루","하늘색","그린","레드","기타"];
const neutralColors=["검정","흰색","회색","네이비","베이지","브라운"];
const seasons=["봄","여름","가을","겨울","전체"];
const weatherIcons={"맑음":"☀️","흐림":"⛅","비":"🌧️","눈":"❄️"};
const $=s=>document.querySelector(s);
let tab="home", closetFilter="전체", homeSeason=autoSeasonFromDate();
let state={clothes:[],outfits:[],clothesLoaded:false,outfitsLoaded:false};
let todayWeather=loadWeather()||{condition:null,temp:null,place:null};

function autoSeasonFromDate(){const m=new Date().getMonth()+1;return m>=3&&m<=5?"봄":m>=6&&m<=8?"여름":m>=9&&m<=11?"가을":"겨울";}
function escapeHtml(s){return String(s||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function imgSrc(c){return c&&c.imageData?c.imageData:"";}
function loadWeather(){try{return JSON.parse(localStorage.getItem("mylook-weather")||"null")}catch(_){return null}}
function saveWeather(){try{localStorage.setItem("mylook-weather",JSON.stringify(todayWeather))}catch(_){} }
function weatherDisplay(w){return w&&w.icon?w.icon:((w&&w.condition&&weatherIcons[w.condition])||"🌤️")}

async function boot(){
  try{
    await Storage.init();
    [state.clothes,state.outfits]=await Promise.all([Storage.allClothes(),Storage.allOutfits()]);
    state.clothesLoaded=state.outfitsLoaded=true; render();
    if(!todayWeather.temp) refreshWeather(true);
  }catch(e){console.error(e);$("#main").innerHTML='<div class="loading">저장 공간을 사용할 수 없습니다.<br>브라우저 설정에서 사이트 데이터 저장을 허용해주세요.</div>';}
}
function render(){document.querySelectorAll(".tabs button").forEach(b=>b.classList.toggle("active",b.dataset.tab===tab));if(!state.clothesLoaded||!state.outfitsLoaded)return;({home,closet, outfit:outfitTab,shop})[tab]($("#main"));}

function weatherCard(){
  if(!todayWeather.temp)return '<div class="weather-box"><div class="weather-head"><div><div class="eyebrow">LIVE WEATHER</div><h2>날씨를 연결해 주세요</h2><div class="meta">현재 위치를 사용하면 기온과 강수확률을 자동으로 가져옵니다.</div></div><div class="weather-icon">🌤️</div></div><button class="primary" id="weatherBtn">📍 현재 위치로 날씨 가져오기</button><div class="weather-links"><button class="text-btn" id="manualWeather">지역 검색</button></div></div>';
  const w=todayWeather;
  return '<div class="weather-box"><div class="weather-head"><div><div class="eyebrow">LIVE WEATHER</div><h2>'+weatherDisplay(w)+' '+escapeHtml(w.condition||'날씨 정보')+'</h2><div class="meta">'+escapeHtml((w.place&&w.place.name)||'현재 위치')+' · '+new Date(w.fetchedAt||Date.now()).toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'})+'</div></div><div class="big-temp">'+w.temp+'°</div></div><div class="weather-stats"><span>체감 <b>'+((w.apparent??w.temp))+'°</b></span><span>강수확률 <b>'+(w.precipProbability??'-')+'%</b></span><span>바람 <b>'+(w.wind??'-')+' km/h</b></span></div><div class="weather-advice">'+escapeHtml(Weather.advice(w))+'</div><button class="secondary" id="weatherRefresh">↻ 날씨 새로고침</button></div>';
}
function home(m){
  const n=state.clothes.length;
  const seasonChips=seasons.map(s=>'<button class="chip'+(homeSeason===s?' chip-active':'')+'" data-season="'+s+'">'+s+'</button>').join("");
  const weatherChips=Object.keys(weatherIcons).map(k=>'<button class="chip'+(todayWeather.condition===k?' chip-active':'')+'" data-cond="'+k+'">'+weatherIcons[k]+' '+k+'</button>').join("");
  const tempLabel=todayWeather.temp==null?'자동 날씨를 먼저 연결':todayWeather.temp+'℃';
  m.innerHTML='<div class="page"><div class="hero"><div class="eyebrow">YOUR PERSONAL WARDROBE</div><h1>오늘,<br>뭐 입지?</h1>'+weatherCard()+'<div class="eyebrow" style="margin-bottom:8px">추천 계절</div><div class="chip-row" id="seasonChips">'+seasonChips+'</div><div class="manual-weather"><div class="eyebrow" style="margin-bottom:8px">수동 조정 (선택)</div><div class="chip-row" id="weatherChips">'+weatherChips+'</div><div class="temp-row"><button class="secondary" id="tempMinus">－</button><div class="temp-val">'+tempLabel+'</div><button class="secondary" id="tempPlus">＋</button></div></div><button class="primary" style="margin-top:18px" onclick="recommend()">오늘의 코디 추천받기</button></div><div class="cards"><div class="card"><div class="eyebrow">MY CLOSET</div><div class="stat">'+n+'</div><div>등록된 옷</div></div><div class="card"><div class="eyebrow">OUTFITS</div><div class="stat">'+state.outfits.length+'</div><div>저장한 코디</div></div></div><div class="section"><h2>빠른 추가</h2><div class="row"><button class="secondary" onclick="openAdd(&#39;camera&#39;)">📷 사진 촬영</button><button class="secondary" onclick="openAdd(&#39;gallery&#39;)">🖼 사진 선택</button></div></div><div class="attribution">날씨 데이터: Open-Meteo · 앱 데이터는 이 기기의 브라우저에 저장됩니다.</div></div>';
  m.querySelectorAll("#seasonChips .chip").forEach(b=>b.onclick=()=>{homeSeason=b.dataset.season;render()});
  m.querySelectorAll("#weatherChips .chip").forEach(b=>b.onclick=()=>{todayWeather.condition=todayWeather.condition===b.dataset.cond?null:b.dataset.cond;saveWeather();render()});
  m.querySelector("#tempMinus").onclick=()=>{todayWeather.temp=(todayWeather.temp==null?15:todayWeather.temp)-1;saveWeather();render()};
  m.querySelector("#tempPlus").onclick=()=>{todayWeather.temp=(todayWeather.temp==null?15:todayWeather.temp)+1;saveWeather();render()};
  const wb=m.querySelector("#weatherBtn");if(wb)wb.onclick=()=>refreshWeather(false);
  const wr=m.querySelector("#weatherRefresh");if(wr)wr.onclick=()=>refreshWeather(false);
  const mw=m.querySelector("#manualWeather");if(mw)mw.onclick=openLocationSearch;
}
async function refreshWeather(silent){
  const btn=$("#weatherBtn")||$("#weatherRefresh");if(btn){btn.disabled=true;btn.textContent='날씨 불러오는 중…';}
  try{todayWeather=await Weather.currentByGPS();saveWeather();homeSeason=autoSeasonFromDate();render();}
  catch(e){console.error(e);if(!silent)alert('현재 위치의 날씨를 가져오지 못했습니다.\n\n'+(e.message||'위치 권한 또는 네트워크 연결을 확인해주세요.'));render();}
}
function openLocationSearch(){
  const d=document.createElement('div');d.className='modal';d.innerHTML='<div class="sheet"><h2>지역으로 날씨 조회</h2><p class="meta">예: 의정부, 서울, 부산</p><div class="field"><label>지역</label><input id="locName" placeholder="의정부"></div><div class="row"><button class="secondary" id="cancelLoc">취소</button><button class="primary" id="searchLoc">조회</button></div></div>';document.body.appendChild(d);
  d.querySelector('#cancelLoc').onclick=()=>d.remove();d.querySelector('#searchLoc').onclick=async()=>{const name=d.querySelector('#locName').value.trim();if(!name)return;const b=d.querySelector('#searchLoc');b.disabled=true;b.textContent='조회 중…';try{todayWeather=await Weather.byLocationName(name);saveWeather();d.remove();render()}catch(e){alert(e.message||'지역을 찾지 못했습니다.');b.disabled=false;b.textContent='조회'}};
}

function closet(m){
  const filterChips=['전체'].concat(seasons.slice(0,4)).map(s=>'<button class="chip'+(closetFilter===s?' chip-active':'')+'" data-season="'+s+'">'+s+'</button>').join('');
  const filtered=closetFilter==='전체'?state.clothes:state.clothes.filter(c=>c.season===closetFilter||c.season==='전체');
  const grid=filtered.length?filtered.map(c=>'<button class="cloth" onclick="openClothDetail(\''+c.id+'\')"><div class="cloth-img">'+(imgSrc(c)?'<img src="'+imgSrc(c)+'" loading="lazy">':'')+'</div><div class="cloth-info"><b>'+escapeHtml(c.name||c.cat)+'</b><small>'+c.cat+' · '+c.color+(c.season?' · '+c.season:'')+(c.warmth?' · '+({1:'얇음',2:'보통',3:'따뜻함'}[Number(c.warmth)]||''):'')+'</small></div></button>').join(''):(state.clothes.length?'<div class="empty" style="grid-column:1/-1">이 계절로 등록된 옷이 없어요.</div>':'<div class="empty" style="grid-column:1/-1">아직 등록된 옷이 없습니다.<br>아래 + 버튼으로 옷을 추가해보세요.</div>');
  m.innerHTML='<div class="page"><div class="eyebrow">MY CLOSET</div><h1>내 옷장</h1><div class="chip-row" id="closetFilterChips">'+filterChips+'</div><div class="closet-grid">'+grid+'</div><button class="fab" onclick="openAdd(\'gallery\')">＋</button></div>';
  m.querySelectorAll('#closetFilterChips .chip').forEach(b=>b.onclick=()=>{closetFilter=b.dataset.season;render()});
}
function outfitTab(m){
  const list=state.outfits.length?state.outfits.map(o=>{const pieces=o.clothIds.map(id=>{const c=state.clothes.find(x=>x.id===id);return c?'<div class="piece"><img src="'+imgSrc(c)+'"></div>':''}).join('');return '<div class="look"><div class="look-grid">'+pieces+'</div><div class="meta">'+o.date+' · '+escapeHtml(o.title||'오늘의 코디')+'</div></div>'}).join(''):'<div class="empty">추천받은 코디를 저장하면 여기에 기록됩니다.</div>';
  m.innerHTML='<div class="page"><div class="eyebrow">OUTFIT</div><h1>코디 기록</h1>'+list+'</div>';
}
function shop(m){m.innerHTML='<div class="page"><div class="eyebrow">SHOPPING</div><h1>이 옷, 살까?</h1><div class="shopbox"><div style="font-size:40px">📸</div><h2 style="margin:10px 0 6px">매장에서 옷을 촬영하세요</h2><p style="color:var(--sub);margin:0 0 16px">현재 버전은 사진을 저장하지 않고 내 옷장 조합을 보여주는 기능까지 제공합니다.</p><button class="primary" onclick="openShop()">새 옷 촬영하기</button></div></div>';}

function compressImage(file,max=900,quality=.82){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>{const img=new Image();img.onload=()=>{const scale=Math.min(1,max/Math.max(img.width,img.height));const c=document.createElement('canvas');c.width=Math.max(1,Math.round(img.width*scale));c.height=Math.max(1,Math.round(img.height*scale));c.getContext('2d').drawImage(img,0,0,c.width,c.height);resolve(c.toDataURL('image/jpeg',quality));};img.onerror=reject;img.src=r.result};r.onerror=reject;r.readAsDataURL(file)});}
function openAdd(mode){const input=mode==='camera'?$('#cameraInput'):$('#galleryInput');input.value='';input.onchange=e=>{const file=e.target.files[0];if(file)showAddSheet(file)};input.click();}
function showAddSheet(file){
  const url=URL.createObjectURL(file),d=document.createElement('div');d.className='modal';d.innerHTML='<div class="sheet"><h2>옷 추가</h2><img class="preview" src="'+url+'"><div class="ai-hint">현재 독립형 버전은 사진을 기기에 저장하며, 종류·색상·계절은 직접 선택합니다.</div><div class="field"><label>종류</label><select id="acat">'+cats.map(x=>'<option>'+x+'</option>').join('')+'</select></div><div class="field"><label>색상</label><select id="acol">'+colors.map(x=>'<option>'+x+'</option>').join('')+'</select></div><div class="field"><label>계절</label><select id="aseason">'+seasons.map(x=>'<option>'+x+'</option>').join('')+'</select></div><div class="field"><label>보온감</label><select id="awarmth"><option value="1">얇음</option><option value="2" selected>보통</option><option value="3">따뜻함</option></select></div><div class="field"><label>이름 (선택)</label><input id="aname" placeholder="예: 네이비 재킷"></div><div class="row"><button class="secondary" id="cancelAdd">취소</button><button class="primary" id="confirmAdd">옷장에 저장</button></div></div>';document.body.appendChild(d);
  d.querySelector('#aseason').value=homeSeason==='전체'?autoSeasonFromDate():homeSeason;
  d.querySelector('#cancelAdd').onclick=()=>{URL.revokeObjectURL(url);d.remove()};
  d.querySelector('#confirmAdd').onclick=async()=>{const btn=d.querySelector('#confirmAdd');btn.disabled=true;btn.textContent='사진 저장 중…';try{const imageData=await compressImage(file);await Storage.addCloth({imageData,cat:d.querySelector('#acat').value,color:d.querySelector('#acol').value,season:d.querySelector('#aseason').value,warmth:Number(d.querySelector('#awarmth').value),name:d.querySelector('#aname').value.trim()});await reloadState();URL.revokeObjectURL(url);d.remove()}catch(e){alert('옷을 저장하지 못했습니다. 저장 공간이 부족할 수 있습니다.');btn.disabled=false;btn.textContent='옷장에 저장'}};
}
async function reloadState(){[state.clothes,state.outfits]=await Promise.all([Storage.allClothes(),Storage.allOutfits()]);render();}
function openClothDetail(id){const c=state.clothes.find(x=>x.id===id);if(!c)return;const d=document.createElement('div');d.className='modal';d.innerHTML='<div class="sheet"><img class="preview" src="'+imgSrc(c)+'"><h2 style="margin-bottom:4px">'+escapeHtml(c.name||c.cat)+'</h2><div class="meta" style="margin-bottom:16px">'+c.cat+' · '+c.color+(c.season?' · '+c.season:'')+' · 보온감 '+({1:'얇음',2:'보통',3:'따뜻함'}[Number(c.warmth)]||'자동')+'</div><div class="row"><button class="secondary" id="closeDetail">닫기</button><button class="secondary danger-btn" id="deleteCloth">삭제</button></div></div>';document.body.appendChild(d);d.querySelector('#closeDetail').onclick=()=>d.remove();d.querySelector('#deleteCloth').onclick=async()=>{if(!confirm('이 옷을 옷장에서 삭제할까요?'))return;await Storage.deleteCloth(c.id);d.remove();reloadState()};}

function makeLooks(clothes,opts={}){
  return Recommendation.generate(clothes,todayWeather,{season:homeSeason});
}
function recommendationWeatherSummary(){
  if(!todayWeather.temp)return '';
  const w=todayWeather;
  return '<div class="weather-summary">'+weatherDisplay(w)+' '+w.temp+'℃ · 체감 '+(w.apparent??w.temp)+'℃ · 강수확률 '+(w.precipProbability??'-')+'% · 바람 '+(w.wind??'-')+' km/h</div>';
}
function recommend(){
  if(!state.clothes.length){alert('먼저 옷을 등록해주세요.');return}
  const pool=homeSeason==='전체'?state.clothes:state.clothes.filter(c=>c.season===homeSeason||c.season==='전체'||!c.season);
  const usedFallback=!pool.some(c=>c.cat==='상의')||!pool.some(c=>c.cat==='하의');
  const source=usedFallback?state.clothes:pool;
  const looks=makeLooks(source,{season:homeSeason});
  if(!looks.length){alert('상의와 하의를 각각 1벌 이상 등록하면 코디를 추천할 수 있습니다.');return}
  const box=document.createElement('div');box.className='modal';
  const fallbackHtml=usedFallback?'<div class="ai-hint">'+escapeHtml(homeSeason)+' 옷이 부족해서 전체 옷장에서 추천했어요.</div>':'';
  const weatherHtml=recommendationWeatherSummary();
  const looksHtml=looks.map((o,i)=>{
    const pieces=o.ids.map(id=>{const c=state.clothes.find(x=>x.id===id);return c?'<div class="piece"><img src="'+imgSrc(c)+'" loading="lazy"></div>':''}).join('');
    const names=o.ids.map(id=>{const c=state.clothes.find(x=>x.id===id);return c?escapeHtml(c.name||c.cat):''}).filter(Boolean).join(' · ');
    return '<div class="look recommendation-card"><div class="recommend-head"><div><b>'+escapeHtml(o.label)+'</b><div class="meta">추천 '+(i+1)+'</div></div><span class="score-badge">'+Math.round(o.score)+'점</span></div><div class="look-grid">'+pieces+'</div><div class="meta">'+names+'</div><div class="recommend-reason">'+escapeHtml(o.reason)+'</div><button class="secondary" style="margin-top:10px;width:100%" data-ids=\''+JSON.stringify(o.ids)+'\' data-title=\''+escapeHtml(o.label)+'\' data-reason=\''+escapeHtml(o.reason)+'\'>♡ 이 코디 저장</button></div>';
  }).join('');
  box.innerHTML='<div class="sheet"><div class="eyebrow">WEATHER-BASED STYLING</div><h2>오늘의 코디</h2>'+weatherHtml+fallbackHtml+looksHtml+'<button class="secondary" style="width:100%" id="closeRecommend">닫기</button></div>';
  document.body.appendChild(box);
  box.querySelector('#closeRecommend').onclick=()=>box.remove();
  box.querySelectorAll('[data-ids]').forEach(btn=>btn.onclick=()=>saveOutfitFromBtn(btn,box));
}
async function saveOutfitFromBtn(btn,box){
  const ids=JSON.parse(btn.dataset.ids);btn.textContent='저장 중…';btn.disabled=true;
  try{
    await Storage.addOutfit({
      clothIds:ids,date:new Date().toLocaleDateString('ko-KR'),title:btn.dataset.title||'오늘의 코디',
      reason:btn.dataset.reason||'',score:btn.dataset.score?Number(btn.dataset.score):null,
      weather:{temp:todayWeather.temp,apparent:todayWeather.apparent,condition:todayWeather.condition,precipProbability:todayWeather.precipProbability,wind:todayWeather.wind}
    });
    btn.textContent='저장됨 ✓';await reloadState();setTimeout(()=>{box.remove();tab='outfit';render()},400)
  }catch(e){alert('코디를 저장하지 못했어요.');btn.disabled=false;btn.textContent='♡ 이 코디 저장'}
}

function openShop(){const input=$('#cameraInput');input.value='';input.onchange=e=>{const file=e.target.files[0];if(!file)return;const url=URL.createObjectURL(file),box=document.createElement('div');box.className='modal';box.innerHTML='<div class="sheet"><h2>새 옷 분석</h2><img class="preview" src="'+url+'"><p style="color:var(--sub)">사진은 저장하지 않고 현재 옷장과 어울리는 조합을 보여줍니다.</p><button class="primary" id="matchBtn">내 옷장과 매칭하기</button><button class="secondary" style="width:100%;margin-top:8px" id="closeShop">닫기</button></div>';document.body.appendChild(box);box.querySelector('#closeShop').onclick=()=>{URL.revokeObjectURL(url);box.remove()};box.querySelector('#matchBtn').onclick=()=>{const combos=makeLooks(state.clothes);const html=combos.length?combos.map((o,i)=>'<div class="look"><b>활용 코디 '+(i+1)+'</b><div class="look-grid">'+o.ids.map(id=>{const c=state.clothes.find(x=>x.id===id);return c?'<div class="piece"><img src="'+imgSrc(c)+'"></div>':''}).join('')+'</div></div>').join(''):'<div class="empty">상의와 하의를 등록하면 매칭할 수 있어요.</div>';box.querySelector('.sheet').innerHTML='<h2>내 옷장과의 조합</h2><p style="color:var(--sub)">현재 옷장 기준으로 활용 가능한 조합이에요.</p>'+html+'<button class="secondary" style="width:100%" id="closeShop2">닫기</button>';box.querySelector('#closeShop2').onclick=()=>{URL.revokeObjectURL(url);box.remove()}}};input.click()}

async function openSettings(){const d=document.createElement('div');d.className='modal';d.innerHTML='<div class="sheet"><h2>설정</h2><div class="meta">옷 '+state.clothes.length+'개 · 코디 '+state.outfits.length+'개</div><div id="usageBox" style="margin-top:14px">저장 용량 확인 중…</div><div class="section"><h3>데이터 관리</h3><div class="row"><button class="secondary" id="exportData">내 데이터 내보내기</button><button class="secondary" id="importDataBtn">데이터 가져오기</button></div><input id="importData" type="file" accept="application/json" hidden></div><div class="row" style="margin-top:20px"><button class="secondary" id="closeSettings">닫기</button><button class="secondary danger-btn" id="resetAll">전체 초기화</button></div><p class="meta" style="margin-top:14px">이 독립형 버전의 옷 사진·옷장·코디 기록은 현재 사용 중인 브라우저의 기기에 저장됩니다. 다른 기기와 자동 동기화되지 않습니다.</p></div>';document.body.appendChild(d);d.querySelector('#closeSettings').onclick=()=>d.remove();
  d.querySelector('#resetAll').onclick=async()=>{if(!confirm('옷장과 코디 기록을 모두 삭제할까요? 되돌릴 수 없어요.'))return;await Storage.clearAll();localStorage.removeItem('mylook-weather');state={clothes:[],outfits:[],clothesLoaded:true,outfitsLoaded:true};d.remove();render()};
  d.querySelector('#exportData').onclick=async()=>{const payload={version:1,exportedAt:new Date().toISOString(),clothes:await Storage.allClothes(),outfits:await Storage.allOutfits(),weather:todayWeather};const blob=new Blob([JSON.stringify(payload)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='my-look-backup-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)};
  d.querySelector('#importDataBtn').onclick=()=>d.querySelector('#importData').click();d.querySelector('#importData').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{const p=JSON.parse(await file.text());if(!Array.isArray(p.clothes)||!Array.isArray(p.outfits))throw new Error('백업 파일 형식이 올바르지 않습니다.');await Storage.clearAll();for(const c of p.clothes)await Storage.addCloth(c);for(const o of p.outfits)await Storage.addOutfit(o);if(p.weather){todayWeather=p.weather;saveWeather()}await reloadState();d.remove()}catch(err){alert(err.message||'가져오기에 실패했습니다.')}};
  const u=await Storage.estimate();d.querySelector('#usageBox').textContent=u&&u.usage!=null?'브라우저 저장 사용량: '+(u.usage/1024/1024).toFixed(1)+' MB / 약 '+(u.quota/1024/1024).toFixed(0)+' MB':'브라우저 저장 용량 정보를 확인할 수 없습니다.';
}

document.querySelectorAll('.tabs button').forEach(b=>b.onclick=()=>{tab=b.dataset.tab;render()});$('#settingsBtn').onclick=openSettings;
if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js').catch(console.warn));
boot();
