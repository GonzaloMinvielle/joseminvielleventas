"use strict";
const KEY = "libreta-ventas-v1";
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const money = n => new Intl.NumberFormat("es-AR", {style:"currency", currency:"ARS", maximumFractionDigits:0}).format(Math.round(+n || 0));
const num = v => { const n = parseFloat(String(v).replace(/\./g, "").replace(",", ".")); return isFinite(n) ? n : 0; };
const uid = () => Math.random().toString(36).slice(2, 10);
const today = () => new Date().toISOString().slice(0, 10);
const fdate = d => d ? d.split("-").reverse().join("/") : "";
const digits = t => String(t || "").replace(/\D/g, "");
const telOk = t => digits(t).length === 10;
const waLink = (t, msg) => "https://wa.me/549" + digits(t) + (msg ? "?text=" + encodeURIComponent(msg) : "");

const IC = {
  pedidos:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 3h9l4 4v14H6z"/><path d="M9 11h7M9 15h7"/></svg>',
  contactos:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="8" r="3.5"/><path d="M3 20c.6-3.4 3-5 6-5s5.4 1.6 6 5M16 5.5a3 3 0 010 5.5M18 15c1.8.6 2.8 2.2 3 5"/></svg>',
  productos:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7.5l4 2.9-1.5 4.6h-5L8 10.4z"/></svg>',
  catalogos:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5"/><path d="M13.5 17.2h7.5M17.2 13.5v7.5"/></svg>',
  share:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="M8.2 10.8l7.6-4.4M8.2 13.2l7.6 4.4"/></svg>',
  resumen:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
  ajustes:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/></svg>',
  wa:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 00-8.6 15.1L2 22l5-1.3A10 10 0 1012 2zm0 18.2a8.2 8.2 0 01-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1112 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 01-3.3-2.9c-.3-.4.3-.4.8-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 00-.7.3 3 3 0 00-.9 2.2 5.2 5.2 0 001.1 2.7 11.8 11.8 0 004.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2s.2-1.1.2-1.2-.2-.2-.5-.3z"/></svg>',
  tel:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 3h4l2 5-2.5 1.5a11 11 0 006 6L16 13l5 2v4a2 2 0 01-2 2A17 17 0 013 5a2 2 0 012-2z"/></svg>',
  x:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  plus:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M12 5v14M5 12h14"/></svg>',
  pdf:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 3h9l4 4v14H6z"/><path d="M12 10v6M9.5 13.5L12 16l2.5-2.5"/></svg>'
};

/* ---------- Datos ---------- */
const DEFAULT_PRODS = [["Aquila",41082,48080],["Apolo",40080,48000],["Lyra",27600,37600],["Spica",28182,35000],["Pegaso",27200,35000],
  ["Borealis Rosa",28182,33000],["Borealis Pro",0,0],["Betel",0,0],["Cetus",0,0],["Naos",28182,33000],["Centauro",0,0],["Bolso",25082,43000]];

function emptyState(){
  return {v:1, config:{nombre:"", tel:"", loc:"", pie:"Precios sujetos a cambio sin previo aviso.", validez:7},
    productos: DEFAULT_PRODS.map(([nombre,costo,precio]) => ({id:uid(), nombre, costo, precio, foto:""})),
    contactos:[], pedidos:[], catalogos:[], nextNum:1};
}
let S;
function migrate(){ S.catalogos ||= []; S.contactos ||= []; S.pedidos ||= []; S.productos ||= []; S.nextNum ||= 1;
  S.config = Object.assign({nombre:"", tel:"", loc:"", pie:"", validez:7}, S.config || {}); }
function save(){ DB.save(S); }
const contact = id => S.contactos.find(c => c.id === id);
const cname = c => !c ? "Sin cliente" : (c.club && c.nombre ? c.club + " (" + c.nombre + ")" : (c.club || c.nombre));
const prod = id => S.productos.find(p => p.id === id);

function calc(p){
  let venta = 0, costo = 0;
  if (p.tot) { venta = num(p.tot.venta); costo = num(p.tot.costo); }
  else for (const i of p.items) { venta += num(i.cant) * num(i.precio); costo += num(i.cant) * num(i.costo); }
  const flete = num(p.flete), total = venta + flete, gan = venta - costo - num(p.comision);
  const saldo = p.estado === "vendido" ? Math.max(0, total - num(p.cobrado)) : 0;
  return {venta, costo, flete, total, gan, saldo};
}
function phoneCounts(){ const m = {}; for (const c of S.contactos) { const d = digits(c.tel); if (d) m[d] = (m[d]||0)+1; } return m; }

/* ---------- Utilidades de interfaz ---------- */
let toastT;
function toast(msg){
  document.querySelector(".toast")?.remove();
  const t = document.createElement("div"); t.className = "toast"; t.setAttribute("role","status"); t.textContent = msg;
  document.body.appendChild(t); clearTimeout(toastT); toastT = setTimeout(() => t.remove(), 3200);
}
async function saveFile(filename, data, mime){
  try {
    if (window.claude && typeof window.claude.use === "function") {
      const dl = await window.claude.use("downloads");
      if (dl) {
        try { await dl.save({filename, data}); toast("Archivo listo: " + filename); }
        catch(e) { if (e && e.code !== "declined") toast("No se pudo descargar el archivo."); }
        return;
      }
    }
  } catch(e) {}
  const blob = data instanceof Blob ? data : new Blob([data], {type: mime || "application/octet-stream"});
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = filename;
  document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}
function openModal(html){
  const m = $("#modal"); m.innerHTML = '<div class="overlay"><div class="sheet" role="dialog" aria-modal="true">' + html + "</div></div>";
  m.querySelector(".overlay").addEventListener("mousedown", e => { if (e.target.classList.contains("overlay")) closeModal(); });
  setTimeout(() => m.querySelector("[autofocus]")?.focus(), 30);
  return m.querySelector(".sheet");
}
function closeModal(){ $("#modal").innerHTML = ""; }
document.addEventListener("keydown", e => { if (e.key === "Escape" && $("#modal").innerHTML) closeModal(); });

/* ---------- Navegación ---------- */
const TABS = [["pedidos","Pedidos"],["contactos","Contactos"],["productos","Productos"],["catalogos","Catálogos"],["resumen","Resumen"],["ajustes","Ajustes"]];
let tab = "pedidos";
function renderTabs(){
  $("#tabs").innerHTML = TABS.map(([k,l]) => `<button data-tab="${k}" ${tab===k?'aria-current="page"':""}>${IC[k]}<span>${l}</span></button>`).join("");
  $("#tabs").querySelectorAll("button").forEach(b => b.onclick = () => { tab = b.dataset.tab; render(); window.scrollTo(0,0); });
}
function render(){ renderTabs(); ({pedidos:viewPedidos, contactos:viewContactos, productos:viewProductos, catalogos:viewCatalogos, resumen:viewResumen, ajustes:viewAjustes})[tab](); }

/* ---------- Pedidos ---------- */
let pedFiltro = "todos", pedQ = "";
function pedidoLabel(p){ return p.historico ? "Histórico" : "N° " + String(p.num).padStart(4,"0"); }
function viewPedidos(){
  const q = pedQ.toLowerCase();
  const all = [...S.pedidos].sort((a,b) => (b.historico?0:1)-(a.historico?0:1) || (b.fecha||"").localeCompare(a.fecha||"") || (b.num||0)-(a.num||0));
  const f = {
    todos: () => true, pres: p => p.estado === "presupuesto", vend: p => p.estado === "vendido", debe: p => calc(p).saldo > 0
  };
  const cnt = k => all.filter(f[k]).length;
  const list = all.filter(f[pedFiltro]).filter(p => {
    if (!q) return true; const c = contact(p.clienteId);
    return (cname(c) + " " + p.items.map(i => i.nombre).join(" ") + " " + (p.notas||"")).toLowerCase().includes(q);
  });
  $("#main").innerHTML = `
    <div class="bar"><h2>Pedidos</h2>
      <input class="search" id="pq" type="search" placeholder="Buscar cliente o modelo" value="${esc(pedQ)}">
      <button class="btn primary" id="nuevo">${IC.plus}Nuevo pedido</button></div>
    <div class="chips">
      ${[["todos","Todos"],["pres","Presupuestos"],["vend","Vendidos"],["debe","Con saldo"]].map(([k,l]) =>
        `<button class="chip" data-f="${k}" aria-pressed="${pedFiltro===k}">${l}<b>${cnt(k)}</b></button>`).join("")}
    </div>
    <div class="list">${list.length ? list.map(p => {
      const c = contact(p.clienteId), k = calc(p);
      const tag = p.historico ? '<span class="tag hist">Histórico</span>' : p.estado === "vendido" ? '<span class="tag vend">Vendido</span>' : '<span class="tag pres">Presupuesto</span>';
      return `<button class="row" data-id="${p.id}"><div class="grow">
        <div class="t">${esc(cname(c))}${tag}${k.saldo>0?'<span class="tag debe">Debe '+money(k.saldo)+'</span>':""}</div>
        <div class="s">${p.historico ? "" : esc(pedidoLabel(p)) + " · " + fdate(p.fecha) + " · "}${esc(p.items.map(i => i.cant + " " + i.nombre).join(", ") || "Sin productos")}</div></div>
        <div class="amt">${money(k.total)}<small>ganancia ${money(k.gan)}</small></div></button>`;
    }).join("") : '<div class="empty">No hay pedidos con ese filtro. Tocá "Nuevo pedido" para armar uno.</div>'}</div>`;
  $("#pq").oninput = e => { pedQ = e.target.value; const pos = e.target.selectionStart; viewPedidos(); const i = $("#pq"); i.focus(); i.setSelectionRange(pos,pos); };
  $("#nuevo").onclick = () => editPedido(null);
  document.querySelectorAll("[data-f]").forEach(b => b.onclick = () => { pedFiltro = b.dataset.f; viewPedidos(); });
  document.querySelectorAll(".row[data-id]").forEach(b => b.onclick = () => editPedido(b.dataset.id));
}

