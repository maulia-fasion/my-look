/* MY LOOK - Open-Meteo weather client */
const Weather = (() => {
  const API='https://api.open-meteo.com/v1/forecast';
  const GEO='https://geocoding-api.open-meteo.com/v1/search';
  const codeMap={
    0:['맑음','☀️'],1:['대체로 맑음','🌤️'],2:['부분 흐림','⛅'],3:['흐림','☁️'],
    45:['안개','🌫️'],48:['착빙성 안개','🌫️'],51:['이슬비','🌦️'],53:['이슬비','🌦️'],55:['이슬비','🌧️'],
    56:['어는 이슬비','🌧️'],57:['어는 이슬비','🌧️'],61:['비','🌧️'],63:['비','🌧️'],65:['강한 비','🌧️'],
    66:['어는 비','🌧️'],67:['어는 비','🌧️'],71:['눈','🌨️'],73:['눈','❄️'],75:['강한 눈','❄️'],77:['싸락눈','🌨️'],
    80:['소나기','🌦️'],81:['소나기','🌧️'],82:['강한 소나기','⛈️'],85:['눈 소나기','🌨️'],86:['강한 눈 소나기','❄️'],
    95:['뇌우','⛈️'],96:['우박 동반 뇌우','⛈️'],99:['우박 동반 뇌우','⛈️']
  };
  function describe(code){return codeMap[Number(code)]||['날씨 정보','🌤️'];}
  async function request(url){
    const r=await fetch(url,{cache:'no-store'});
    if(!r.ok) throw new Error('날씨 서버 응답 오류 ('+r.status+')');
    return r.json();
  }
  async function byCoords(lat,lon){
    const params=new URLSearchParams({
      latitude:lat,longitude:lon,timezone:'auto',forecast_days:'2',
      current:['temperature_2m','apparent_temperature','precipitation','rain','snowfall','weather_code','wind_speed_10m','relative_humidity_2m','is_day'].join(','),
      hourly:['temperature_2m','apparent_temperature','precipitation_probability','precipitation','weather_code','wind_speed_10m'].join(','),
      daily:['temperature_2m_max','temperature_2m_min','precipitation_probability_max','sunrise','sunset'].join(',')
    });
    const data=await request(API+'?'+params.toString());
    const [label,icon]=describe(data.current.weather_code);
    const hourIndex=findCurrentHour(data.hourly.time);
    return {
      latitude:data.latitude,longitude:data.longitude,timezone:data.timezone,
      condition:label,icon,code:Number(data.current.weather_code),
      temp:round(data.current.temperature_2m), apparent:round(data.current.apparent_temperature),
      precipitation:round(data.current.precipitation), rain:round(data.current.rain), snowfall:round(data.current.snowfall),
      wind:round(data.current.wind_speed_10m), humidity:round(data.current.relative_humidity_2m),
      isDay:Number(data.current.is_day)===1,
      precipProbability: hourIndex>=0 ? Number(data.hourly.precipitation_probability[hourIndex]||0) : null,
      daily:data.daily,
      fetchedAt:new Date().toISOString()
    };
  }
  function findCurrentHour(times){
    const now=Date.now(); let best=-1,delta=Infinity;
    (times||[]).forEach((t,i)=>{const d=Math.abs(new Date(t).getTime()-now); if(d<delta){delta=d;best=i;}});
    return best;
  }
  function round(v){return Number.isFinite(Number(v))?Math.round(Number(v)*10)/10:null;}
  async function byLocationName(name){
    const p=new URLSearchParams({name,count:'5',language:'ko',format:'json',countryCode:'KR'});
    const data=await request(GEO+'?'+p.toString());
    if(!data.results||!data.results.length) throw new Error('지역을 찾지 못했습니다.');
    const x=data.results[0];
    const weather=await byCoords(x.latitude,x.longitude);
    weather.place={name:x.name,admin1:x.admin1||'',country:x.country||'대한민국'};
    return weather;
  }
  async function currentByGPS(){
    if(!navigator.geolocation) throw new Error('이 브라우저는 위치 정보를 지원하지 않습니다.');
    const pos=await new Promise((resolve,reject)=>navigator.geolocation.getCurrentPosition(resolve,reject,{enableHighAccuracy:true,timeout:12000,maximumAge:300000}));
    const w=await byCoords(pos.coords.latitude,pos.coords.longitude);
    try{
      const p=new URLSearchParams({name:'의정부',count:'1',language:'ko',format:'json',countryCode:'KR'});
      // Place label is intentionally approximate; coordinates remain the actual weather lookup location.
      const g=await request(GEO+'?'+p.toString());
      if(g.results&&g.results[0]) w.place={name:'현재 위치',admin1:g.results[0].admin1||'',country:'대한민국'};
    }catch(_){w.place={name:'현재 위치',admin1:'',country:'대한민국'};}
    return w;
  }
  function advice(w){
    const t=w.apparent ?? w.temp ?? 20;
    const rain=(w.precipProbability??0)>=50 || (w.precipitation??0)>0;
    const wind=w.wind??0;
    if(t>=28) return rain?'덥고 비가 올 수 있어요. 통풍 좋은 옷과 방수 가능한 신발을 고려하세요.':'더운 날씨예요. 통풍 좋은 반팔·얇은 하의를 추천해요.';
    if(t>=23) return rain?'따뜻하고 비 가능성이 있어요. 얇은 상의와 가벼운 방수 아우터가 좋아요.':'가벼운 상의가 어울리는 날씨예요.';
    if(t>=18) return wind>=25?'선선하고 바람이 있어요. 얇은 재킷이나 가디건을 고려하세요.':'셔츠·긴팔·얇은 재킷을 활용하기 좋은 날씨예요.';
    if(t>=12) return rain?'쌀쌀하고 비 가능성이 있어요. 긴팔에 방수 아우터를 추천해요.':'쌀쌀해요. 니트나 재킷을 활용하세요.';
    if(t>=6) return '추운 편이에요. 코트나 두꺼운 아우터를 활용하세요.';
    return '매우 추워요. 패딩이나 두꺼운 코트와 보온성 있는 옷을 추천해요.';
  }
  return {byCoords,byLocationName,currentByGPS,describe,advice};
})();
