"use strict";
/* Capa de datos: la app trabaja sobre el objeto S en memoria y llama a save().
   save() compara contra la última versión confirmada por Supabase y sube solo lo que cambió.
   Si no hay conexión, los cambios quedan pendientes (también en caché local) y se reintentan. */
const DB = (() => {
  const cfg = window.LIBRETA_CONFIG || {};
  const sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
  const TABLES = ["productos", "contactos", "pedidos", "catalogos"]; // orden de subida (FK: contactos antes que pedidos)
  let uid = null, snap = null, timer = null, running = false, again = false, onStatus = () => {};
  const n = v => { const x = Number(v); return isFinite(x) ? x : 0; };
  const dateOrNull = v => v ? v : null;

  const map = {
    productos: {
      toRow: (p, i) => ({id:p.id, user_id:uid, orden:i, nombre:p.nombre || "", costo:n(p.costo), precio:n(p.precio), foto:p.foto || null}),
      fromRow: r => ({id:r.id, nombre:r.nombre, costo:n(r.costo), precio:n(r.precio), foto:r.foto || "", _o:r.orden})
    },
    contactos: {
      toRow: c => ({id:c.id, user_id:uid, tipo:c.tipo === "club" ? "club" : "persona", club:c.club || "", nombre:c.nombre || "", tel:c.tel || "", loc:c.loc || "", ref:c.ref || "", notas:c.notas || ""}),
      fromRow: r => ({id:r.id, tipo:r.tipo, club:r.club || "", nombre:r.nombre || "", tel:r.tel || "", loc:r.loc || "", ref:r.ref || "", notas:r.notas || ""})
    },
    pedidos: {
      toRow: p => ({id:p.id, user_id:uid, num:p.num ?? null, fecha:dateOrNull(p.fecha), cliente_id:p.clienteId || null, estado:p.estado, historico:!!p.historico,
        items:p.items || [], tot_costo:p.tot ? n(p.tot.costo) : null, tot_venta:p.tot ? n(p.tot.venta) : null,
        flete:n(p.flete), comision:n(p.comision), comision_a:p.comisionA || "", cobrado:n(p.cobrado), notas:p.notas || ""}),
      fromRow: r => { const p = {id:r.id, num:r.num, fecha:r.fecha || "", clienteId:r.cliente_id || "", estado:r.estado, historico:r.historico,
        items:r.items || [], flete:n(r.flete), comision:n(r.comision), comisionA:r.comision_a || "", cobrado:n(r.cobrado), notas:r.notas || ""};
        if (r.tot_venta != null) p.tot = {costo:n(r.tot_costo), venta:n(r.tot_venta)}; return p; }
    },
    catalogos: {
      toRow: c => ({id:c.id, user_id:uid, tipo:c.tipo, titulo:c.titulo || "Catálogo", fecha:dateOrNull(c.fecha), hasta:dateOrNull(c.hasta), cant_modo:c.cantModo || "none", nota:c.nota || "", items:c.items || []}),
      fromRow: r => ({id:r.id, tipo:r.tipo, titulo:r.titulo, fecha:r.fecha || "", hasta:r.hasta || "", cantModo:r.cant_modo, nota:r.nota || "", items:r.items || []})
    }
  };
  const cfgRow = S => ({user_id:uid, nombre:S.config.nombre || "", tel:S.config.tel || "", loc:S.config.loc || "", pie:S.config.pie || "", validez:n(S.config.validez), next_num:n(S.nextNum) || 1});
  const cacheKey = () => "libreta-cache-" + uid;

  function snapshotOf(S){
    const s = {config: JSON.stringify(cfgRow(S))};
    for (const t of TABLES) s[t] = Object.fromEntries(S[t].map((o, i) => [o.id, JSON.stringify(map[t].toRow(o, i))]));
    return s;
  }
  function writeCache(S){ try { localStorage.setItem(cacheKey(), JSON.stringify({S, snap})); } catch(e) {} }
  function readCache(){ try { return JSON.parse(localStorage.getItem(cacheKey()) || "null"); } catch(e) { return null; } }

  async function loadAll(){
    const [c, ...rest] = await Promise.all([
      sb.from("config").select("*").maybeSingle(),
      ...TABLES.map(t => sb.from(t).select("*"))
    ]);
    for (const r of [c, ...rest]) if (r.error) throw r.error;
    const S = {v:1, config:{nombre:"", tel:"", loc:"", pie:"Precios sujetos a cambio sin previo aviso.", validez:7}, nextNum:1};
    if (c.data) { S.config = {nombre:c.data.nombre, tel:c.data.tel, loc:c.data.loc, pie:c.data.pie, validez:c.data.validez}; S.nextNum = c.data.next_num; }
    TABLES.forEach((t, i) => S[t] = rest[i].data.map(map[t].fromRow));
    S.productos.sort((a, b) => a._o - b._o).forEach(p => delete p._o);
    S.contactos.sort((a, b) => a.id.localeCompare(b.id, "es", {numeric:true}));
    snap = c.data ? snapshotOf(S) : {config:"", productos:{}, contactos:{}, pedidos:{}, catalogos:{}};
    writeCache(S);
    return {S, empty: !c.data && !TABLES.some((t, i) => rest[i].data.length)};
  }

  async function uploadFotos(S){
    for (const p of S.productos) {
      if (!p.foto || !p.foto.startsWith("data:")) continue;
      const blob = await (await fetch(p.foto)).blob();
      const path = uid + "/" + p.id + "-" + Date.now() + ".jpg";
      const {error} = await sb.storage.from("fotos").upload(path, blob, {contentType:"image/jpeg"});
      if (error) throw error;
      const old = snap.productos[p.id] && JSON.parse(snap.productos[p.id]).foto;
      p.foto = sb.storage.from("fotos").getPublicUrl(path).data.publicUrl;
      if (old && old.includes("/fotos/" + uid + "/")) sb.storage.from("fotos").remove([old.split("/fotos/")[1]]).catch(() => {});
    }
  }

  async function push(S){
    if (!uid || !snap) return;
    if (running) { again = true; return; }
    running = true; onStatus("saving");
    try {
      await uploadFotos(S);
      const ids = new Set(S.contactos.map(c => c.id));
      S.pedidos.forEach(p => { if (p.clienteId && !ids.has(p.clienteId)) p.clienteId = ""; });
      const cur = snapshotOf(S);
      if (cur.config !== snap.config) {
        const {error} = await sb.from("config").upsert(JSON.parse(cur.config)); if (error) throw error;
        snap.config = cur.config;
      }
      for (const t of TABLES) {
        const changed = Object.keys(cur[t]).filter(id => cur[t][id] !== snap[t][id]);
        if (changed.length) {
          const {error} = await sb.from(t).upsert(changed.map(id => JSON.parse(cur[t][id]))); if (error) throw error;
          changed.forEach(id => snap[t][id] = cur[t][id]);
        }
      }
      for (const t of [...TABLES].reverse()) {
        const gone = Object.keys(snap[t]).filter(id => !(id in cur[t]));
        if (gone.length) {
          const {error} = await sb.from(t).delete().in("id", gone); if (error) throw error;
          gone.forEach(id => delete snap[t][id]);
        }
      }
      writeCache(S); onStatus("saved");
    } catch(e) {
      console.error(e); writeCache(S); onStatus(navigator.onLine ? "error" : "offline");
    } finally {
      running = false;
      if (again) { again = false; schedule(S); }
    }
  }
  function schedule(S){ if (!uid) return; writeCache(S); clearTimeout(timer); timer = setTimeout(() => push(S), 700); }

  // Último usuario que entró en este dispositivo: permite abrir la app sin conexión aunque
  // el token de Supabase haya vencido (no se puede renovar sin internet; se renueva solo al volver).
  const LAST = "libreta-last-user";
  const remember = u => { try { localStorage.setItem(LAST, JSON.stringify({id:u.id, email:u.email || ""})); } catch(e) {} };
  const lastUser = () => { try { return JSON.parse(localStorage.getItem(LAST) || "null"); } catch(e) { return null; } };

  return {
    sb,
    set onStatus(fn){ onStatus = fn; },
    async session(){
      const {data, error} = await sb.auth.getSession();
      let s = data.session;
      if (s) remember(s.user);
      else if (!navigator.onLine || error?.name === "AuthRetryableFetchError") {
        const u = lastUser();
        if (u && localStorage.getItem("libreta-cache-" + u.id)) s = {user:u, offline:true};
      }
      uid = s?.user?.id || null; return s;
    },
    async signIn(email, password){ const {data, error} = await sb.auth.signInWithPassword({email, password}); if (error) throw error; uid = data.user.id; remember(data.user); return data; },
    async signOut(){ await sb.auth.signOut(); uid = null; snap = null; try { localStorage.removeItem(LAST); } catch(e) {} },
    email: async () => (await sb.auth.getSession()).data.session?.user?.email || lastUser()?.email || "",
    loadAll, readCache,
    useCache(c){ snap = c.snap; return c.S; },
    save: schedule,
    flush: S => { clearTimeout(timer); return push(S); },
    pending: () => !!timer && running
  };
})();