function clientOptions(){
  const seen = {}, map = {};
  const labels = S.contactos.map(c => { let l = cname(c); if (seen[l]) l += " #" + (++seen[l]); else seen[l] = 1; map[l] = c.id; return l; });
  return {labels, map, labelOf: id => Object.keys(map).find(k => map[k] === id) || ""};
}

function editPedido(id, presetClient){
  const orig = id ? S.pedidos.find(p => p.id === id) : null;
  const d = orig ? JSON.parse(JSON.stringify(orig)) : {id:uid(), num:null, fecha:today(), clienteId:presetClient||"", estado:"presupuesto",
    items:[], flete:0, comision:0, comisionA:"", cobrado:0, notas:""};
  if (!orig) d.items.push(newItem());
  const co = clientOptions();
  const sheet = openModal(`
    <div class="sheet-h"><h2>${orig ? esc(pedidoLabel(orig)) : "Nuevo pedido"}</h2><button class="icon-btn" id="cerrar" aria-label="Cerrar">${IC.x}</button></div>
    <div class="sheet-b">
      <div class="fgrid">
        <label class="f">Cliente<input id="cli" list="cli-list" autocomplete="off" placeholder="Escribí el club o el nombre" value="${esc(co.labelOf(d.clienteId))}"></label>
        <label class="f">Fecha<input id="fecha" type="date" value="${esc(d.fecha)}"></label>
      </div>
      <datalist id="cli-list">${co.labels.map(l => `<option value="${esc(l)}">`).join("")}</datalist>
      <div><div class="hint" style="margin-bottom:.35rem">Estado</div>
        <div class="seg" id="estado"><button data-e="presupuesto">Presupuesto</button><button data-e="vendido">Vendido</button></div></div>
      ${d.historico ? `<div class="note">Venta importada del Excel. En la libreta original solo estaban los totales, por eso no hay precio por unidad.</div>` : ""}
      <div>
        <h3 style="margin-bottom:.5rem">Productos</h3>
        ${d.historico ? "" : '<div class="ihead"><span>Modelo</span><span>Cant.</span><span>Precio c/u</span><span style="text-align:right">Subtotal</span><span></span></div>'}
        <div class="items" id="items"></div>
        ${d.historico ? "" : `<button class="btn sm" id="additem" style="margin-top:.5rem">${IC.plus}Agregar producto</button>`}
      </div>
      <div class="board" id="board"></div>
      <div class="fgrid">
        ${d.historico ? `<label class="f">Costo total<input class="num-in" data-k="tot.costo" inputmode="numeric" value="${d.tot.costo}"></label>
          <label class="f">Venta total<input class="num-in" data-k="tot.venta" inputmode="numeric" value="${d.tot.venta}"></label>` : ""}
        <label class="f">Flete (se suma al total)<input class="num-in" data-k="flete" inputmode="numeric" value="${d.flete||""}" placeholder="0"></label>
        <label class="f">Comisión<input class="num-in" data-k="comision" inputmode="numeric" value="${d.comision||""}" placeholder="0"></label>
        <label class="f">Comisión para<input id="comA" value="${esc(d.comisionA)}" placeholder="Quién la cobra"></label>
        <label class="f">Cobrado<input class="num-in" data-k="cobrado" inputmode="numeric" value="${d.cobrado||""}" placeholder="0"></label>
      </div>
      <button class="btn sm ghost" id="cobrartodo" style="justify-self:start">Marcar como cobrado completo</button>
      <label class="f">Notas (salen en el presupuesto)<textarea id="notas">${esc(d.notas)}</textarea></label>
    </div>
    <div class="sheet-f">
      ${orig ? `<button class="btn danger ghost" id="borrar">Eliminar</button>` : ""}
      <span class="sp"></span>
      <button class="btn" id="wa">${IC.wa}WhatsApp</button>
      <button class="btn" id="pdf">${IC.pdf}PDF</button>
      <button class="btn primary" id="guardar">Guardar</button>
    </div>`);

  function newItem(){ const p = S.productos[0]; return p ? {prodId:p.id, nombre:p.nombre, cant:1, precio:p.precio, costo:p.costo} : {prodId:"", nombre:"", cant:1, precio:0, costo:0}; }
  function drawItems(){
    const box = $("#items", sheet);
    if (d.historico) { box.innerHTML = d.items.map(i => `<div class="kv"><span>${esc(i.nombre)}</span><span>${i.cant} u.</span></div>`).join("") || '<div class="hint">Sin detalle</div>'; return; }
    box.innerHTML = d.items.map((it, n) => `<div class="item" data-n="${n}">
      <select class="inp c-p" aria-label="Modelo">${S.productos.map(p => `<option value="${p.id}" ${p.id===it.prodId?"selected":""}>${esc(p.nombre)}</option>`).join("")}
        ${it.prodId && !prod(it.prodId) ? `<option selected>${esc(it.nombre)}</option>` : ""}</select>
      <input class="inp c-q" aria-label="Cantidad" inputmode="numeric" value="${it.cant}">
      <input class="inp c-pr" aria-label="Precio por unidad" inputmode="numeric" value="${it.precio}">
      <span class="sub">${money(num(it.cant)*num(it.precio))}</span>
      <button class="icon-btn c-x" aria-label="Quitar producto">${IC.x}</button></div>`).join("") || '<div class="hint">Todavía no agregaste productos.</div>';
    box.querySelectorAll(".item").forEach(row => {
      const it = d.items[+row.dataset.n];
      row.querySelector(".c-p").onchange = e => { const p = prod(e.target.value); if (p) { it.prodId = p.id; it.nombre = p.nombre; it.precio = p.precio; it.costo = p.costo; } drawItems(); drawBoard(); };
      row.querySelector(".c-q").oninput = e => { it.cant = num(e.target.value); row.querySelector(".sub").textContent = money(num(it.cant)*num(it.precio)); drawBoard(); };
      row.querySelector(".c-pr").oninput = e => { it.precio = num(e.target.value); row.querySelector(".sub").textContent = money(num(it.cant)*num(it.precio)); drawBoard(); };
      row.querySelector(".c-x").onclick = () => { d.items.splice(+row.dataset.n, 1); drawItems(); drawBoard(); };
    });
  }
  function drawBoard(){
    const k = calc(d);
    $("#board", sheet).innerHTML = `<div><div class="k">Total cliente</div><div class="v">${money(k.total)}</div></div>
      <div><div class="k">Costo CH1</div><div class="v">${money(k.costo)}</div></div>
      <div><div class="k">Tu ganancia</div><div class="v gold">${money(k.gan)}</div></div>
      ${d.estado === "vendido" ? `<div><div class="k">Falta cobrar</div><div class="v ${k.saldo>0?"warn":""}">${money(k.saldo)}</div></div>` : ""}`;
  }
  function drawEstado(){ sheet.querySelectorAll("#estado button").forEach(b => b.setAttribute("aria-pressed", b.dataset.e === d.estado)); }
  function readClient(){
    const v = $("#cli", sheet).value.trim();
    if (!v) { d.clienteId = ""; return true; }
    if (co.map[v]) { d.clienteId = co.map[v]; return true; }
    const c = {id:"c"+uid(), tipo:"persona", nombre:"", club:v, tel:"", ref:"", notas:"", loc:""};
    S.contactos.push(c); d.clienteId = c.id; toast("Se agregó " + v + " a tus contactos"); return true;
  }
  function collect(){ readClient(); d.fecha = $("#fecha", sheet).value; d.notas = $("#notas", sheet).value; d.comisionA = $("#comA", sheet).value; }

  drawItems(); drawBoard(); drawEstado();
  $("#cerrar", sheet).onclick = closeModal;
  sheet.querySelectorAll("#estado button").forEach(b => b.onclick = () => { d.estado = b.dataset.e; drawEstado(); drawBoard(); });
  $("#additem", sheet) && ($("#additem", sheet).onclick = () => { d.items.push(newItem()); drawItems(); drawBoard(); });
  sheet.querySelectorAll(".num-in").forEach(inp => inp.oninput = () => {
    const [a,b] = inp.dataset.k.split("."); if (b) d[a][b] = num(inp.value); else d[a] = num(inp.value); drawBoard();
  });
  $("#cobrartodo", sheet).onclick = () => { d.estado = "vendido"; d.cobrado = calc(d).total; sheet.querySelector('[data-k="cobrado"]').value = d.cobrado; drawEstado(); drawBoard(); };
  function persist(){
    collect();
    if (!d.historico && d.num == null) d.num = S.nextNum++;
    const i = S.pedidos.findIndex(p => p.id === d.id);
    if (i >= 0) S.pedidos[i] = d; else S.pedidos.push(d);
    save();
  }
  $("#guardar", sheet).onclick = () => { persist(); closeModal(); toast("Pedido guardado"); render(); };
  $("#pdf", sheet).onclick = () => { persist(); pdfPedido(d); render(); };
  $("#wa", sheet).onclick = () => {
    persist(); render(); const c = contact(d.clienteId);
    if (!c || !telOk(c.tel)) { toast("El cliente no tiene un teléfono válido. Cargalo en Contactos."); return; }
    window.open(waLink(c.tel, textoPedido(d)), "_blank");
  };
  $("#borrar", sheet) && ($("#borrar", sheet).onclick = () => {
    if (!confirm("¿Eliminar este pedido? No se puede deshacer.")) return;
    S.pedidos = S.pedidos.filter(p => p.id !== d.id); save(); closeModal(); render(); toast("Pedido eliminado");
  });
}

