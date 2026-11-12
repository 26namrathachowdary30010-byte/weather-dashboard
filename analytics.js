document.getElementById("nav").innerHTML=nav("analytics.html");
let charts=[];
const $=id=>document.getElementById(id);
const today=new Date();const end=new Date(today);end.setDate(end.getDate()-5);const start=new Date(end);start.setDate(start.getDate()-13);
const iso=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
$("startDate").value=iso(start);$("endDate").value=iso(end);
async function loadAnalytics(){
 const city=getSavedCity();$("analyticsCity").textContent=cityLabel(city);$("navCity").textContent=city.name;
 const from=$("startDate").value,to=$("endDate").value;
 if(!from||!to||from>to){setNotice("notice","Please choose a valid date range.",true);return;}
 setNotice("notice","Loading historical weather…");
 try{
  const data=await api(`/api/history?${weatherQuery(city)}&start=${from}&end=${to}`),d=data.daily||{},labels=d.time||[];
  if(!labels.length)throw new Error("No historical records were returned for those dates.");
  const highs=d.temperature_2m_max||[],lows=d.temperature_2m_min||[],rain=d.precipitation_sum||[],wind=d.wind_speed_10m_max||[];
  const avg=a=>a.length?a.reduce((s,v)=>s+(Number(v)||0),0)/a.length:0;
  $("avgHigh").textContent=`${fmt(avg(highs),1)}°C`;$("avgLow").textContent=`${fmt(avg(lows),1)}°C`;
  $("totalRain").textContent=`${fmt(rain.reduce((s,v)=>s+(Number(v)||0),0),1)} mm`;$("peakWind").textContent=`${fmt(Math.max(...wind.filter(v=>v!=null),0),1)} km/h`;
  charts.forEach(c=>c.destroy());charts=[];
  const common={responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{usePointStyle:true,boxWidth:8}}},scales:{x:{grid:{display:false},ticks:{maxTicksLimit:10,color:"#8996aa"}},y:{grid:{color:"#edf1f7"},ticks:{color:"#8996aa"}}}};
  charts.push(new Chart($("tempChart"),{type:"line",data:{labels:labels.map(x=>dateLabel(x,{month:"short",day:"numeric"})),datasets:[{label:"Maximum °C",data:highs,borderColor:"#e58b45",tension:.3},{label:"Minimum °C",data:lows,borderColor:"#3268e8",tension:.3}]},options:common}));
  charts.push(new Chart($("rainChart"),{type:"bar",data:{labels:labels.map(x=>dateLabel(x,{month:"short",day:"numeric"})),datasets:[{label:"Rainfall mm",data:rain,backgroundColor:"#6bbfe0",borderRadius:5}]},options:common}));
  charts.push(new Chart($("windChart"),{type:"line",data:{labels:labels.map(x=>dateLabel(x,{month:"short",day:"numeric"})),datasets:[{label:"Maximum wind km/h",data:wind,borderColor:"#7c6ce5",backgroundColor:"rgba(124,108,229,.12)",fill:true,tension:.3}]},options:common}));
  setNotice("notice",`Loaded ${labels.length} daily records for ${cityLabel(city)}.`);
 }catch(e){setNotice("notice",e.message,true);}
}
$("loadHistory").addEventListener("click",loadAnalytics);loadAnalytics();
