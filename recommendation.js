/* MY LOOK v2 - weather-aware outfit recommendation engine */
const Recommendation = (() => {
  const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
  const currentSeason=()=>{
    const m=new Date().getMonth()+1;
    return m>=3&&m<=5?'봄':m>=6&&m<=8?'여름':m>=9&&m<=11?'가을':'겨울';
  };
  const tempBand=t=>t==null?'mild':t>=28?'hot':t>=23?'warm':t>=18?'mild':t>=12?'cool':t>=6?'cold':'very-cold';
  function inferredWarmth(c){
    if(Number(c.warmth)>=1) return Number(c.warmth);
    if(c.cat==='아우터') return /겨울/.test(c.season||'')?3:2;
    if(c.cat==='하의') return /겨울/.test(c.season||'')?2:1;
    if(c.cat==='신발') return /겨울/.test(c.season||'')?2:1;
    if(c.cat==='상의'){
      if(c.season==='겨울') return 3;
      if(c.season==='가을'||c.season==='봄') return 2;
      return 1;
    }
    return 1;
  }
  function seasonScore(c,season){
    if(!c.season||c.season==='전체') return 3;
    if(c.season===season) return 5;
    const adjacent={봄:['가을'],여름:['봄'],가을:['봄','겨울'],겨울:['가을']}[season]||[];
    return adjacent.includes(c.season)?1:-4;
  }
  function colorScore(a,b){
    if(!a||!b||a.cat===b.cat) return 0;
    if(a.color===b.color) return -3;
    const neutral=['검정','흰색','회색','네이비','베이지','브라운'];
    if(neutral.includes(a.color)&&neutral.includes(b.color)) return 2;
    const pairs=[['하늘색','네이비'],['하늘색','흰색'],['하늘색','회색'],['하늘색','베이지'],['네이비','흰색'],['네이비','회색'],['네이비','베이지'],['블루','흰색'],['그린','베이지'],['레드','검정'],['브라운','베이지']];
    return pairs.some(p=>(p[0]===a.color&&p[1]===b.color)||(p[1]===a.color&&p[0]===b.color))?4:0;
  }
  function weatherItemScore(c,w,role,strategy){
    const t=w?.apparent??w?.temp??20;
    const rain=(w?.precipProbability??0)>=50 || (w?.precipitation??0)>0;
    const wind=w?.wind??0;
    const band=tempBand(t), warmth=inferredWarmth(c);
    let s=seasonScore(c,currentSeason());
    if(role==='outer'){
      if(band==='hot') s-=9;
      else if(band==='warm') s-=6;
      else if(band==='mild') s+=2;
      else if(band==='cool') s+=5;
      else s+=8;
      if(rain) s+=strategy==='rain'?4:2;
      if(wind>=25) s+=3;
    }
    if(role==='top'){
      const ideal={hot:1,warm:1,mild:2,cool:2,cold:3,'very-cold':3}[band];
      s+=5-Math.abs(warmth-ideal)*3;
      if(rain&&c.cat==='상의') s-=1;
    }
    if(role==='bottom'){
      const ideal=band==='hot'?1:band==='very-cold'||band==='cold'?2:1;
      s+=4-Math.abs(warmth-ideal)*2;
    }
    if(role==='shoe'){
      s+=seasonScore(c,currentSeason());
      if(rain) s+=strategy==='rain'?3:1;
    }
    if(role==='accessory'){
      s+=seasonScore(c,currentSeason());
      if(band==='cold'||band==='very-cold') s+=warmth>=2?3:-2;
    }
    if(strategy==='light'){
      s += warmth===1?2: warmth===3?-2:0;
      if(role==='outer') s-=2;
    }
    return s;
  }
  function comboScore(t,b,o,sh,w,strategy){
    let s=0;
    s+=weatherItemScore(t,w,'top',strategy)+weatherItemScore(b,w,'bottom',strategy);
    s+=colorScore(t,b);
    if(o){s+=weatherItemScore(o,w,'outer',strategy)+colorScore(t,o)+colorScore(b,o);}
    if(sh)s+=weatherItemScore(sh,w,'shoe',strategy)+colorScore(b,sh);
    const temp=w?.apparent??w?.temp??20;
    if(temp<=10 && !o) s-=12;
    if(temp>=25 && o) s-=8;
    if((w?.precipProbability??0)>=60 && !o && temp<23) s-=3;
    return s;
  }
  function reason(t,b,o,sh,w,strategy){
    const tval=w?.apparent??w?.temp??20, rain=w?.precipProbability??0, wind=w?.wind??0;
    const parts=[];
    if(tval>=26) parts.push('체감온도가 높아 가벼운 구성을 우선했어요.');
    else if(tval<=12) parts.push('쌀쌀한 날씨라 보온성을 높였어요.');
    else parts.push('현재 체감온도에 맞춰 보온감을 조정했어요.');
    if(rain>=50) parts.push('강수 가능성이 있어 비에 대비하기 쉬운 조합을 우선했어요.');
    if(wind>=25) parts.push('바람이 있어 아우터 활용도를 높였어요.');
    if(strategy==='light') parts.push('가볍고 활동하기 편한 구성을 우선했어요.');
    if(strategy==='rain'&&rain<50) parts.push('비가 없더라도 변덕스러운 날씨에 대비하는 조합이에요.');
    return parts.join(' ');
  }
  function generate(clothes,w,opts={}){
    const season=opts.season&&opts.season!=='전체'?opts.season:currentSeason();
    const pool=clothes.filter(c=>c.season==='전체'||!c.season||c.season===season||seasonScore(c,season)>0);
    const tops=pool.filter(c=>c.cat==='상의');
    const bottoms=pool.filter(c=>c.cat==='하의');
    const outers=pool.filter(c=>c.cat==='아우터');
    const shoes=pool.filter(c=>c.cat==='신발');
    if(!tops.length||!bottoms.length)return [];
    const strategies=[['균형형','balanced'],['비 대비형','rain'],['가벼운 스타일','light']];
    const results=[];
    for(const [label,strategy] of strategies){
      let best=null;
      for(const t of tops)for(const b of bottoms){
        const outerCandidates=outers.length?[null,...outers]:[null];
        const shoeCandidates=shoes.length?[...shoes]:[null];
        for(const o of outerCandidates)for(const sh of shoeCandidates){
          const score=comboScore(t,b,o,sh,w,strategy);
          if(!best||score>best.score)best={ids:[t.id,b.id].concat(o?[o.id]:[],sh?[sh.id]:[]),score,strategy,label,reason:reason(t,b,o,sh,w,strategy)};
        }
      }
      if(best)results.push(best);
    }
    const seen=new Set();
    return results.filter(x=>{const key=x.ids.join('|');if(seen.has(key))return false;seen.add(key);return true}).slice(0,3);
  }
  return {generate,inferredWarmth,tempBand};
})();