function textoPedido(p){
  const c = contact(p.clienteId), k = calc(p);
  const saludo = c && c.nombre ? "Hola " + c.nombre.split(/[ /]/)[0] + "!" : "Hola!";
  const lines = p.tot ? p.items.map(i => "• " + i.cant + " " + i.nombre) : p.items.map(i => "• " + i.cant + " " + i.nombre + " x " + money(i.precio) + " = " + money(num(i.cant)*num(i.precio)));
  let t = saludo + " Te paso el presupuesto:\n\n" + lines.join("\n");
  if (k.flete) t += "\n• Flete: " + money(k.flete);
  t += "\n\n*Total: " + money(k.total) + "*";
  if (num(p.cobrado) > 0 && k.total - num(p.cobrado) > 0) t += "\nEntregado: " + money(p.cobrado) + "\nSaldo: " + money(k.total - num(p.cobrado));
  if (p.notas) t += "\n\n" + p.notas;
  if (S.config.nombre) t += "\n\n" + S.config.nombre;
  return t;
}

function pdfPedido(p){
  if (!window.jspdf) { toast("No se pudo cargar el generador de PDF. Revisá la conexión."); return; }
  const {jsPDF} = window.jspdf, doc = new jsPDF({unit:"mm", format:"a4"});
  const c = contact(p.clienteId), k = calc(p), cf = S.config, W = 210, M = 18;
  const green = [30,91,63], ink = [23,35,29], mut = [100,112,105];
  doc.setFillColor(...green); doc.rect(0, 0, W, 8, "F");
  let y = 24;
  doc.setTextColor(...ink); doc.setFont("helvetica","bold"); doc.setFontSize(18);
  doc.text(cf.nombre || "Presupuesto", M, y);
  doc.setFont("helvetica","normal"); doc.setFontSize(10); doc.setTextColor(...mut);
  const sub = [cf.tel && "Tel. " + cf.tel, cf.loc].filter(Boolean).join("  |  ");
  if (sub) doc.text(sub, M, y + 6);
  doc.setTextColor(...ink); doc.setFont("helvetica","bold"); doc.setFontSize(13);
  doc.text("Presupuesto " + (p.historico ? "" : "N° " + String(p.num).padStart(4,"0")), W - M, y, {align:"right"});
  doc.setFont("helvetica","normal"); doc.setFontSize(10); doc.setTextColor(...mut);
  const f = p.fecha || today();
  doc.text("Fecha: " + fdate(f), W - M, y + 6, {align:"right"});
  if (cf.validez) { const v = new Date(f + "T12:00:00"); v.setDate(v.getDate() + (+cf.validez)); doc.text("Válido hasta: " + fdate(v.toISOString().slice(0,10)), W - M, y + 11, {align:"right"}); }
  y += 22;
  doc.setDrawColor(210,220,214); doc.setFillColor(245,248,246); doc.roundedRect(M, y, W - 2*M, 20, 2, 2, "FD");
  doc.setFontSize(9); doc.setTextColor(...mut); doc.text("Cliente", M + 4, y + 6);
  doc.setFontSize(11); doc.setTextColor(...ink); doc.setFont("helvetica","bold");
  doc.text(c ? (c.club || c.nombre || "") : "", M + 4, y + 12);
  doc.setFont("helvetica","normal"); doc.setFontSize(10);
  doc.text([c && c.club && c.nombre ? "Contacto: " + c.nombre : "", c && c.tel ? "Tel. " + c.tel : "", c && c.loc ? c.loc : ""].filter(Boolean).join("   "), M + 4, y + 17);
  y += 30;
  const cols = [M, M + 22, W - M - 62, W - M];
  doc.setFillColor(...green); doc.rect(M, y, W - 2*M, 8, "F");
  doc.setTextColor(255,255,255); doc.setFont("helvetica","bold"); doc.setFontSize(10);
  doc.text("Cant.", cols[0] + 3, y + 5.5); doc.text("Producto", cols[1], y + 5.5);
  if (!p.tot) doc.text("Precio unit.", cols[2] + 28, y + 5.5, {align:"right"});
  doc.text("Subtotal", cols[3] - 3, y + 5.5, {align:"right"});
  y += 8; doc.setFont("helvetica","normal"); doc.setTextColor(...ink);
  const rowH = 8;
  const rows = p.tot ? [[p.items.reduce((s,i) => s + num(i.cant), 0), p.items.map(i => i.cant + " " + i.nombre).join(", "), null, k.venta]]
                     : p.items.map(i => [i.cant, i.nombre, i.precio, num(i.cant)*num(i.precio)]);
  rows.forEach((r, n) => {
    if (y > 260) { doc.addPage(); y = 20; }
    if (n % 2) { doc.setFillColor(246,248,247); doc.rect(M, y, W - 2*M, rowH, "F"); }
    doc.text(String(r[0]), cols[0] + 3, y + 5.5);
    doc.text(doc.splitTextToSize(String(r[1]), cols[2] - cols[1] + (p.tot ? 30 : 0))[0], cols[1], y + 5.5);
    if (r[2] != null) doc.text(money(r[2]), cols[2] + 28, y + 5.5, {align:"right"});
    doc.text(money(r[3]), cols[3] - 3, y + 5.5, {align:"right"});
    y += rowH;
  });
  doc.setDrawColor(210,220,214); doc.line(M, y, W - M, y); y += 7;
  const tline = (label, val, bold) => { doc.setFont("helvetica", bold ? "bold" : "normal"); doc.setFontSize(bold ? 13 : 10);
    doc.text(label, W - M - 55, y); doc.text(money(val), W - M - 3, y, {align:"right"}); y += bold ? 8 : 6; };
  if (k.flete) { tline("Subtotal", k.venta); tline("Flete", k.flete); }
  tline("Total", k.total, true);
  if (num(p.cobrado) > 0 && num(p.cobrado) < k.total) { tline("Entregado", p.cobrado); tline("Saldo", k.total - num(p.cobrado), true); }
  if (p.notas) { y += 4; doc.setFont("helvetica","normal"); doc.setFontSize(10); doc.setTextColor(...mut); doc.text("Notas", M, y); y += 5; doc.setTextColor(...ink); doc.text(doc.splitTextToSize(p.notas, W - 2*M), M, y); }
  doc.setFontSize(8.5); doc.setTextColor(...mut);
  doc.text(doc.splitTextToSize((cf.pie ? cf.pie + "  " : "") + "Documento no válido como factura.", W - 2*M), M, 285);
  const slug = (c ? (c.club || c.nombre) : "cliente").toLowerCase().normalize("NFD").replace(/[^\w]+/g, "-").replace(/^-|-$/g, "").slice(0, 30);
  saveFile("presupuesto-" + (p.num ? String(p.num).padStart(4,"0") : "historico") + "-" + slug + ".pdf", doc.output("blob"), "application/pdf");
}

