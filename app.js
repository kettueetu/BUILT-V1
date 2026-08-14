
"use strict";

const KEY="fitapp-v1";
const fresh=()=>({
 clients:[{id:1,name:"Emma",weight:82.4,height:170,age:30,goal:"maintain",activity:"moderate",history:[82.4],macro:{kcal:2400,p:165,c:285,f:70},programId:null,dietId:null}],
 programs:[],library:[],diets:[],
 meals:[
  {id:1,name:"Proteiinipuuro + banaani",cat:"Aamiainen",kcal:520,p:35,c:72,f:10,foods:"Kaura, rahka, banaani"},
  {id:2,name:"Kana-riisikulho",cat:"Lounas",kcal:610,p:48,c:72,f:12,foods:"Kana, riisi, kasvikset"},
  {id:3,name:"Jauheliha-peruna",cat:"Päivällinen",kcal:640,p:45,c:60,f:22,foods:"Jauheliha 5 %, peruna, kasvikset"},
  {id:4,name:"Ruisleipä + munat",cat:"Välipala",kcal:390,p:25,c:42,f:14,foods:"Ruisleipä, kananmunat, kalkkuna"}
 ]});
let D;
try{D=JSON.parse(localStorage.getItem(KEY)||"null")}catch(e){D=null}
if(!D)D=fresh();
D.clients.forEach(c=>{c.notes=c.notes||"";c.workoutStatus=c.workoutStatus||{};c.mealStatus=c.mealStatus||{};c.alternatives=c.alternatives||[];c.messages=c.messages||[];c.openWeeks=c.openWeeks||{}});
D.programs.forEach(p=>p.weeks.forEach(w=>w.days.forEach(d=>{if(!d.sections)d.sections=[{name:"Pääosio",exercises:d.exercises||[]}]})));
let S={page:"home",cid:D.clients[0]?.id||null,role:"coach"};

const $=s=>document.querySelector(s);
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const save=()=>localStorage.setItem(KEY,JSON.stringify(D));
const client=()=>D.clients.find(c=>c.id===S.cid)||D.clients[0];
const program=()=>client()?.programId?D.programs.find(p=>p.id===client().programId):null;
const diet=()=>client()?.dietId?D.diets.find(p=>p.id===client().dietId):null;

function macroSuggestion(c){
 const w=+c.weight||80,h=+c.height||177,age=+c.age||30;
 const mult={low:1.2,moderate:1.45,high:1.65,veryhigh:1.8}[c.activity]||1.45;
 let bmr=10*w+6.25*h-5*age+5;
 let kcal=Math.round(bmr*mult)+(c.goal==="lose"?-300:c.goal==="gain"?300:0);
 kcal=Math.max(1400,kcal);
 const p=Math.round(w*2),f=Math.round(kcal*.25/9),carb=Math.max(0,Math.round((kcal-p*4-f*9)/4));
 return {bmr:Math.round(bmr),kcal,p,c:carb,f};
}

const nav=[["home","⌂","Koti"],["clients","♙","Asiakkaat"],["workouts","▣","Harjoitukset"],["food","◒","Ravinto"],["messages","✉","Viestit"]];
const clientNav=[["clienthome","⌂","Etusivu"],["clientworkout","▣","Harjoitus"],["clientfood","◒","Ruoka"],["clientmessages","✉","Viestit"]];

function render(){
 document.getElementById("app").innerHTML=`
 <div class="app">
  <div class="header"><div class="logo">FitApp<span>.</span></div>
   <div class="mode"><button data-role="coach" class="${S.role==="coach"?"active":""}">Valmentaja</button><button data-role="client" class="${S.role==="client"?"active":""}">Asiakas</button></div>
  </div>
  ${view()}
  <div class="bottom">${(S.role==="client"?clientNav:nav).map(n=>`<button data-nav="${n[0]}" class="${S.page===n[0]?"active":""}"><strong>${n[1]}</strong>${n[2]}</button>`).join("")}</div>
 </div>`;
 bind();
}

function clientBar(){
 return `<div class="clientbar">${D.clients.map(c=>`<button data-client="${c.id}" class="${c.id===S.cid?"active":""}">${esc(c.name)}</button>`).join("")}</div>`;
}

