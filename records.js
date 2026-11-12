document.getElementById("nav").innerHTML=nav("records.html");
const $=id=>document.getElementById(id);
const today=new Date();const end=new Date(today);end.setDate(end.getDate()-5);const start=new Date(end);start.setDate(start.getDate()-13);
const iso=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
$("recordStart").value=iso(start);$("recordEnd").value=iso(end);
function allCities(){const main=getSavedCity();const others=(()=>{try{return JSON.parse(localStorage.getItem("weatherLocations")||"[]")}catch{return []}})();return [main,...others.filter(c=>Number(c.latitude)!==Number(main.latitude)||Number(c.longitude)!==Number(main.longitude))];}
function selectedCoords(){const [latitude,longitude]=$("recordLocation").value.split(",").map(Number);return {latitude,longitude};}
function setLocationOptions(){const cities=allCities();$("recordLocation").innerHTML=cities.map(c=>`<option value="${c.latitude},${c.longitude}">${escapeHtml(cityLabel(c))}</option>`).join("");$("navCity").textContent=getSavedCity().name;}
async function loadRecords(){
 const from=$("recordStart").value,to=$("recordEnd").value;if(!from||!to||from>to){setNotice("notice","Please choose a valid date range.",true);return;}
 const coords=selectedCoords();setNotice("notice","Loading weather records…");
 try{
  const data=await api(`/api/history?latitude=${coords.latitude}&longitude=${coords.longitude}&start=${from}&end=${to}`),d=data.daily||{},times=d.time||[];
  const rows=times.map((date,i)=>`<tr><td>${escapeHtml(date)}</td><td>${fmt(d.temperature_2m_max?.[i],1)} °C</td><td>${fmt(d.temperature_2m_min?.[i],1)} °C</td><td>${fmt(d.precipitation_sum?.[i],1)} mm</td><td>${fmt(d.wind_speed_10m_max?.[i],1)} km/h</td></tr>`).join("");
  $("recordBody").innerHTML=rows||'<tr><td colspan="5" class="empty">No records found for these dates.</td></tr>';
  $("recordCount").textContent=`${times.length} ROWS`;$("tableSub").textContent=`${$("recordLocation").selectedOptions[0]?.textContent||"Selected location"} · ${from} to ${to}`;
  setNotice("notice",`Loaded ${times.length} daily records.`);
 }catch(e){setNotice("notice",e.message,true);}
}
$("loadRecords").addEventListener("click",loadRecords);
$("exportCsv").addEventListener("click",()=>{const coords=selectedCoords();window.location.href=`/api/export?latitude=${coords.latitude}&longitude=${coords.longitude}`;});
setLocationOptions();loadRecords();