/* ---------- Contactos ---------- */
let conFiltro = "todos", conQ = "";
function ventasDe(id){ return S.pedidos.filter(p => p.clienteId === id && p.estado === "vendido"); }
function viewContactos(){
  const pc = phoneCounts(), q = conQ.toLowerCase();
  const compro = new Set(S.pedidos.filter(p => p.estado === "vendido").map(p => p.clienteId));
  const revisar = c => !c.tel || !telOk(c.tel) || pc[digits(c.tel)] > 1;
  const f = {todos:() => true, club:c => c.tipo === "club", persona:c => c.tipo !== "club", compro:c => compro.has(c.id), nunca:c => !compro.has(c.id), revisar};
  const cnt = k => S.contactos.filter(f[k]).length;
  const list = S.contactos.filter(f[conFiltro]).filter(c => !q || [c.nombre,c.club,c.tel,c.ref,c.loc,c.notas].join(" ").toLowerCase().includes(q))
    .sort((a,b) => cname(a).localeCompare(cname(b), "es"));
  $("#main").innerHTML = `
    <div class="bar"><h2>Contactos</h2>
      <input class="search" id="cq" type="search" placeholder="Buscar por nombre, club, teléfono o referido" value="${esc(conQ)}">
      <button class="btn primary" id="nuevo">${IC.plus}Contacto</button></div>
    <div class="chips">${[["todos","Todos"],["club","Clubes y ligas"],["persona","Personas"],["compro","Compraron"],["nunca","Nunca compraron"],["revisar","Revisar teléfono"]]
      .map(([k,l]) => `<button class="chip" data-f="${k}" aria-pressed="${conFiltro===k}">${l}<b>${cnt(k)}</b></button>`).join("")}</div>
    <div class="list">${list.length ? list.map(c => {
      const bad = !c.tel ? "Sin teléfono" : !telOk(c.tel) ? "Teléfono incompleto" : pc[digits(c.tel)] > 1 ? "Teléfono repetido" : "";
      const sub = [c.club && c.nombre ? c.nombre : "", c.tel, c.ref ? "Ref. " + c.ref : ""].filter(Boolean).join(" · ");
      return `<div class="row" data-id="${c.id}" tabindex="0" role="button"><div class="grow">
        <div class="t">${esc(c.club || c.nombre)}</div><div class="s">${esc(sub)}${bad ? ' <span class="flag">' + bad + "</span>" : ""}</div></div>
        <div class="actions">${telOk(c.tel) ? `<a class="icon-btn" href="tel:${digits(c.tel)}" aria-label="Llamar">${IC.tel}</a><a class="icon-btn wa" href="${waLink(c.tel)}" target="_blank" rel="noopener" aria-label="WhatsApp">${IC.wa}</a>` : ""}</div></div>`;
    }).join("") : '<div class="empty">No hay contactos con ese filtro.</div>'}</div>`;
  $("#cq").oninput = e => { conQ = e.target.value; const pos = e.target.selectionStart; viewContactos(); const i = $("#cq"); i.focus(); i.setSelectionRange(pos,pos); };
  $("#nuevo").onclick = () => editContacto(null);
  document.querySelectorAll("[data-f]").forEach(b => b.onclick = () => { conFiltro = b.dataset.f; viewContactos(); });
  document.querySelectorAll(".row[data-id]").forEach(r => {
    r.querySelectorAll("a").forEach(a => a.onclick = e => e.stopPropagation());
    r.onclick = () => editContacto(r.dataset.id);
    r.onkeydown = e => { if (e.key === "Enter") editContacto(r.dataset.id); };
  });
}
function editContacto(id){
  const o = id ? contact(id) : null;
  const d = o ? {...o} : {id:"c"+uid(), tipo:"club", nombre:"", club:"", tel:"", ref:"", notas:"", loc:""};
  const peds = id ? S.pedidos.filter(p => p.clienteId === id) : [];
  const tot = peds.filter(p => p.estado === "vendido").reduce((a,p) => { const k = calc(p); a.v += k.total; a.g += k.gan; a.s += k.saldo; return a; }, {v:0,g:0,s:0});
  const sheet = openModal(`
    <div class="sheet-h"><h2>${o ? esc(o.club || o.nombre) : "Nuevo contacto"}</h2><button class="icon-btn" id="cerrar" aria-label="Cerrar">${IC.x}</button></div>
    <div class="sheet-b">
      ${o && peds.length ? `<div class="board"><div><div class="k">Le vendiste</div><div class="v">${money(tot.v)}</div></div>
        <div><div class="k">Ganaste</div><div class="v gold">${money(tot.g)}</div></div>
        <div><div class="k">Te debe</div><div class="v ${tot.s>0?"warn":""}">${money(tot.s)}</div></div></div>` : ""}
      <div class="seg" id="tipo"><button data-t="club">Club o liga</button><button data-t="persona">Persona</button></div>
      <div class="fgrid">
        <label class="f">Club o liga<input data-k="club" value="${esc(d.club)}" autofocus></label>
        <label class="f">Nombre del contacto<input data-k="nombre" value="${esc(d.nombre)}"></label>
        <label class="f">Teléfono (10 números, sin 0 ni 15)<input data-k="tel" type="tel" inputmode="tel" value="${esc(d.tel)}" placeholder="2494123456"></label>
        <label class="f">Localidad<input data-k="loc" value="${esc(d.loc)}"></label>
        <label class="f">Referido por<input data-k="ref" value="${esc(d.ref)}"></label>
      </div>
      <label class="f">Notas<textarea data-k="notas">${esc(d.notas)}</textarea></label>
      ${peds.length ? `<div><h3 style="margin-bottom:.5rem">Pedidos</h3><div class="list">${peds.map(p => { const k = calc(p);
        return `<button class="row" data-p="${p.id}"><div class="grow"><div class="t">${esc(pedidoLabel(p))}${p.estado==="vendido"?'':' <span class="tag pres">Presupuesto</span>'}</div>
        <div class="s">${esc(p.items.map(i => i.cant + " " + i.nombre).join(", "))}</div></div><div class="amt">${money(k.total)}${k.saldo>0?'<small>debe '+money(k.saldo)+"</small>":""}</div></button>`; }).join("")}</div></div>` : ""}
    </div>
    <div class="sheet-f">
      ${o ? `<button class="btn danger ghost" id="borrar">Eliminar</button>` : ""}<span class="sp"></span>
      ${o ? `<button class="btn" id="pedido">${IC.plus}Pedido</button>` : ""}
      <button class="btn primary" id="guardar">Guardar</button></div>`);
  const drawTipo = () => sheet.querySelectorAll("#tipo button").forEach(b => b.setAttribute("aria-pressed", b.dataset.t === d.tipo));
  drawTipo();
  sheet.querySelectorAll("#tipo button").forEach(b => b.onclick = () => { d.tipo = b.dataset.t; drawTipo(); });
  const collect = () => sheet.querySelectorAll("[data-k]").forEach(i => d[i.dataset.k] = i.value.trim());
  const persist = () => { collect(); const i = S.contactos.findIndex(c => c.id === d.id); if (i >= 0) S.contactos[i] = d; else S.contactos.push(d); save(); };
  $("#cerrar", sheet).onclick = closeModal;
  $("#guardar", sheet).onclick = () => { collect(); if (!d.club && !d.nombre) { toast("Poné al menos el club o el nombre."); return; } persist(); closeModal(); render(); toast("Contacto guardado"); };
  $("#pedido", sheet) && ($("#pedido", sheet).onclick = () => { persist(); closeModal(); tab = "pedidos"; render(); editPedido(null, d.id); });
  sheet.querySelectorAll("[data-p]").forEach(b => b.onclick = () => { closeModal(); editPedido(b.dataset.p); });
  $("#borrar", sheet) && ($("#borrar", sheet).onclick = () => {
    const n = peds.length;
    if (!confirm(n ? "Este contacto tiene " + n + " pedido(s). Si lo eliminás, los pedidos quedan sin cliente. ¿Seguir?" : "¿Eliminar este contacto?")) return;
    S.contactos = S.contactos.filter(c => c.id !== d.id); save(); closeModal(); render(); toast("Contacto eliminado");
  });
}