function progressChart(c){const a=c.history||[];if(a.length<2)return `<div class="muted">Lisää toinen painomittaus nähdäksesi kaavion.</div>`;const W=320,H=150,p=18,min=Math.min(...a)-1,max=Math.max(...a)+1,pts=a.map((v,i)=>{const x=p+i*(W-2*p)/(a.length-1),y=H-p-(v-min)/(max-min)*(H-2*p);return `${x},${y}`}).join(" ");return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><polyline points="${pts}" fill="none" stroke="#6f46d8" stroke-width="3"/>${a.map((v,i)=>{const [x,y]=pts.split(" ")[i].split(",");return `<circle cx="${x}" cy="${y}" r="4" fill="#6f46d8"/>`}).join("")}</svg></div>`}
function coachStatus(){const c=client(),p=program(),f=diet(),ex=p?(p.weeks||[]).flatMap(w=>w.days.flatMap(d=>d.sections.flatMap(s=>s.exercises))):[],done=ex.filter(x=>c.workoutStatus[x.id]).length,meals=f?.meals||[],md=meals.filter(id=>c.mealStatus[id]).length;return `<div class="card"><h3>Asiakkaan ilmoittama toteuma</h3><div class="grid"><div class="stat">Harjoitus <b>${done}/${ex.length}</b></div><div class="stat">Ruuat <b>${md}/${meals.length}</b></div></div>${c.alternatives.length?`<div class="note" style="margin-top:9px"><b>Vaihtoehtoiset ruuat</b><br>${c.alternatives.map(a=>{let m=D.meals.find(x=>x.id===a.mealId);return `${esc(m?.name||"Ateria")}: ${esc(a.text)}`}).join("<br>")}</div>`:""}</div>`}
function home(){const c=client(),p=program(),f=diet();return `<h1>Valmentajan koti</h1>${clientBar()}${coachStatus()}<div class="card"><h3>Painon kehitys</h3><h2>${c.weight} kg</h2>${progressChart(c)}</div><div class="card"><h3>Valmentajan muistiinpanot</h3><textarea id="notes" rows="4" placeholder="Vain valmentajalle...">${esc(c.notes||"")}</textarea><button class="btn primary wide" id="saveNotes">Tallenna muistiinpanot</button></div><div class="card"><h3>Harjoitusohjelma</h3><div class="muted">${esc(p?.name||"Ei ohjelmaa")}</div><button class="btn primary wide" data-page="workouts">Harjoitukset</button></div><div class="card"><h3>Ravinto</h3><div class="muted">${esc(f?.name||"Ei ruokavaliota")}</div><button class="btn primary wide" data-page="food">Ravinto</button></div>`}
function clients(){
 return `<h1>Asiakkaat</h1>${clientBar()}
 ${D.clients.map(c=>`<div class="card"><div class="row"><div><h3>${esc(c.name)}</h3><div class="muted">${c.weight} kg · ${c.height} cm · ${c.age} v</div></div><button class="btn" data-open="${c.id}">Avaa</button></div>
 <div class="field"><label>Uusi paino</label><div class="row"><input style="flex:1" data-weight="${c.id}" type="number" step=".1" value="${c.weight}"><button class="btn soft" data-saveweight="${c.id}">Tallenna</button></div></div></div>`).join("")}
 <button class="btn primary wide" id="newClient">+ Lisää asiakas</button>`;
}

function workouts(){
 const c=client();
 return `<h1>Harjoitukset</h1>${clientBar()}<div class="card"><h3>${esc(c.name)}</h3><div class="muted">${esc(program()?.name||"Ei ohjelmaa")}</div></div><button class="btn primary wide" id="newProgram">+ Luo harjoitusohjelma</button><h3 style="margin-top:20px">Harjoituspankki</h3>${D.library.map(x=>`<div class="card"><div class="row"><div><h3>${esc(x.name)}</h3><div class="muted">${x.exercises.length} liikettä</div></div><button class="btn primary" data-use-library="${x.id}">Asiakkaalle</button></div></div>`).join("")||`<div class="card muted">Harjoituspankki on tyhjä.</div>`}<h3 style="margin-top:20px">Ohjelmat</h3>${D.programs.map(p=>`<div class="card"><div class="row"><div><h3>${esc(p.name)}</h3><div class="muted">${esc(p.goal)}</div></div><div><button class="btn" data-edit-program="${p.id}">Muokkaa</button><button class="btn danger" data-delete-program="${p.id}">Poista</button></div></div><button class="btn soft wide" data-assign="${p.id}">Aseta asiakkaalle</button></div>`).join("")||`<div class="card muted">Ei ohjelmia.</div>`}`
}

function mealCard(m,add=true){
 return `<div class="meal"><div class="row"><div><h3>${esc(m.name)}</h3><div class="badges"><span class="badge">${m.kcal} kcal</span><span class="badge">P ${m.p}</span><span class="badge">H ${m.c}</span><span class="badge">R ${m.f}</span></div><div class="muted">${esc(m.foods)}</div></div>${add?`<button class="btn primary" data-add-meal="${m.id}">+ Lisää</button>`:""}</div></div>`;
}
function food(){
 const c=client(),f=diet(),m=c.macro||macroSuggestion(c);
 return `<h1>Ravinto</h1>${clientBar()}
 <div class="card"><h3>${esc(f?.name||"Ei ruokavaliota")}</h3><div class="badges"><span class="badge">${f?.kcal??m.kcal} kcal</span><span class="badge">P ${f?.p??m.p} g</span><span class="badge">H ${f?.c??m.c} g</span><span class="badge">R ${f?.f??m.f} g</span></div>
 <button class="btn primary wide" id="editDiet">${f?"Muokkaa ruokavaliota":"Luo ruokavalio"}</button></div>
 ${f?(f.meals||[]).map(id=>{let x=D.meals.find(q=>q.id===id);return x?mealCard(x,false):""}).join(""):""}
 <div class="card"><h3>Ruokapankki</h3><div class="muted">Valmiit ateriat ja makroihin sopivat vaihtoehdot.</div><button class="btn soft wide" data-page="foodbank">Avaa ruokapankki</button></div>`;
}
function foodbank(){
 const c=client(),f=diet(),target=f||c.macro||macroSuggestion(c);
 const score=m=>Math.abs(m.p-target.p)+Math.abs(m.c-target.c)+Math.abs(m.f-target.f);
 return `<h1>Ruokapankki</h1>${clientBar()}<div class="card"><h3>Makroihin sopivat ateriat</h3><div class="badges"><span class="badge">P ${target.p} g</span><span class="badge">H ${target.c} g</span><span class="badge">R ${target.f} g</span></div></div>
 ${D.meals.slice().sort((a,b)=>score(a)-score(b)).map(m=>mealCard(m,true)).join("")}
 <button class="btn soft wide" id="newMeal">+ Luo oma ateria</button>`;
}
function messages(){
 return `<h1>Viestit</h1>${clientBar()}<div class="card"><h3>${esc(client().name)}</h3><textarea id="message" placeholder="Kirjoita viesti..." rows="5"></textarea><button class="btn primary wide" id="send">Lähetä testiviesti</button></div>`;
}

function statusPill(done,alt=false){return `<span class="status ${done?"done":alt?"alt":"todo"}">${done?"✓ Tehty":alt?"↗ Vaihtoehtoinen":"○ Kuittaamatta"}</span>`}
function clientHome(){const c=client(),p=program(),f=diet(),ex=p?(p.weeks||[]).flatMap(w=>w.days.flatMap(d=>d.sections.flatMap(s=>s.exercises))):[],done=ex.filter(x=>c.workoutStatus[x.id]).length,meals=f?.meals||[],md=meals.filter(id=>c.mealStatus[id]).length;return `<h1>Oma päivä</h1><div class="card"><h3>${esc(c.name)}</h3><div class="muted">Paino ${c.weight} kg</div></div><div class="grid"><div class="card"><div class="muted">Harjoitus</div><h2>${done}/${ex.length}</h2><button class="btn primary wide" data-nav="clientworkout">Avaa</button></div><div class="card"><div class="muted">Ruoka</div><h2>${md}/${meals.length}</h2><button class="btn primary wide" data-nav="clientfood">Avaa</button></div></div>`}
function fmtDate(d){return d.toLocaleDateString("fi-FI",{weekday:"short",day:"numeric",month:"numeric"});}
function dateKey(d){return d.toISOString().slice(0,10);}
function parseDateKey(k){return new Date(k+"T12:00:00");}
function clientWorkout(){const c=client(),p=program(),sel=S.clientDate||dayKey();if(!p)return `<h1>Harjoitukset</h1><div class="card muted">Ei ohjelmaa.</div>`;const d=parseDateKey(sel),prev=new Date(d),next=new Date(d);prev.setDate(prev.getDate()-1);next.setDate(next.getDate()+1);const ow=c.openWeeks||{};return `<h1>Harjoitukset</h1><div class="card calendar-card"><div class="row"><button class="btn soft" data-client-date="${dateKey(prev)}">‹</button><div class="calendar-date"><b>${fmtDate(d)}</b><div class="muted">Valitse päivä</div></div><button class="btn soft" data-client-date="${dateKey(next)}">›</button></div><input type="date" id="clientDatePicker" value="${sel}"></div>${p.weeks.map((w,wi)=>`<div class="week"><button class="weekToggle" data-client-week="${wi}"><span><b>${esc(w.name||("Viikko "+(wi+1)))}</b></span><span>${ow[wi]===false?"+":"−"}</span></button>${ow[wi]===false?"":w.days.map((day,di)=>{const k=sel+"|"+wi+"|"+di,done=!!c.dailyWorkout[k];return `<div class="day"><div class="row"><h3>${esc(day.name||("Päivä "+(di+1)))}</h3>${statusPill(done)}</div>${day.sections.map(sec=>`<div class="section"><h3>${esc(sec.name)}</h3>${sec.exercises.map(x=>`<div class="exercise"><b>${esc(x.name)}</b><div class="muted">${x.sets} × ${esc(x.reps)} · ${esc(x.rest)}</div>${x.info?`<div class="note">${esc(x.info)}</div>`:""}</div>`).join("")}</div>`).join("")}<button class="btn ${done?"success":"primary"} wide" data-day-workout="${k}">${done?"Poista kuittaus":"Merkitse harjoitus tehdyksi"}</button></div>`}).join("")}</div>`).join("")}`;
}
function clientMessages(){const c=client();return `<h1>Viestit</h1><div class="card"><h3>Viestit valmentajalle</h3><textarea id="clientMsg" rows="4" placeholder="Kirjoita viesti..."></textarea><button class="btn primary wide" id="sendClientMsg">Lähetä viesti</button></div>${(c.messages||[]).slice().reverse().map(m=>`<div class="card"><div class="muted">${new Date(m.at).toLocaleString("fi-FI")}</div><div>${esc(m.text)}</div><span class="badge">${m.from==="client"?"Sinä":"Valmentaja"}</span></div>`).join("")}`}

function view(){
 if(S.role==="client")return ({clienthome:clientHome,clientworkout:clientWorkout,clientfood:clientFood,clientmessages:clientMessages}[S.page]||clientHome)();
 return ({home,clients,workouts,food,foodbank,messages}[S.page]||home)();
}

function bind(){
 document.querySelectorAll("[data-role]").forEach(b=>b.onclick=()=>{S.role=b.dataset.role;S.page=S.role==="client"?"clienthome":"home";render()});
 document.querySelectorAll("[data-nav]").forEach(b=>b.onclick=()=>{S.page=b.dataset.nav;render()});
 document.querySelectorAll("[data-page]").forEach(b=>b.onclick=()=>{S.page=b.dataset.page;render()});
 document.querySelectorAll("[data-client]").forEach(b=>b.onclick=()=>{S.cid=+b.dataset.client;render()});
 document.querySelectorAll("[data-open]").forEach(b=>b.onclick=()=>{S.cid=+b.dataset.open;S.page="home";render()});
 const nc=$("#newClient");if(nc)nc.onclick=openClient;
 const sn=$("#saveNotes");if(sn)sn.onclick=()=>{client().notes=$("#notes").value;save();sn.textContent="Tallennettu ✓";sn.disabled=true;setTimeout(()=>{if(document.body.contains(sn)){sn.textContent="Tallenna muistiinpanot";sn.disabled=false}},900)};
 document.querySelectorAll("[data-delete-program]").forEach(b=>b.onclick=()=>{if(!confirm("Poistetaanko koko ohjelma?"))return;const id=+b.dataset.deleteProgram;D.programs=D.programs.filter(p=>p.id!==id);D.clients.forEach(c=>{if(c.programId===id)c.programId=null});save();render()});
 document.querySelectorAll("[data-client-date]").forEach(b=>b.onclick=()=>{S.clientDate=b.dataset.clientDate;render()});
const dp=$("#clientDatePicker");if(dp)dp.onchange=()=>{S.clientDate=dp.value;render()};
document.querySelectorAll("[data-day-workout]").forEach(b=>b.onclick=()=>{const k=b.dataset.dayWorkout;if(client().dailyWorkout[k])delete client().dailyWorkout[k];else client().dailyWorkout[k]=Date.now();save();render()});
document.querySelectorAll("[data-day-meal]").forEach(b=>b.onclick=()=>{const k=(S.clientDate||dayKey())+"|"+b.dataset.dayMeal;if(client().dailyMeal[k])delete client().dailyMeal[k];else client().dailyMeal[k]=Date.now();save();render()});
document.querySelectorAll("[data-client-week]").forEach(b=>b.onclick=()=>{const i=+b.dataset.clientWeek;client().openWeeks[i]=client().openWeeks[i]===false?true:false;save();render()});
 const sm=$("#sendClientMsg");if(sm)sm.onclick=()=>{const t=$("#clientMsg").value.trim();if(!t)return;client().messages.push({from:"client",text:t,at:Date.now()});save();alert("Viesti lähetetty.");render()};
 document.querySelectorAll("[data-check-workout]").forEach(b=>b.onclick=()=>{const c=client(),id=b.dataset.checkWorkout;c.workoutStatus[id]?delete c.workoutStatus[id]:c.workoutStatus[id]=Date.now();save();render()});
 document.querySelectorAll("[data-check-meal]").forEach(b=>b.onclick=()=>{const c=client(),id=+b.dataset.checkMeal;c.mealStatus[id]?delete c.mealStatus[id]:c.mealStatus[id]=Date.now();save();render()});
 document.querySelectorAll("[data-alt-meal]").forEach(b=>b.onclick=()=>openAlternative(+b.dataset.altMeal));
 document.querySelectorAll("[data-saveweight]").forEach(b=>b.onclick=()=>{if(b.dataset.busy)return;b.dataset.busy="1";b.disabled=true;const c=D.clients.find(x=>x.id===+b.dataset.saveweight),i=document.querySelector(`[data-weight="${b.dataset.saveweight}"]`),v=+i.value;if(!Number.isFinite(v)||v<=0){b.dataset.busy="";b.disabled=false;return alert("Anna kelvollinen paino.")}c.weight=v;c.history.push(v);save();alert("Uusi paino tallennettu.");render()});
 const np=$("#newProgram");if(np)np.onclick=()=>openProgram({id:Date.now(),name:"Uusi ohjelma",goal:"Voima",weeks:[{name:"Viikko 1",days:[{name:"Harjoitus A",sections:[{name:"Pääosio",exercises:[]}]}]}]});
 document.querySelectorAll("[data-edit-program]").forEach(b=>b.onclick=()=>openProgram(D.programs.find(x=>x.id===+b.dataset.editProgram)));
 document.querySelectorAll("[data-assign]").forEach(b=>b.onclick=()=>{client().programId=+b.dataset.assign;save();render()});
 document.querySelectorAll("[data-use-library]").forEach(b=>b.onclick=()=>{const l=D.library.find(x=>x.id===+b.dataset.useLibrary);const p={id:Date.now(),name:l.name,goal:l.goal,weeks:[{name:"Viikko 1",days:[{name:"Harjoitus A",exercises:JSON.parse(JSON.stringify(l.exercises))}]}]};D.programs.push(p);client().programId=p.id;save();render()});
 const ed=$("#editDiet");if(ed)ed.onclick=()=>openDiet(diet()||{id:Date.now(),name:"Uusi ruokavalio",kcal:client().macro?.kcal||2400,p:client().macro?.p||160,c:client().macro?.c||250,f:client().macro?.f||70,meals:[]});
 document.querySelectorAll("[data-add-meal]").forEach(b=>b.onclick=()=>{let f=diet();if(!f){f={id:Date.now(),name:"Uusi ruokavalio",kcal:client().macro.kcal,p:client().macro.p,c:client().macro.c,f:client().macro.f,meals:[]};D.diets.push(f);client().dietId=f.id}f.meals=f.meals||[];if(!f.meals.includes(+b.dataset.addMeal)){f.meals.push(+b.dataset.addMeal);save();alert("Ateria lisätty ruokavalioon ✓");}else{alert("Ateria on jo ruokavaliossa.")}render()});
 const nm=$("#newMeal");if(nm)nm.onclick=openMeal;
 const send=$("#send");if(send)send.onclick=()=>{alert("Testiviesti lähetetty.");$("#message").value=""};
}

function openClient(){
 document.body.insertAdjacentHTML("beforeend",`<div class="modal"><div class="sheet"><h2>Uusi asiakas</h2>
 <div class="field"><label>Nimi</label><input id="cn" placeholder="Asiakkaan nimi"></div>
 <div class="grid"><div class="field"><label>Paino kg</label><input id="cw" type="number" value="80"></div><div class="field"><label>Pituus cm</label><input id="ch" type="number" value="177"></div><div class="field"><label>Ikä</label><input id="ca" type="number" value="30"></div><div class="field"><label>Tavoite</label><select id="cg"><option value="maintain">Ylläpito</option><option value="lose">Pudotus</option><option value="gain">Nosto</option></select></div></div>
 <div class="field"><label>Aktiivisuus</label><select id="ct"><option value="low">Kevyt</option><option value="moderate" selected>Kohtalainen</option><option value="high">Aktiivinen</option><option value="veryhigh">Erittäin aktiivinen</option></select></div>
 <div class="card" id="suggest"></div><div class="actions"><button class="btn primary wide" id="create">Luo asiakas</button><button class="btn soft wide" id="cancel">Peruuta</button></div></div></div>`);
 const m=document.querySelector(".modal:last-child");
 const update=()=>{const c={weight:+$("#cw").value,height:+$("#ch").value,age:+$("#ca").value,goal:$("#cg").value,activity:$("#ct").value},x=macroSuggestion(c);$("#suggest").innerHTML=`<h3>Suositeltu aloitus</h3><div class="badges"><span class="badge">${x.kcal} kcal</span><span class="badge">P ${x.p} g</span><span class="badge">H ${x.c} g</span><span class="badge">R ${x.f} g</span></div><div class="muted" style="margin-top:6px">BMR noin ${x.bmr} kcal. Makrot voi muuttaa myöhemmin.</div>`};
 ["cw","ch","ca","cg","ct"].forEach(id=>m.querySelector("#"+id).addEventListener("input",update));update();
 m.querySelector("#cancel").onclick=()=>m.remove();
 m.querySelector("#create").onclick=()=>{const name=$("#cn").value.trim();if(!name)return alert("Anna nimi.");const c={id:Date.now(),name,weight:+$("#cw").value,height:+$("#ch").value,age:+$("#ca").value,goal:$("#cg").value,activity:$("#ct").value,history:[+$("#cw").value],programId:null,dietId:null,macro:macroSuggestion({weight:+$("#cw").value,height:+$("#ch").value,age:+$("#ca").value,goal:$("#cg").value,activity:$("#ct").value})};D.clients.push(c);S.cid=c.id;save();m.remove();render()};
}

function openProgram(p){
 document.body.insertAdjacentHTML("beforeend",`<div class="modal"><div class="sheet"><div class="row"><h2>Harjoituksen rakentaminen</h2><button class="btn danger" id="close">Sulje</button></div>
 <div class="field"><label>Nimi</label><input id="pn" value="${esc(p.name)}"></div><div class="field"><label>Tavoite</label><select id="pg">${["Voima","Hypertrofia","Olympianostot","Yleiskunto"].map(x=>`<option ${x===p.goal?"selected":""}>${x}</option>`).join("")}</select></div>
 <div id="weeks">${p.weeks.map((w,wi)=>weekHtml(w,wi)).join("")}</div><button class="btn soft wide" id="addweek">+ Viikko</button>
 <div class="actions"><button class="btn primary wide" id="savep">Tallenna asiakkaalle</button><button class="btn primary wide" id="savelib">Tallenna myös harjoituspankkiin</button></div></div></div>`);
 const m=document.querySelector(".modal:last-child");
 m.querySelector("#close").onclick=()=>m.remove();
 const refresh=()=>{m.querySelector("#weeks").innerHTML=p.weeks.map((w,wi)=>weekHtml(w,wi)).join("");bindEditor(m,p,refresh)};
 m.querySelector("#addweek").onclick=()=>{p.weeks.push({name:"Viikko "+(p.weeks.length+1),days:[]});refresh()};
 bindEditor(m,p,refresh);
 m.querySelector("#savep").onclick=()=>{readProgram(m,p);p.name=$("#pn").value||"Ohjelma";p.goal=$("#pg").value;const ix=D.programs.findIndex(x=>x.id===p.id);if(ix<0)D.programs.push(p);client().programId=p.id;save();m.remove();render()};
 m.querySelector("#savelib").onclick=()=>{readProgram(m,p);p.name=$("#pn").value||"Ohjelma";p.goal=$("#pg").value;const ex=p.weeks.flatMap(w=>w.days.flatMap(d=>d.sections.flatMap(s=>s.exercises)));D.library.push({id:Date.now(),name:p.name,goal:p.goal,exercises:JSON.parse(JSON.stringify(ex))});save();m.remove();render()};
}
function weekHtml(w,wi){return `<div class="week"><div class="row"><h3>${esc(w.name)}</h3><button class="btn danger" data-delweek="${wi}">×</button></div><div class="field"><label>Viikon nimi</label><input data-week="${wi}" value="${esc(w.name)}"></div>${w.days.map((d,di)=>`<div class="day"><div class="field"><label>Harjoitus</label><input data-day="${wi}:${di}" value="${esc(d.name)}"></div>${d.sections.map((sec,si)=>`<div class="section"><div class="row"><h3>${esc(sec.name)}</h3><button class="btn danger" data-delsection="${wi}:${di}:${si}">×</button></div><div class="field"><label>Osion nimi</label><input data-section="${wi}:${di}:${si}" value="${esc(sec.name)}"></div>${sec.exercises.map((x,xi)=>`<div class="exercise"><div class="exgrid"><input data-ex="${wi}:${di}:${si}:${xi}:n" value="${esc(x.name)}" placeholder="Liike"><input data-ex="${wi}:${di}:${si}:${xi}:s" type="number" value="${x.sets}"><input data-ex="${wi}:${di}:${si}:${xi}:r" value="${esc(x.reps)}"><input data-ex="${wi}:${di}:${si}:${xi}:t" value="${esc(x.rest)}"><button class="btn danger" data-delex="${wi}:${di}:${si}:${xi}">×</button></div><textarea data-ex="${wi}:${di}:${si}:${xi}:i" rows="2" placeholder="Lisätieto / vinkki liikkeeseen">${esc(x.info||"")}</textarea></div>`).join("")}<button class="btn soft" data-addex="${wi}:${di}:${si}">+ Liike</button></div>`).join("")}<button class="btn soft" data-addsection="${wi}:${di}">+ Osio tähän harjoitusin</button><button class="btn danger wide" data-deld="${wi}:${di}">Poista harjoitus</button></div>`).join("")}<button class="btn soft" data-addday="${wi}">+ Harjoituspäivä</button></div>`}
function bindEditor(m,p,refresh){m.querySelectorAll("[data-week],[data-day],[data-section],[data-ex]").forEach(el=>el.addEventListener("input",()=>readProgram(m,p)));m.querySelectorAll("[data-addday]").forEach(b=>b.onclick=()=>{readProgram(m,p);p.weeks[+b.dataset.addday].days.push({name:"Uusi harjoitus",sections:[{name:"Pääosio",exercises:[]}]});refresh()});m.querySelectorAll("[data-addsection]").forEach(b=>b.onclick=()=>{readProgram(m,p);const [w,d]=b.dataset.addsection.split(":").map(Number);p.weeks[w].days[d].sections.push({name:"Uusi osio",exercises:[]});refresh()});m.querySelectorAll("[data-addex]").forEach(b=>b.onclick=()=>{readProgram(m,p);const [w,d,s]=b.dataset.addex.split(":").map(Number);p.weeks[w].days[d].sections[s].exercises.push({id:"ex"+Date.now()+Math.random(),name:"Uusi liike",sets:3,reps:"8-12",rest:"90 s"});refresh()});m.querySelectorAll("[data-delex]").forEach(b=>b.onclick=()=>{readProgram(m,p);const [w,d,s,x]=b.dataset.delex.split(":").map(Number);p.weeks[w].days[d].sections[s].exercises.splice(x,1);refresh()});m.querySelectorAll("[data-delsection]").forEach(b=>b.onclick=()=>{readProgram(m,p);const [w,d,s]=b.dataset.delsection.split(":").map(Number);if(p.weeks[w].days[d].sections.length>1)p.weeks[w].days[d].sections.splice(s,1);refresh()});m.querySelectorAll("[data-deld]").forEach(b=>b.onclick=()=>{const [w,d]=b.dataset.deld.split(":").map(Number);p.weeks[w].days.splice(d,1);refresh()});m.querySelectorAll("[data-delweek]").forEach(b=>b.onclick=()=>{if(p.weeks.length>1)p.weeks.splice(+b.dataset.delweek,1);refresh()})}
function readProgram(m,p){p.weeks.forEach((w,wi)=>{const we=m.querySelector(`[data-week="${wi}"]`);if(we)w.name=we.value;w.days.forEach((d,di)=>{const da=m.querySelector(`[data-day="${wi}:${di}"]`);if(da)d.name=da.value;d.sections.forEach((sec,si)=>{const se=m.querySelector(`[data-section="${wi}:${di}:${si}"]`);if(se)sec.name=se.value;sec.exercises.forEach((x,xi)=>{let q=k=>m.querySelector(`[data-ex="${wi}:${di}:${si}:${xi}:${k}"]`);x.name=q("n")?.value||x.name;x.sets=+(q("s")?.value||x.sets);x.reps=q("r")?.value||x.reps;x.rest=q("t")?.value||x.rest;x.info=q("i")?.value||"";x.id=x.id||"ex"+Date.now()+Math.random()})})})})}
function openDiet(f){
 document.body.insertAdjacentHTML("beforeend",`<div class="modal"><div class="sheet"><div class="row"><h2>Ruokavalio</h2><button class="btn danger" id="close">Sulje</button></div>
 <div class="field"><label>Nimi</label><input id="dn" value="${esc(f.name)}"></div><div class="grid"><div class="field"><label>kcal</label><input id="dk" type="number" value="${f.kcal}"></div><div class="field"><label>Proteiini g</label><input id="dp" type="number" value="${f.p}"></div><div class="field"><label>Hiilihydraatit g</label><input id="dc" type="number" value="${f.c}"></div><div class="field"><label>Rasva g</label><input id="df" type="number" value="${f.f}"></div></div>
 <h3>Ateriat</h3><div id="dietMeals">${(f.meals||[]).map(id=>{const x=D.meals.find(q=>q.id===id);return x?`<div class="meal row"><b>${esc(x.name)}</b><button class="btn danger" data-rm="${id}">Poista</button></div>`:""}).join("")}</div>
 <button class="btn soft wide" id="addfrom">+ Lisää ruokapankista</button><div class="actions"><button class="btn primary wide" id="save">Tallenna ruokavalio</button></div></div></div>`);
 const m=document.querySelector(".modal:last-child");m.querySelector("#close").onclick=()=>m.remove();
 m.querySelector("#addfrom").onclick=()=>{m.remove();S.page="foodbank";render()};
 m.querySelector("#save").onclick=()=>{f.name=$("#dn").value||"Ruokavalio";f.kcal=+$("#dk").value;f.p=+$("#dp").value;f.c=+$("#dc").value;f.f=+$("#df").value;let ix=D.diets.findIndex(x=>x.id===f.id);if(ix<0)D.diets.push(f);client().dietId=f.id;client().macro={kcal:f.kcal,p:f.p,c:f.c,f:f.f};save();m.remove();render()};
 m.querySelectorAll("[data-rm]").forEach(b=>b.onclick=()=>{f.meals=f.meals.filter(id=>id!==+b.dataset.rm);m.remove();openDiet(f)});
}
function openAlternative(mealId){document.body.insertAdjacentHTML("beforeend",`<div class="modal"><div class="sheet"><h2>Vaihtoehtoinen ruoka</h2><div class="field"><label>Mitä söit tämän sijaan?</label><textarea id="alt" rows="5" placeholder="Esim. kana + peruna + salaatti"></textarea></div><div class="actions"><button class="btn primary wide" id="saveAlt">Ilmoita valmentajalle</button><button class="btn soft wide" id="close">Peruuta</button></div></div></div>`);const m=document.querySelector(".modal:last-child");m.querySelector("#close").onclick=()=>m.remove();m.querySelector("#saveAlt").onclick=()=>{const text=m.querySelector("#alt").value.trim();if(!text)return alert("Kirjoita vaihtoehtoinen ruoka.");client().alternatives=client().alternatives.filter(a=>a.mealId!==mealId);client().alternatives.push({mealId,text,at:Date.now()});save();m.remove();alert("Vaihtoehtoinen ruoka ilmoitettu valmentajalle.");render()}}

function openMeal(){
 const cats=["Aamiainen","Lounas","Päivällinen","Välipala"];
 document.body.insertAdjacentHTML("beforeend",`<div class="modal"><div class="sheet"><h2>Uusi ateria</h2>
 <div class="field"><label>Nimi</label><input id="mn"></div><div class="field"><label>Kategoria</label><select id="mc">${cats.map(x=>`<option>${x}</option>`).join("")}</select></div>
 <div class="grid"><div class="field"><label>kcal</label><input id="mk" type="number" value="400"></div><div class="field"><label>P</label><input id="mp" type="number" value="30"></div><div class="field"><label>H</label><input id="mh" type="number" value="40"></div><div class="field"><label>R</label><input id="mf" type="number" value="10"></div></div>
 <div class="field"><label>Ruoka-aineet</label><textarea id="foods" rows="4"></textarea></div><div class="actions"><button class="btn primary wide" id="save">Tallenna ateria</button><button class="btn soft wide" id="close">Peruuta</button></div></div></div>`);
 const m=document.querySelector(".modal:last-child");m.querySelector("#close").onclick=()=>m.remove();m.querySelector("#save").onclick=()=>{if(!$("#mn").value.trim())return alert("Anna aterialle nimi.");D.meals.push({id:Date.now(),name:$("#mn").value.trim(),cat:$("#mc").value,kcal:+$("#mk").value,p:+$("#mp").value,c:+$("#mh").value,f:+$("#mf").value,foods:$("#foods").value});save();m.remove();render()};
}
render();
