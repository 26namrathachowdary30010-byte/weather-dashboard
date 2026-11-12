document.getElementById("nav").innerHTML=nav("locations.html");
const $=id=>document.getElementById(id);
function getLocations(){try{return JSON.parse(localStorage.getItem("weatherLocations")||"[]");}catch{return [];}}
function saveLocations(list){localStorage.setItem("weatherLocations",JSON.stringify(list));}
function addLocation(city){let list=getLocations();if(!list.some(c=>Number(c.latitude)===Number(city.latitude)&&Number(c.longitude)===Number(city.longitude)))list.push(city);saveLocations(list);}
async function renderLocations(){
 const list=getLocations();const main=getSavedCity();$("navCity").textContent=main.name;
 if(!list.length){$("cityGrid").innerHTML='<div class="panel empty">No saved locations yet. Search for a city above to add one.</div>';return;}
 $("cityGrid").innerHTML=list.map((c,i)=>`<article class="city-card" id="city-${i}"><div class="city-name">${escapeHtml(cityLabel(c))}</div><div class="city-temp">…</div><div class="small">Loading weather conditions</div><div class="city-detail"><span>Humidity</span><strong>—</strong></div><div class="city-detail"><span>Wind</span><strong>—</strong></div><div class="section-gap" style="display:flex;gap:8px;flex-wrap:wrap"><button data-main="${i}">Set as main</button><button class="secondary" data-remove="${i}">Remove</button></div></article>`).join("");
 [...$("cityGrid").querySelectorAll("[data-main]")].forEach(b=>b.addEventListener("click",()=>{const c=getLocations()[Number(b.dataset.main)];saveCity(c);setNotice("notice",`${c.name} is now your main dashboard location.`);renderLocations();}));
 [...$("cityGrid").querySelectorAll("[data-remove]")].forEach(b=>b.addEventListener("click",()=>{const list=getLocations();list.splice(Number(b.dataset.remove),1);saveLocations(list);renderLocations();}));
 await Promise.all(list.map(async(c,i)=>{
  try{const d=await api(`/api/weather?${weatherQuery(c)}`),cur=d.current||{},card=$(`city-${i}`);if(!card)return;
   card.querySelector(".city-temp").textContent=`${fmt(cur.temperature_2m)}°C`;
   const desc=Number(cur.precipitation)>.5?"Rainy":Number(cur.cloud_cover)>60?"Cloudy":"Clear / partly cloudy";
   card.querySelector(".small").textContent=desc;
   const detail=card.querySelectorAll(".city-detail strong");detail[0].textContent=`${fmt(cur.relative_humidity_2m)}%`;detail[1].textContent=`${fmt(cur.wind_speed_10m)} km/h`;
  }catch(e){const card=$(`city-${i}`);if(card)card.querySelector(".small").textContent="Could not load current weather.";}
 }));
}
$("locationSearch").addEventListener("submit",async e=>{
 e.preventDefault();const q=$("locationInput").value.trim();setNotice("notice","Searching…");
 try{const results=await searchCity(q);const box=$("searchResults");if(!results.length){setNotice("notice","No matching city found.",true);return;}
 box.innerHTML=results.map((c,i)=>`<button class="result-option" data-i="${i}">${escapeHtml([c.name,c.admin1,c.country].filter(Boolean).join(", "))}</button>`).join("");
 [...box.querySelectorAll("button")].forEach(b=>b.addEventListener("click",()=>{addLocation(results[Number(b.dataset.i)]);box.innerHTML="";$("locationInput").value="";setNotice("notice","Location added.");renderLocations();}));
 setNotice("notice","Select the city you want to add.");
 }catch(err){setNotice("notice",err.message,true);}
});
$("refresh").addEventListener("click",renderLocations);renderLocations();