/* ---------- Productos ---------- */
function viewProductos(){
  $("#main").innerHTML = `
    <div class="bar"><h2>Productos</h2>
      <button class="btn" id="aumento">Actualizar precios</button>
      <button class="btn primary" id="nuevo">${IC.plus}Producto</button></div>
    <p class="hint" style="margin-top:-.4rem">El costo es lo que te cobra CH1. El precio de venta es el sugerido: al armar un pedido lo podés cambiar para ese cliente.</p>
    <div class="tablewrap"><table class="ptable">
      <thead><tr><th>Foto</th><th>Modelo</th><th class="num">Costo</th><th class="num">Precio de venta</th><th class="num">Ganás por unidad</th><th class="num">Margen</th><th class="num">Vendidas</th><th></th></tr></thead>
      <tbody id="tb"></tbody></table></div>`;
  const vend = {};
  S.pedidos.filter(p => p.estado === "vendido").forEach(p => p.items.forEach(i => vend[i.nombre] = (vend[i.nombre]||0) + num(i.cant)));
  const tb = $("#tb");
  const rowCalc = p => { const g = num(p.precio) - num(p.costo); return {g, m: num(p.costo) ? Math.round(g / num(p.costo) * 100) + "%" : "–"}; };
  tb.innerHTML = S.productos.map(p => { const r = rowCalc(p); return `<tr data-id="${p.id}">
    <td class="c-f"><label class="thumb" title="Cargar foto">${p.foto ? `<img src="${p.foto}" alt="">` : IC.productos}<input type="file" accept="image/*" class="foto" hidden aria-label="Foto de ${esc(p.nombre)}"></label></td>
    <td class="c-n"><input data-k="nombre" value="${esc(p.nombre)}" aria-label="Modelo"></td>
    <td class="c-c" data-label="Costo"><input class="num" data-k="costo" inputmode="numeric" value="${p.costo||""}" placeholder="Cargar" aria-label="Costo"></td>
    <td class="c-p" data-label="Precio de venta"><input class="num" data-k="precio" inputmode="numeric" value="${p.precio||""}" placeholder="Cargar" aria-label="Precio de venta"></td>
    <td class="num g" data-label="Ganás por unidad">${p.costo && p.precio ? money(r.g) : '<span class="nop">Falta precio</span>'}</td>
    <td class="num m" data-label="Margen">${p.costo && p.precio ? r.m : ""}</td>
    <td class="num c-v" data-label="Vendidas">${vend[p.nombre] || 0}</td>
    <td class="c-x"><button class="icon-btn del" aria-label="Eliminar ${esc(p.nombre)}">${IC.x}</button></td></tr>`; }).join("");
  tb.querySelectorAll("tr").forEach(tr => {
    const p = prod(tr.dataset.id);
    tr.querySelector(".foto").onchange = async e => {
      const f = e.target.files[0]; if (!f) return;
      try { p.foto = await shrinkImage(f); save(); viewProductos(); toast("Foto cargada"); } catch(err) { toast("No se pudo leer esa imagen."); }
    };
    tr.querySelectorAll("input[data-k]").forEach(inp => inp.onchange = inp.oninput = () => {
      const k = inp.dataset.k; p[k] = k === "nombre" ? inp.value : num(inp.value); save();
      const r = rowCalc(p);
      tr.querySelector(".g").innerHTML = p.costo && p.precio ? money(r.g) : '<span class="nop">Falta precio</span>';
      tr.querySelector(".m").textContent = p.costo && p.precio ? r.m : "";
    });
    tr.querySelector(".del").onclick = () => { if (confirm("¿Eliminar " + p.nombre + " del catálogo? Los pedidos ya cargados no cambian.")) { S.productos = S.productos.filter(x => x.id !== p.id); save(); viewProductos(); } };
  });
  $("#nuevo").onclick = () => { S.productos.push({id:uid(), nombre:"Nuevo modelo", costo:0, precio:0}); save(); viewProductos(); const ins = tb.querySelectorAll('input[data-k="nombre"]'); ins[ins.length-1].select(); };
  $("#aumento").onclick = () => {
    const sheet = openModal(`<div class="sheet-h"><h2>Actualizar precios</h2><button class="icon-btn" id="cerrar" aria-label="Cerrar">${IC.x}</button></div>
      <div class="sheet-b"><p class="hint" style="margin:0">Sube todos los productos del catálogo de una vez. Los pedidos ya guardados mantienen sus precios.</p>
      <div class="fgrid"><label class="f">Porcentaje de aumento<input id="pct" inputmode="decimal" placeholder="Ej: 8" autofocus></label>
      <label class="f">Aplicar a<select id="a"><option value="ambos">Costo y precio de venta</option><option value="costo">Solo costo</option><option value="precio">Solo precio de venta</option></select></label>
      <label class="f">Redondear a<select id="r"><option value="1">Sin redondeo</option><option value="100">$100</option><option value="500">$500</option><option value="1000">$1.000</option></select></label></div></div>
      <div class="sheet-f"><span class="sp"></span><button class="btn primary" id="ok">Aplicar aumento</button></div>`);
    $("#cerrar", sheet).onclick = closeModal;
    $("#ok", sheet).onclick = () => {
      const pct = num($("#pct", sheet).value), a = $("#a", sheet).value, r = +$("#r", sheet).value;
      if (!pct) { toast("Poné un porcentaje."); return; }
      const up = v => Math.round(v * (1 + pct/100) / r) * r;
      S.productos.forEach(p => { if (a !== "precio") p.costo = up(p.costo); if (a !== "costo") p.precio = up(p.precio); });
      save(); closeModal(); viewProductos(); toast("Precios actualizados " + pct + "%");
    };
  };
}

/* ---------- Catálogos y ofertas ---------- */
function shrinkImage(file){
  return new Promise((res, rej) => {
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => {
      const max = 520, k = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas"); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      const x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height); x.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url); res(c.toDataURL("image/jpeg", 0.8));
    };
    img.onerror = () => { URL.revokeObjectURL(url); rej(); };
    img.src = url;
  });
}
const canShareFiles = (() => { try { return !!(navigator.canShare && navigator.canShare({files:[new File(["x"], "x.pdf", {type:"application/pdf"})]})); } catch(e) { return false; } })();
async function sharePdf(blob, filename, title){
  try { await navigator.share({files:[new File([blob], filename, {type:"application/pdf"})], title}); }
  catch(e) { if (e && e.name !== "AbortError") saveFile(filename, blob, "application/pdf"); }
}
const addDays = (d, n) => { const x = new Date(d + "T12:00:00"); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10); };
const MESES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
const catItems = c => c.items.filter(i => prod(i.prodId));
const cantTxt = (c, i) => !num(i.cant) || c.cantModo === "none" ? "" : c.cantModo === "pack" ? "Pack x" + num(i.cant) : num(i.cant) + " disponibles";
const off = i => num(i.antes) > num(i.precio) && num(i.precio) > 0 ? Math.round((1 - num(i.precio) / num(i.antes)) * 100) : 0;

const FOTO = {};
async function ensureFotos(prods){
  await Promise.all(prods.filter(p => p && p.foto && !p.foto.startsWith("data:") && !FOTO[p.foto]).map(async p => {
    try { const b = await (await fetch(p.foto)).blob();
      FOTO[p.foto] = await new Promise((ok, ko) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = ko; r.readAsDataURL(b); });
    } catch(e) {}
  }));
}
const fotoSrc = p => !p.foto ? null : p.foto.startsWith("data:") ? p.foto : FOTO[p.foto] || null;
function viewCatalogos(){
  const list = [...S.catalogos].sort((a,b) => (b.fecha||"").localeCompare(a.fecha||""));
  $("#main").innerHTML = `
    <div class="bar"><h2>Catálogos y ofertas</h2>
      <button class="btn" id="nof">${IC.plus}Oferta</button>
      <button class="btn primary" id="ncat">${IC.plus}Catálogo</button></div>
    <p class="hint" style="margin-top:-.4rem">Elegís los productos, ponés precio y cantidad, y lo mandás como PDF o por WhatsApp. Las fotos se cargan en Productos.</p>
    <div class="list">${list.length ? list.map(c => `<button class="row" data-id="${c.id}"><div class="grow">
        <div class="t">${esc(c.titulo)}<span class="tag ${c.tipo==="ofertas"?"debe":"vend"}">${c.tipo==="ofertas"?"Ofertas":"Catálogo"}</span></div>
        <div class="s">${catItems(c).length} productos · ${fdate(c.fecha)}${c.hasta ? " · válido hasta " + fdate(c.hasta) : ""}</div></div></button>`).join("")
      : '<div class="empty">Todavía no armaste ningún catálogo. Empezá con "Catálogo" para la lista completa o con "Oferta" para promociones con precio anterior tachado.</div>'}</div>`;
  $("#ncat").onclick = () => editCatalogo(null, "catalogo");
  $("#nof").onclick = () => editCatalogo(null, "ofertas");
  document.querySelectorAll(".row[data-id]").forEach(b => b.onclick = () => editCatalogo(b.dataset.id));
}

