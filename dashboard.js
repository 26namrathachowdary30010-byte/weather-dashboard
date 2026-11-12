let hourlyChart;
const $ = id => document.getElementById(id);
function timeOnly(s){return s ? new Date(s).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"}) : "—";}
function weatherDescription(temp, rain, clouds){if(rain>0.5)return ["Rainy","🌧️"];if(clouds>70)return ["Mostly cloudy","☁️"];if(clouds>35)return ["Partly cloudy","🌤️"];if(temp>=30)return ["Hot and sunny","☀️"];return ["Clear skies","☀️"];}
async function loadDashboard(city=getSavedCity()){
  $("heroLocation").textContent=cityLabel(city);$("navCity").textContent=city.name;
  try{
    const data=await api(`/api/weather?${weatherQuery(city)}`);
    const c=data.current||{},d=data.daily||{},h=data.hourly||{};
    $("temperature").textContent=`${fmt(c.temperature_2m)}°`;
    $("feels").textContent=`${fmt(c.apparent_temperature)}°C`;
    $("humidity").textContent=`${fmt(c.relative_humidity_2m)}%`;
    $("rain").textContent=`${fmt(c.precipitation,1)} mm`;
    $("wind").textContent=`${fmt(c.wind_speed_10m)} km/h`;
    $("clouds").textContent=`${fmt(c.cloud_cover)}%`;
    $("high").textContent=`${fmt(d.temperature_2m_max?.[0])}°C`;
    $("low").textContent=`${fmt(d.temperature_2m_min?.[0])}°C`;
    $("updated").textContent=timeOnly(c.time);
    const [desc,icon]=weatherDescription(Number(c.temperature_2m),Number(c.precipitation),Number(c.cloud_cover));
    $("condition").textContent=desc;$("weatherIcon").textContent=icon;
    $("sunrise").textContent=timeOnly(d.sunrise?.[0]);$("sunset").textContent=timeOnly(d.sunset?.[0]);
    $("dailyRain").textContent=`Expected precipitation today: ${fmt(d.precipitation_sum?.[0],1)} mm · Maximum wind: ${fmt(d.wind_speed_10m_max?.[0])} km/h`;
    const now=Date.now();let indices=(h.time||[]).map((t,i)=>({t,i})).filter(o=>new Date(o.t).getTime()>=now).slice(0,24);
    if(!indices.length)indices=(h.time||[]).slice(0,24).map((t,i)=>({t,i}));
    const labels=indices.map(o=>timeOnly(o.t)),values=indices.map(o=>h.temperature_2m?.[o.i]);
    if(hourlyChart)hourlyChart.destroy();
    hourlyChart=new Chart($("hourlyChart"),{type:"line",data:{labels,datasets:[{label:"Temperature °C",data:values,borderColor:"#3268e8",backgroundColor:"rgba(50,104,232,.10)",fill:true,tension:.35,pointRadius:2,pointHoverRadius:5}]},options:{maintainAspectRatio:false,responsive:true,plugins:{legend:{display:false}},scales:{x:{grid:{display:false},ticks:{maxTicksLimit:8,color:"#8996aa"}},y:{grid:{color:"#edf1f7"},ticks:{color:"#8996aa",callback:v=>v+"°C"}}}}});
    setNotice("notice",`Weather loaded for ${cityLabel(city)}.`);
  }catch(e){setNotice("notice",e.message,true);}
}
$("citySearch").addEventListener("submit",async e=>{
  e.preventDefault();const q=$("cityInput").value.trim();if(!q)return;
  setNotice("notice","Searching for locations…");
  try{
    const results=await searchCity(q);const box=$("searchResults");
    if(!results.length){box.innerHTML="";setNotice("notice","No matching city found. Try adding a country name.",true);return;}
    box.innerHTML=results.map((c,i)=>`<button class="result-option" data-i="${i}">${escapeHtml([c.name,c.admin1,c.country].filter(Boolean).join(", "))}</button>`).join("");
    [...box.querySelectorAll("button")].forEach(b=>b.addEventListener("click",()=>{const c=results[Number(b.dataset.i)];saveCity(c);box.innerHTML="";loadDashboard(c);}));
    setNotice("notice","Choose a location from the results.");
  }catch(err){setNotice("notice",err.message,true);}
});
document.getElementById("nav").innerHTML=nav("index.html");
loadDashboard();
