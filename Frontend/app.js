let API_URL = localStorage.getItem("api_url") || "http://localhost:4000";
let API_KEY = localStorage.getItem("api_key") || "";

const el = id=>document.getElementById(id);
const content = el("content");
const quick = el("quick-input");
const apiUrlInput = el("api-url");
const apiKeyInput = el("api-key");

apiUrlInput.value = API_URL;
apiKeyInput.value = API_KEY;

el("save-config").onclick = ()=>{
  API_URL = apiUrlInput.value.trim();
  API_KEY = apiKeyInput.value.trim();
  localStorage.setItem("api_url",API_URL);
  localStorage.setItem("api_key",API_KEY);
  alert("Config guardada");
  loadEvents();
};

el("btn-agenda").onclick = ()=>loadEvents();
el("btn-notas").onclick = ()=>loadNotes();

async function api(path,opts={}) {
  const headers = opts.headers||{};
  if(API_KEY) headers["x-api-key"]=API_KEY;
  headers["Content-Type"]="application/json";
  const res = await fetch(API_URL+path,{...opts,headers});
  if(!res.ok){const t = await res.text();throw new Error(`API error ${res.status}: ${t}`);}
  return res.json();
}

async function loadEvents(){
  content.innerHTML="<div class='card small'>Cargando eventos...</div>";
  try{
    const events = await api("/events");
    if(!events.length){content.innerHTML="<div class='card'><h3>No hay eventos</h3></div>";return;}
    content.innerHTML="";
    events.forEach(ev=>{
      const d = ev.datetime ? new Date(ev.datetime).toLocaleString() : "sin fecha";
      const node=document.createElement("div");
      node.className="card";
      node.innerHTML=`<h3>${ev.title}</h3><div class="small">${d}</div><div class="small">ID: ${ev.id}</div>`;
      content.appendChild(node);
    });
  }catch(err){content.innerHTML=`<div class='card small'>Error: ${err.message}</div>`;}
}

async function loadNotes(){
  content.innerHTML="<div class='card small'>Cargando notas...</div>";
  try{
    const notes = await api("/notes");
    if(!notes.length){content.innerHTML="<div class='card'><h3>No hay notas</h3></div>";return;}
    content.innerHTML="";
    notes.forEach(n=>{
      const node=document.createElement("div");
      node.className="card";
      node.innerHTML=`<h3>${n.title||"Sin título"}</h3><div class="small">${n.content}</div>`;
      content.appendChild(node);
    });
  }catch(err){content.innerHTML=`<div class='card small'>Error: ${err.message}</div>`;}
}

// Quick input: envía texto natural al backend para parsear y crear evento o nota
quick.addEventListener("keydown", async e=>{
  if(e.key!=="Enter") return;
  const text = quick.value.trim();
  if(!text) return;

  try{
    if(text.toLowerCase().includes("cacahuetecosmico")){
      const res = await api("/parse-and-create",{method:"POST",body:JSON.stringify({text})});
      alert(`Evento creado: ${res.event.title}`);
      quick.value="";
      loadEvents();
      return;
    }
    // Si no tiene la palabra clave -> nota
    await api("/notes",{method:"POST",body:JSON.stringify({title:null,content:text})});
    quick.value="";
    loadNotes();
  }catch(err){alert("Error: "+err.message);}
});

// carga inicial
loadEvents();