function editCatalogo(id, tipo){
  const orig = id ? S.catalogos.find(c => c.id === id) : null;
  const now = new Date();
  const d = orig ? JSON.parse(JSON.stringify(orig)) : {id:uid(), tipo, fecha:today(), hasta:addDays(today(), tipo === "ofertas" ? 7 : 15),
    titulo: tipo === "ofertas" ? "Ofertas de la semana" : "Catálogo " + MESES[now.getMonth()] + " " + now.getFullYear(),
    cantModo:"none", nota:"", items:[]};
  // Una fila por producto del catálogo general; las marcadas son las que salen
  const rows = S.productos.map(p => { const it = d.items.find(i => i.prodId === p.id);
    return it ? {...it, on:true} : {prodId:p.id, precio:p.precio, antes:p.precio, cant:"", on: !orig && d.tipo === "catalogo" && p.precio > 0}; });
  const sheet = openModal(`
    <div class="sheet-h"><h2>${orig ? "Editar" : d.tipo === "ofertas" ? "Nueva oferta" : "Nuevo catálogo"}</h2><button class="icon-btn" id="cerrar" aria-label="Cerrar">${IC.x}</button></div>
    <div class="sheet-b">
      <div class="seg" id="tipo"><button data-t="catalogo">Catálogo</button><button data-t="ofertas">Ofertas</button></div>
      <div class="fgrid">
        <label class="f">Título<input id="titulo" value="${esc(d.titulo)}"></label>
        <label class="f">Válido hasta<input id="hasta" type="date" value="${esc(d.hasta)}"></label>
        <label class="f">Cantidad<select id="modo">
          <option value="none">No mostrar</option><option value="stock">Unidades disponibles</option><option value="pack">Precio por pack de</option></select></label>
      </div>
      <div>
        <div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.5rem"><h3 style="flex:1">Productos</h3>
          <button class="btn sm ghost" id="todos">Todos</button><button class="btn sm ghost" id="ninguno">Ninguno</button></div>
        <div class="list" id="crows"></div>
      </div>
      <label class="f">Nota al pie (formas de pago, envíos, etc.)<textarea id="nota" placeholder="Ej: Envíos a toda la provincia. Transferencia o efectivo.">${esc(d.nota)}</textarea></label>
    </div>
    <div class="sheet-f">
      ${orig ? `<button class="btn danger ghost" id="borrar">Eliminar</button><button class="btn ghost" id="dup">Duplicar</button>` : ""}
      <span class="sp"></span>
      <button class="btn" id="wa">${IC.wa}WhatsApp</button>
      ${canShareFiles ? `<button class="btn" id="share">${IC.share}Compartir</button>` : ""}
      <button class="btn" id="pdf">${IC.pdf}PDF</button>
      <button class="btn primary" id="guardar">Guardar</button>
    </div>`);
  $("#modo", sheet).value = d.cantModo;
  ensureFotos(S.productos);
  function drawRows(){
    const box = $("#crows", sheet), showAntes = d.tipo === "ofertas", showCant = d.cantModo !== "none";
    const ncols = 1 + (showAntes ? 1 : 0) + (showCant ? 1 : 0);
    box.innerHTML = rows.map((r, n) => { const p = prod(r.prodId), o = off(r);
      return `<div class="crow cols-${ncols} ${r.on ? "on" : ""}" data-n="${n}">
        <label class="cname"><input type="checkbox" ${r.on ? "checked" : ""}><span class="thumb sm">${p.foto ? `<img src="${p.foto}" alt="">` : IC.productos}</span>
          <span>${esc(p.nombre)}<span class="tag debe off"${o ? "" : " hidden"}>-${o}%</span></span></label>
        ${showAntes ? `<label class="f mini">Antes<input class="inp" data-k="antes" inputmode="numeric" value="${r.antes||""}"></label>` : ""}
        <label class="f mini">${showAntes ? "Oferta" : "Precio"}<input class="inp" data-k="precio" inputmode="numeric" value="${r.precio||""}"></label>
        ${showCant ? `<label class="f mini">${d.cantModo === "pack" ? "Pack de" : "Disponibles"}<input class="inp" data-k="cant" inputmode="numeric" value="${r.cant||""}"></label>` : ""}
      </div>`; }).join("") || '<div class="empty">No hay productos cargados. Agregalos en Productos.</div>';
    box.querySelectorAll(".crow").forEach(el => {
      const r = rows[+el.dataset.n];
      el.querySelector("input[type=checkbox]").onchange = e => { r.on = e.target.checked; el.classList.toggle("on", r.on); };
      el.querySelectorAll("input[data-k]").forEach(inp => inp.oninput = () => {
        r[inp.dataset.k] = num(inp.value); if (!r.on) { r.on = true; el.classList.add("on"); el.querySelector("input[type=checkbox]").checked = true; }
        const t = el.querySelector(".off"), o = off(r); t.hidden = !o; t.textContent = "-" + o + "%";
      });
    });
  }
  const drawTipo = () => sheet.querySelectorAll("#tipo button").forEach(b => b.setAttribute("aria-pressed", b.dataset.t === d.tipo));
  drawTipo(); drawRows();
  sheet.querySelectorAll("#tipo button").forEach(b => b.onclick = () => { d.tipo = b.dataset.t; drawTipo(); drawRows(); });
  $("#modo", sheet).onchange = e => { d.cantModo = e.target.value; drawRows(); };
  $("#todos", sheet).onclick = () => { rows.forEach(r => r.on = true); drawRows(); };
  $("#ninguno", sheet).onclick = () => { rows.forEach(r => r.on = false); drawRows(); };
  $("#cerrar", sheet).onclick = closeModal;
  function collect(){
    d.titulo = $("#titulo", sheet).value.trim() || "Catálogo"; d.hasta = $("#hasta", sheet).value; d.nota = $("#nota", sheet).value;
    d.items = rows.filter(r => r.on).map(({on, ...r}) => r);
  }
  function persist(){ collect(); const i = S.catalogos.findIndex(c => c.id === d.id); if (i >= 0) S.catalogos[i] = d; else S.catalogos.push(d); save(); }
  const ready = () => { if (!d.items.length) { toast("Marcá al menos un producto."); return false; }
    const sin = d.items.filter(i => !num(i.precio)).length; if (sin) toast(sin + " producto(s) sin precio van a salir como \"Consultar\"."); return true; };
  $("#guardar", sheet).onclick = () => { persist(); closeModal(); render(); toast("Catálogo guardado"); };
  const prods = () => d.items.map(i => prod(i.prodId));
  $("#pdf", sheet).onclick = async () => { persist(); render(); if (!ready()) return; await ensureFotos(prods()); const r = catPdf(d); if (r) saveFile(r.filename, r.blob, "application/pdf"); };
  $("#share", sheet) && ($("#share", sheet).onclick = async () => { persist(); render(); if (!ready()) return; await ensureFotos(prods()); const r = catPdf(d); if (r) sharePdf(r.blob, r.filename, d.titulo); });
  $("#wa", sheet).onclick = () => { persist(); render(); if (!ready()) return; window.open("https://wa.me/?text=" + encodeURIComponent(catTexto(d)), "_blank"); };
  $("#dup", sheet) && ($("#dup", sheet).onclick = () => { persist(); const c = JSON.parse(JSON.stringify(d)); c.id = uid(); c.fecha = today(); c.titulo += " (copia)";
    S.catalogos.push(c); save(); closeModal(); render(); editCatalogo(c.id); });
  $("#borrar", sheet) && ($("#borrar", sheet).onclick = () => { if (!confirm("¿Eliminar este catálogo?")) return;
    S.catalogos = S.catalogos.filter(c => c.id !== d.id); save(); closeModal(); render(); toast("Catálogo eliminado"); });
}

function catTexto(c){
  const lines = catItems(c).map(i => { const p = prod(i.prodId), o = off(i), ct = cantTxt(c, i);
    return "• *" + p.nombre + "*: " + (num(i.precio) ? money(i.precio) : "consultar") + (o ? " ~" + money(i.antes) + "~ (-" + o + "%)" : "") + (ct ? " · " + ct : ""); });
  let t = "*" + c.titulo + "*" + (c.hasta ? "\nVálido hasta el " + fdate(c.hasta) : "") + "\n\n" + lines.join("\n");
  if (c.nota) t += "\n\n" + c.nota;
  const firma = [S.config.nombre, S.config.tel].filter(Boolean).join(" · ");
  if (firma) t += "\n\n" + firma;
  return t;
}

function catPdf(c){
  if (!window.jspdf) { toast("No se pudo cargar el generador de PDF. Revisá la conexión."); return null; }
  const {jsPDF} = window.jspdf, doc = new jsPDF({unit:"mm", format:"a4"});
  const W = 210, H = 297, M = 14, G = 6, cw = (W - 2*M - G) / 2, ch = 70, top = 46;
  const green = [30,91,63], ink = [23,35,29], mut = [100,112,105], amber = [242,178,0], line = [214,222,217];
  const cf = S.config, items = catItems(c), ofertas = c.tipo === "ofertas";
  const header = first => {
    doc.setFillColor(...green); doc.rect(0, 0, W, first ? 36 : 14, "F");
    doc.setTextColor(255,255,255);
    if (first) {
      doc.setFont("helvetica","normal"); doc.setFontSize(10); doc.text(cf.nombre || "", M, 12);
      doc.setFont("helvetica","bold"); doc.setFontSize(22); doc.text(doc.splitTextToSize(c.titulo, 120)[0], M, 25);
      doc.setFont("helvetica","normal"); doc.setFontSize(10);
      if (c.hasta) doc.text("Válido hasta el " + fdate(c.hasta), W - M, 12, {align:"right"});
      if (cf.tel) doc.text("Pedidos: " + cf.tel, W - M, 25, {align:"right"});
    } else { doc.setFont("helvetica","bold"); doc.setFontSize(11); doc.text(c.titulo, M, 9); }
  };
  const ball = (cx, cy, r) => {
    doc.setDrawColor(...line); doc.setLineWidth(0.8); doc.setFillColor(255,255,255); doc.circle(cx, cy, r, "FD");
    const pts = [...Array(5)].map((_, k) => { const a = -Math.PI/2 + k * 2*Math.PI/5; return [cx + Math.cos(a)*r*0.38, cy + Math.sin(a)*r*0.38]; });
    doc.setFillColor(...line); doc.lines(pts.slice(1).map((p, k) => [p[0]-pts[k][0], p[1]-pts[k][1]]), pts[0][0], pts[0][1], [1,1], "F", true);
    pts.forEach(p => { const dx = p[0]-cx, dy = p[1]-cy; doc.line(p[0], p[1], cx + dx*2.6, cy + dy*2.6); });
    doc.setLineWidth(0.2);
  };
  header(true);
  let y = top, col = 0;
  items.forEach((i, n) => {
    if (n && col === 0 && y + ch > H - 18) { doc.addPage(); header(false); y = 22; }
    const x = M + col * (cw + G), p = prod(i.prodId), o = off(i), ct = cantTxt(c, i);
    doc.setDrawColor(...line); doc.setFillColor(255,255,255); doc.roundedRect(x, y, cw, ch, 3, 3, "FD");
    const ix = x + 4, iy = y + 4, iw = cw - 8, ih = 40;
    doc.setFillColor(246,248,247); doc.rect(ix, iy, iw, ih, "F");
    const src = fotoSrc(p);
    if (src) {
      try { const pr = doc.getImageProperties(src), k = Math.min(iw / pr.width, ih / pr.height), w = pr.width * k, h = pr.height * k;
        doc.addImage(src, "JPEG", ix + (iw - w)/2, iy + (ih - h)/2, w, h); } catch(e) { ball(ix + iw/2, iy + ih/2, 15); }
    } else ball(ix + iw/2, iy + ih/2, 15);
    if (o) { doc.setFillColor(...amber); doc.roundedRect(ix + 2, iy + 2, 17, 8, 2, 2, "F");
      doc.setTextColor(...ink); doc.setFont("helvetica","bold"); doc.setFontSize(10); doc.text("-" + o + "%", ix + 10.5, iy + 7.4, {align:"center"}); }
    doc.setTextColor(...ink); doc.setFont("helvetica","bold"); doc.setFontSize(13);
    doc.text(doc.splitTextToSize(p.nombre, iw - (ct ? 28 : 0))[0], ix, y + 52);
    if (ct) { doc.setFont("helvetica","normal"); doc.setFontSize(9); doc.setTextColor(...mut); doc.text(ct, x + cw - 4, y + 52, {align:"right"}); }
    doc.setFont("helvetica","bold"); doc.setFontSize(17); doc.setTextColor(...green);
    const ptxt = num(i.precio) ? money(i.precio) : "Consultar"; doc.text(ptxt, ix, y + 63);
    if (o) { doc.setFont("helvetica","normal"); doc.setFontSize(10); doc.setTextColor(...mut);
      const at = money(i.antes), tw = doc.getTextWidth(at), ax = x + cw - 4; doc.text(at, ax, y + 62.5, {align:"right"});
      doc.setDrawColor(...mut); doc.setLineWidth(0.3); doc.line(ax - tw, y + 61.2, ax, y + 61.2); doc.setLineWidth(0.2); }
    col = 1 - col; if (col === 0) y += ch + G;
  });
  if (col === 1) y += ch + G;
  if (c.nota) {
    const lines = doc.splitTextToSize(c.nota, W - 2*M - 8), h = 10 + lines.length * 5;
    if (y + h > H - 16) { doc.addPage(); header(false); y = 22; }
    doc.setFillColor(246,248,247); doc.setDrawColor(...amber); doc.setLineWidth(1.2); doc.rect(M, y, W - 2*M, h, "F"); doc.line(M, y, M, y + h); doc.setLineWidth(0.2);
    doc.setTextColor(...ink); doc.setFont("helvetica","normal"); doc.setFontSize(10); doc.text(lines, M + 5, y + 7);
  }
  const pages = doc.getNumberOfPages();
  for (let k = 1; k <= pages; k++) { doc.setPage(k); doc.setFontSize(8.5); doc.setTextColor(...mut); doc.setFont("helvetica","normal");
    doc.text([cf.nombre, cf.tel].filter(Boolean).join("  |  ") + (cf.nombre || cf.tel ? "  |  " : "") + "Precios sujetos a cambio sin previo aviso.", M, H - 8);
    if (pages > 1) doc.text(k + " / " + pages, W - M, H - 8, {align:"right"}); }
  const slug = c.titulo.toLowerCase().normalize("NFD").replace(/[^\w]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
  return {blob: doc.output("blob"), filename: slug + ".pdf"};
}

/* ---------- Resumen ---------- */
function viewResumen(){
  const vend = S.pedidos.filter(p => p.estado === "vendido");
  const T = vend.reduce((a,p) => { const k = calc(p); a.v += k.total; a.g += k.gan; a.s += k.saldo; return a; }, {v:0,g:0,s:0});
  const pres = S.pedidos.filter(p => p.estado === "presupuesto");
  const presT = pres.reduce((a,p) => a + calc(p).total, 0);
  const qty = {}; vend.forEach(p => p.items.forEach(i => qty[i.nombre] = (qty[i.nombre]||0) + num(i.cant)));
  const qs = Object.entries(qty).sort((a,b) => b[1]-a[1]); const qmax = qs[0] ? qs[0][1] : 1;
  const cli = {}; vend.forEach(p => { const k = calc(p); (cli[p.clienteId] ||= {v:0,g:0}); cli[p.clienteId].v += k.total; cli[p.clienteId].g += k.gan; });
  const top = Object.entries(cli).sort((a,b) => b[1].v - a[1].v).slice(0, 8);
  const refs = {}; S.contactos.forEach(c => { if (!c.ref) return; const r = (refs[c.ref] ||= {n:0,v:0}); r.n++; r.v += cli[c.id]?.v || 0; });
  const rs = Object.entries(refs).sort((a,b) => b[1].n - a[1].n || b[1].v - a[1].v).slice(0, 8);
  const deben = vend.filter(p => calc(p).saldo > 0).sort((a,b) => calc(b).saldo - calc(a).saldo);
  const meses = {}; vend.filter(p => p.fecha).forEach(p => { const m = p.fecha.slice(0,7); (meses[m] ||= {v:0,g:0}); const k = calc(p); meses[m].v += k.total; meses[m].g += k.gan; });
  const ms = Object.entries(meses).sort((a,b) => b[0].localeCompare(a[0])).slice(0, 6);
  const MES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
  const nunca = S.contactos.filter(c => !cli[c.id]).length;
  $("#main").innerHTML = `
    <div class="bar"><h2>Resumen</h2></div>
    <div class="board">
      <div><div class="k">Vendido</div><div class="v">${money(T.v)}</div></div>
      <div><div class="k">Ganancia</div><div class="v gold">${money(T.g)}</div></div>
      <div><div class="k">Por cobrar</div><div class="v ${T.s>0?"warn":""}">${money(T.s)}</div></div>
      <div><div class="k">Presupuestos</div><div class="v">${pres.length}</div><div class="k">${money(presT)}</div></div>
    </div>
    <div class="grid2">
      <div class="card"><h3>Modelos más vendidos</h3><div class="barchart">${qs.length ? qs.map(([n,q]) =>
        `<div class="bc"><span>${esc(n)}</span><div class="track"><div class="fill" style="width:${Math.max(3, q/qmax*100)}%"></div></div><span class="n">${q}</span></div>`).join("") : '<div class="hint">Todavía no hay ventas.</div>'}</div></div>
      <div class="card"><h3>Te deben</h3>${deben.length ? deben.slice(0, 10).map(p => { const c = contact(p.clienteId);
        return `<div class="kv"><span>${esc(cname(c))}</span><span>${money(calc(p).saldo)}</span></div>`; }).join("") : '<div class="hint">Nadie te debe nada. Bien ahí.</div>'}</div>
      <div class="card"><h3>Mejores clientes</h3>${top.map(([id,x]) => `<div class="kv"><span>${esc(cname(contact(id)))}</span><span>${money(x.v)}</span></div>`).join("") || '<div class="hint">Todavía no hay ventas.</div>'}</div>
      <div class="card"><h3>Quién te trae clientes</h3>${rs.map(([r,x]) => `<div class="kv"><span>${esc(r)} <span class="muted">(${x.n} contacto${x.n>1?"s":""})</span></span><span>${money(x.v)}</span></div>`).join("") || '<div class="hint">Sin referidos cargados.</div>'}</div>
      ${ms.length ? `<div class="card"><h3>Ganancia por mes</h3>${ms.map(([m,x]) => `<div class="kv"><span>${MES[+m.slice(5)-1]} ${m.slice(0,4)}</span><span>${money(x.g)}</span></div>`).join("")}</div>` : ""}
      <div class="card"><h3>Para salir a vender</h3><p style="margin:0">${nunca} contactos nunca te compraron. Están en Contactos, filtro "Nunca compraron", con el botón de WhatsApp a mano.</p></div>
    </div>`;
}

/* ---------- Ajustes ---------- */
function viewAjustes(){
  const cf = S.config;
  $("#main").innerHTML = `
    <div class="bar"><h2>Ajustes</h2></div>
    <div class="grid2" style="margin-top:0">
      <div class="card"><h3>Tus datos en el presupuesto</h3><div class="fgrid">
        <label class="f">Nombre o marca<input data-k="nombre" value="${esc(cf.nombre)}" placeholder="Ej: Juan Pérez Deportes"></label>
        <label class="f">Teléfono<input data-k="tel" type="tel" inputmode="tel" value="${esc(cf.tel)}"></label>
        <label class="f">Localidad<input data-k="loc" value="${esc(cf.loc)}"></label>
        <label class="f">Días de validez<input data-k="validez" inputmode="numeric" value="${esc(cf.validez)}"></label></div>
        <label class="f" style="margin-top:.8rem">Texto al pie<textarea data-k="pie">${esc(cf.pie)}</textarea></label>
        <p class="hint">Los presupuestos siempre aclaran "Documento no válido como factura". Si un cliente pide factura, la hace CH1.</p></div>
      <div class="card"><h3>Tus datos</h3>
        <p class="hint" style="margin-top:0">Todo se guarda en la nube y se ve igual en el celu y en la compu. Igual conviene bajar una copia de vez en cuando.</p>
        <div style="display:grid;gap:.5rem">
          <button class="btn" id="xls">Descargar Excel</button>
          <button class="btn" id="bk">Descargar copia de seguridad</button>
          <label class="btn" style="cursor:pointer">Cargar copia de seguridad<input type="file" id="imp" accept=".json,application/json" hidden></label>
        </div></div>
      <div class="card"><h3>Cuenta</h3><p class="hint" style="margin-top:0" id="cuenta">&nbsp;</p>
        <button class="btn" id="salir">Cerrar sesión</button></div>
      <div class="card install" id="instalar" hidden></div>
    </div>`;
  drawInstall();
  document.querySelectorAll("[data-k]").forEach(i => i.oninput = () => { cf[i.dataset.k] = i.dataset.k === "validez" ? num(i.value) : i.value; save(); });
  $("#xls").onclick = exportExcel;
  $("#bk").onclick = () => saveFile("libreta-ventas-" + today() + ".json", JSON.stringify(S, null, 1), "application/json");
  $("#imp").onchange = async e => {
    const file = e.target.files[0]; if (!file) return;
    try { const data = JSON.parse(await file.text()); if (!data.contactos || !data.pedidos || !data.productos) throw 0;
      if (!confirm("Esto reemplaza todos los datos actuales por los de la copia. ¿Seguir?")) return;
      S = data; migrate(); save(); toast("Copia cargada. Subiendo a la nube..."); render(); }
    catch(err) { toast("Ese archivo no es una copia de la libreta."); }
  };
  DB.email().then(m => { const el = $("#cuenta"); if (el) el.textContent = "Entraste como " + m; });
  $("#salir").onclick = async () => { await DB.flush(S); await DB.signOut(); location.reload(); };
}
function exportExcel(){
  if (!window.XLSX) { toast("No se pudo cargar el generador de Excel. Revisá la conexión."); return; }
  const wb = XLSX.utils.book_new();
  const add = (rows, name) => XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), name);
  add(S.contactos.map(c => ({Tipo:c.tipo === "club" ? "Club / Liga" : "Persona", "Club / Liga":c.club, Contacto:c.nombre, Teléfono:c.tel, Localidad:c.loc, Referido:c.ref, Notas:c.notas})), "Contactos");
  add(S.productos.map(p => ({Modelo:p.nombre, Costo:p.costo, "Precio de venta":p.precio, "Ganancia x unidad":p.precio - p.costo})), "Productos");
  add(S.pedidos.map(p => { const k = calc(p), c = contact(p.clienteId);
    return {Pedido:pedidoLabel(p), Fecha:fdate(p.fecha), Cliente:cname(c), Estado:p.estado === "vendido" ? "Vendido" : "Presupuesto",
      Productos:p.items.map(i => i.cant + " " + i.nombre).join(", "), Venta:k.venta, Flete:k.flete, Total:k.total, Costo:k.costo,
      Comisión:num(p.comision), "Comisión para":p.comisionA, Ganancia:k.gan, Cobrado:num(p.cobrado), Saldo:k.saldo, Notas:p.notas}; }), "Pedidos");
  const out = XLSX.write(wb, {bookType:"xlsx", type:"array"});
  saveFile("libreta-ventas-" + today() + ".xlsx", new Blob([out], {type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}));
}

/* ---------- Instalar como app (PWA) ---------- */
let installPrompt = null;
const standalone = () => matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
function drawInstall(){
  const el = $("#instalar"); if (!el) return;
  el.hidden = standalone() || (!installPrompt && !isIOS());
  if (el.hidden) return;
  el.innerHTML = `<h3>Instalar la app</h3>
    <p class="hint">Queda como una app más: se abre desde la pantalla de inicio, a pantalla completa y también sin conexión.</p>
    ${installPrompt ? `<button class="btn primary" id="instalar-btn">Instalar la app</button>` : `<p class="note">En iPhone: Compartir → Agregar a inicio.</p>`}`;
  $("#instalar-btn") && ($("#instalar-btn").onclick = async () => {
    const p = installPrompt; installPrompt = null;
    try { await p.prompt(); await p.userChoice; } catch(e) {}
    drawInstall();
  });
}
window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); installPrompt = e; drawInstall(); });
window.addEventListener("appinstalled", () => { installPrompt = null; drawInstall(); toast("Listo, la app quedó instalada."); });
// El service worker guarda la app para abrirla sin conexión. Los archivos propios se piden primero
// a la red, así que cada deploy se ve al abrir la app con internet: no hace falta recargar a la fuerza.
if ("serviceWorker" in navigator && window.isSecureContext) {
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(e => console.warn("Service worker:", e)));
}

/* ---------- Arranque, login y estado de guardado ---------- */
const STATUS = {saving:"Guardando…", saved:"Guardado", error:"No se pudo guardar. Se reintenta con el próximo cambio.", offline:"Sin conexión. Los cambios se suben al volver."};
DB.onStatus = st => { const el = $("#sync"); if (!el) return; el.textContent = STATUS[st] || ""; el.dataset.st = st; if (st === "saved") setTimeout(() => { if (el.dataset.st === "saved") el.textContent = ""; }, 2500); };
window.addEventListener("online", () => S && DB.flush(S));
window.addEventListener("beforeunload", e => { if ($("#sync")?.dataset.st === "saving") { e.preventDefault(); e.returnValue = ""; } });

function screen(html){ $("#tabs").innerHTML = ""; $("#main").innerHTML = '<div class="gate">' + html + "</div>"; }
function showLogin(msg){
  screen(`<h2>Entrar</h2><p class="hint">Usá el mail y la contraseña de tu cuenta.</p>
    <form id="login" class="fgrid" style="grid-template-columns:1fr">
      <label class="f">Mail<input id="em" type="email" autocomplete="username" required autofocus></label>
      <label class="f">Contraseña<input id="pw" type="password" autocomplete="current-password" required></label>
      <p class="flag" id="lerr" role="alert">${esc(msg || "")}</p>
      <button class="btn primary" id="entrar">Entrar</button></form>`);
  $("#em").focus();
  $("#login").onsubmit = async e => {
    e.preventDefault(); $("#entrar").disabled = true; $("#entrar").textContent = "Entrando…";
    try { await DB.signIn($("#em").value.trim(), $("#pw").value); await startApp(); }
    catch(err) { showLogin(/invalid/i.test(err.message || "") ? "Mail o contraseña incorrectos." : "No se pudo entrar. Revisá la conexión."); }
  };
}
function showOnboarding(){
  screen(`<h2>Tu cuenta está lista</h2>
    <p>Para arrancar con tus clientes y ventas, cargá el archivo de datos (<b>datos-iniciales.json</b> o cualquier copia de seguridad de la libreta).</p>
    <div style="display:grid;gap:.6rem;margin-top:1rem">
      <label class="btn primary" style="cursor:pointer">Cargar archivo de datos<input type="file" id="imp0" accept=".json,application/json" hidden></label>
      <button class="btn" id="vacio">Empezar sin datos</button></div>`);
  $("#imp0").onchange = async e => {
    const f = e.target.files[0]; if (!f) return;
    try { const data = JSON.parse(await f.text()); if (!data.contactos || !data.pedidos || !data.productos) throw 0;
      S = data; migrate(); render(); toast("Subiendo tus datos a la nube…"); await DB.flush(S); }
    catch(err) { toast("Ese archivo no es una copia de la libreta."); }
  };
  $("#vacio").onclick = () => { S = emptyState(); render(); save(); };
}
async function startApp(){
  screen('<p class="hint">Cargando tus datos…</p>');
  const cache = DB.readCache();
  if (cache) { S = DB.useCache(cache); migrate(); render(); await DB.flush(S); if ($("#sync")?.dataset.st !== "saved") return; }
  try {
    const r = await DB.loadAll();
    if (r.empty) return showOnboarding();
    const open = $("#modal").innerHTML;
    S = r.S; migrate(); if (!open) render();
  } catch(e) {
    console.error(e);
    if (!cache) screen(`<h2>No se pudieron cargar los datos</h2><p class="hint">Revisá la conexión a internet.</p><button class="btn primary" onclick="startApp()">Reintentar</button>`);
  }
}
(async () => {
  if (!window.LIBRETA_CONFIG?.supabaseUrl || window.LIBRETA_CONFIG.supabaseUrl.includes("TU-PROYECTO")) {
    screen("<h2>Falta configurar Supabase</h2><p>Completá la URL y la anon key en <b>config.js</b>.</p>"); return; }
  try { if (await DB.session()) await startApp(); else showLogin(); }
  catch(e) { showLogin("No se pudo conectar. Revisá la conexión."); }
})();
