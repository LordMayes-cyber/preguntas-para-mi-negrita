"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowDown, ArrowRight, ArrowUp, Check, Copy, Eye, Heart, HelpCircle, Link2, LockKeyhole, Mail, MessageCircle, Plus, RefreshCw, Save, Sparkles, Trash2, X } from "lucide-react";
import { api, Brand, dateLabel, Envelope, initialDraft, type Draft, type History } from "./shared";
import { Journey } from "./Respondent";
type Owner = { id: string; token: string };
type Managed = Draft & { id: string; revision: string; history: History[] };
type Tab = "questions" | "letter" | "answers";
const read = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
const write = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* The private link remains available in the address bar. */ } };

function Modal({ children, close, label, wide = false }: { children: ReactNode; close: () => void; label: string; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { ref.current?.showModal(); }, []);
  return <dialog ref={ref} className={`modal ${wide ? "wide" : ""}`} aria-label={label} onCancel={close} onClick={e => { if (e.target === ref.current) close(); }}><button className="icon-button close-modal" onClick={close} aria-label="Cerrar"><X size={20} /></button>{children}</dialog>;
}

export default function Creator() {
  const [draft, setDraft] = useState<Draft>(initialDraft);
  const [owner, setOwner] = useState<Owner | null>(null);
  const [saved, setSaved] = useState("");
  const [history, setHistory] = useState<History[]>([]);
  const [tab, setTab] = useState<Tab>("questions");
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [modal, setModal] = useState<"share" | "preview" | "help" | null>(null);
  const [openAttempt, setOpenAttempt] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const dirty = JSON.stringify(draft) !== saved;
  const latestAttemptId = history[0]?.id;
  useEffect(() => { if (latestAttemptId) setOpenAttempt(latestAttemptId); }, [latestAttemptId]);

  useEffect(() => {
    let active = true;
    async function restore() {
      try {
        const id = new URLSearchParams(location.search).get("room");
        const token = new URLSearchParams(location.hash.slice(1)).get("key");
        const previous = read("en-owner-v1");
        const credentials: Owner | null = id && token ? { id, token } : previous ? JSON.parse(previous) : null;
        if (credentials?.id && credentials?.token) {
          const data = await api<Managed>(`/api/rooms/${credentials.id}?manage=1`, { headers: { Authorization: `Bearer ${credentials.token}` } });
          if (!active) return;
          const next: Draft = { sender: data.sender, recipient: data.recipient, title: data.title, questions: data.questions, letter: data.letter };
          setDraft(next); setSaved(JSON.stringify(next)); setOwner(credentials); setHistory(data.history);
          write("en-owner-v1", JSON.stringify(credentials));
          window.history.replaceState(null, "", `/?room=${credentials.id}#key=${credentials.token}`);
        } else {
          const localDraft = read("en-draft-v1");
          if (localDraft) { const parsed = JSON.parse(localDraft); if (Array.isArray(parsed.questions) && typeof parsed.letter === "string") setDraft(parsed); }
        }
      } catch (e) { if (active) setError(e instanceof Error ? e.message : "No pudimos abrir tu espacio."); }
      finally { if (active) setReady(true); }
    }
    void restore(); return () => { active = false; };
  }, []);
  useEffect(() => { if (ready && !owner) write("en-draft-v1", JSON.stringify(draft)); }, [draft, ready, owner]);
  useEffect(() => {
    if (!owner) return;
    let active = true;
    const refresh = async () => {
      if (document.visibilityState !== "visible") return;
      try { const data = await api<Managed>(`/api/rooms/${owner.id}?manage=1`, { headers: { Authorization: `Bearer ${owner.token}` } }); if (active) setHistory(data.history); } catch { /* Manual refresh presents connection failures. */ }
    };
    const timer = setInterval(refresh, 12000);
    window.addEventListener("focus", refresh);
    return () => { active = false; clearInterval(timer); window.removeEventListener("focus", refresh); };
  }, [owner]);
  useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(""), 4500); return () => clearTimeout(timer); }, [notice]);
  useEffect(() => { if (!dirty || !owner) return; const guard = (event: BeforeUnloadEvent) => event.preventDefault(); window.addEventListener("beforeunload", guard); return () => window.removeEventListener("beforeunload", guard); }, [dirty, owner]);

  function field<K extends keyof Draft>(key: K, value: Draft[K]) { setDraft(d => ({ ...d, [key]: value })); setError(""); }
  function question(index: number, value: string) { setDraft(d => ({ ...d, questions: d.questions.map((q, i) => i === index ? value : q) })); setError(""); }
  function move(index: number, direction: number) { setDraft(d => { const questions = [...d.questions]; [questions[index], questions[index + direction]] = [questions[index + direction], questions[index]]; return { ...d, questions }; }); }
  async function save() {
    setError("");
    if (!draft.sender.trim() || !draft.recipient.trim() || !draft.title.trim() || draft.questions.some(q => !q.trim())) { setTab("questions"); setError("Completa los nombres, el título y todas las preguntas."); return; }
    if (!draft.letter.trim()) { setTab("letter"); setError("Escribe una carta para el final de la sorpresa."); return; }
    setBusy(true);
    try {
      const next: Draft = { ...draft, sender: draft.sender.trim(), recipient: draft.recipient.trim(), title: draft.title.trim(), questions: draft.questions.map(q => q.trim()), letter: draft.letter.trim() };
      if (owner) await api(`/api/rooms/${owner.id}`, { method: "PUT", headers: { Authorization: `Bearer ${owner.token}` }, body: JSON.stringify(next) });
      else {
        const data = await api<Owner>("/api/rooms", { method: "POST", body: JSON.stringify(next) });
        const credentials = { id: data.id, token: data.token }; setOwner(credentials); write("en-owner-v1", JSON.stringify(credentials));
        window.history.replaceState(null, "", `/?room=${data.id}#key=${data.token}`); setModal("share");
      }
      setDraft(next); setSaved(JSON.stringify(next)); setNotice("Tu sorpresa está guardada y lista para compartir.");
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  async function copy(value: string) { try { await navigator.clipboard.writeText(value); setNotice("Enlace copiado."); } catch { setNotice("Selecciona el enlace y cópialo manualmente."); } }
  async function refreshHistory() {
    if (!owner) return; setRefreshing(true); setError("");
    try { const data = await api<Managed>(`/api/rooms/${owner.id}?manage=1`, { headers: { Authorization: `Bearer ${owner.token}` } }); setHistory(data.history); setNotice("Respuestas actualizadas."); } catch (e) { setError((e as Error).message); } finally { setRefreshing(false); }
  }
  const respondentUrl = owner && typeof location !== "undefined" ? `${location.origin}/r/${owner.id}` : "";
  const ownerUrl = owner && typeof location !== "undefined" ? `${location.origin}/?room=${owner.id}#key=${owner.token}` : "";
  const total = draft.questions.length;
  return <div className="creator-shell">
    <aside className="sidebar"><Brand /><div className="sidebar-caption">UN PEQUEÑO MUNDO PARA DOS</div><div className="space-label">TU ESPACIO <span>♡</span></div>
      <nav aria-label="Tu espacio">
        <button className={tab === "questions" ? "nav-item active" : "nav-item"} onClick={() => setTab("questions")}><MessageCircle size={19} />Mis preguntas<span className="nav-count">{total}</span></button>
        <button className={tab === "letter" ? "nav-item active" : "nav-item"} onClick={() => setTab("letter")}><Mail size={19} />Carta final</button>
        <button className={tab === "answers" ? "nav-item active" : "nav-item"} onClick={() => setTab("answers")}><Heart size={19} />Sus respuestas{history.length > 0 && <span className="nav-count">{history.length}</span>}</button>
      </nav>
      <div className="sidebar-note"><span className="tiny-spark">✧</span><p>Las mejores historias<br />empiezan con una<br /><em>pequeña pregunta.</em></p><span className="drawn-line" /></div>
      <div className="sidebar-bottom"><button onClick={() => setModal("help")} className="help-button"><HelpCircle size={17} />¿Cómo funciona?</button><p>Hecho para sentir, sin prisa.<Heart size={12} /></p></div>
    </aside>
    <div className="workspace"><header className="topbar"><div className="breadcrumb">Tu espacio<span>/</span><strong>{tab === "questions" ? "Mis preguntas" : tab === "letter" ? "Carta final" : "Sus respuestas"}</strong></div><span className={`save-state ${!dirty && owner ? "saved" : ""}`}><i />{!ready ? "Abriendo tu espacio…" : !dirty && owner ? "Todo guardado" : "Borrador"}</span></header>
      <main id="main" className="creator-main"><section className="page-heading"><div><div className="eyebrow"><span />SOLO TÚ Y YO</div><h1>{tab === "questions" ? <>El amor también<br />se escribe en <em>preguntas.</em></> : tab === "letter" ? <>Hay palabras que<br />merecen una <em>carta.</em></> : <>Sus palabras,<br />tus nuevos <em>recuerdos.</em></>}</h1><p>{tab === "questions" ? "Crea un momento bonito. Pregunta, escucha y vuelve a enamorarte." : tab === "letter" ? "Un último detalle para cuando termine de abrirte su corazón." : "Cada vez que responda, tendrás una nueva página de su historia."}</p></div><div className="heading-doodle" aria-hidden="true">♡<span>para ustedes dos</span></div></section>
      {error && <div className="error-banner" role="alert">{error}<button className="icon-button" aria-label="Cerrar error" onClick={() => setError("")}><X size={16} /></button></div>}
      <div className="editor-layout"><div className="editor-column">
        {tab === "questions" && <><section className="panel details-panel"><div className="section-title"><span className="section-icon"><Heart size={18} /></span><div><h2>Primero, ustedes</h2><p>Los protagonistas de esta pequeña historia.</p></div></div><div className="two-fields"><label>De parte de<input maxLength={60} value={draft.sender} onChange={e => field("sender", e.target.value)} placeholder="Tu nombre o apodo" autoComplete="given-name" /></label><label>Para esa persona especial<input maxLength={60} value={draft.recipient} onChange={e => field("recipient", e.target.value)} placeholder="Su nombre o apodo" /></label></div><label className="title-field">Ponle un título a este momento<input maxLength={120} value={draft.title} onChange={e => field("title", e.target.value)} /></label></section>
        <section className="panel questions-panel"><div className="section-title"><span className="section-icon"><MessageCircle size={18} /></span><div><h2>Lo que quiero preguntarte</h2><p>Aparecerán una a una, a su propio ritmo.</p></div><span className="soft-tag">{total} preguntas</span></div>
          <div className="question-list">{draft.questions.map((q, i) => <div className="question-editor" key={i}><span className="question-number">{String(i + 1).padStart(2,"0")}</span><div className="question-input"><label htmlFor={`q-${i}`}>PREGUNTA {i + 1}</label><textarea id={`q-${i}`} value={q} maxLength={500} rows={2} onChange={e => question(i,e.target.value)} placeholder="Algo que siempre hayas querido saber…" /></div><div className="question-controls"><button className="icon-button" aria-label={`Subir pregunta ${i + 1}`} disabled={i === 0} onClick={() => move(i,-1)}><ArrowUp size={14} /></button><button className="icon-button" aria-label={`Bajar pregunta ${i + 1}`} disabled={i === total - 1} onClick={() => move(i,1)}><ArrowDown size={14} /></button><button className="icon-button delete" aria-label={`Eliminar pregunta ${i + 1}`} disabled={total === 1} onClick={() => field("questions", draft.questions.filter((_,j) => j !== i))}><Trash2 size={15} /></button></div></div>)}</div>
          <button className="add-question" disabled={total >= 30} onClick={() => { field("questions", [...draft.questions, ""]); setTimeout(() => document.getElementById(`q-${total}`)?.focus(),0); }}><Plus size={17} />Añadir otra pregunta<span>{total}/30</span></button><p className="field-hint"><Sparkles size={13} />No hay respuestas correctas. Solo cosas bonitas por descubrir.</p>
        </section><button className="letter-shortcut" onClick={() => setTab("letter")}><span className="shortcut-icon"><Mail size={22} /></span><span><strong>Y al final… una carta para su corazón</strong><small>Personaliza la sorpresa que recibirá al terminar.</small></span><ArrowRight size={19} /></button></>}
        {tab === "letter" && <section className="panel letter-editor"><div className="section-title"><span className="section-icon"><Mail size={18} /></span><div><h2>Lo que guardas en el corazón</h2><p>Solo se abrirá después de enviar todas las respuestas.</p></div></div><label htmlFor="letter">Tu carta</label><textarea id="letter" maxLength={15000} rows={18} value={draft.letter} onChange={e => field("letter",e.target.value)} /><div className="letter-editor-foot"><span>Escríbela como si estuviera frente a ti.</span><span>{draft.letter.length}/15000</span></div></section>}
        {tab === "answers" && <section className="panel history-panel"><div className="section-title"><span className="section-icon"><Heart size={18} /></span><div><h2>Una historia en cada respuesta</h2><p>El intento más reciente aparece primero.</p></div><button className="icon-button" disabled={!owner || refreshing} onClick={refreshHistory} aria-label="Actualizar respuestas"><RefreshCw className={refreshing ? "spin" : ""} size={18} /></button></div>{history.length === 0 ? <div className="empty-state"><div className="empty-heart"><Heart size={36} strokeWidth={1} /></div><h3>Lo bonito está por llegar</h3><p>{owner ? "Comparte tu enlace. Cuando termine de responder, sus palabras aparecerán aquí." : "Guarda tus preguntas y comparte la sorpresa para recibir sus respuestas."}</p>{owner && <button className="secondary-button" onClick={() => setModal("share")}><Link2 size={16} />Compartir sorpresa</button>}</div> : <div className="history-list">{history.map((attempt,i) => <details key={attempt.id} open={openAttempt === attempt.id || (openAttempt === null && i === 0)} ><summary onClick={e => { e.preventDefault(); setOpenAttempt(current => current === attempt.id ? "" : attempt.id); }}><span className="attempt-symbol"><Heart size={17} /></span><div><strong>Respuesta {attempt.attempt}</strong><small>{dateLabel(attempt.createdAt)}</small></div>{i === 0 && <span className="soft-tag">Más reciente</span>}<ArrowDown size={16} /></summary><div className="history-answers">{attempt.answers.map((a,j) => <div key={j}><span>{String(j + 1).padStart(2,"0")}</span><div><h3>{a.question}</h3><p>{a.answer}</p></div></div>)}</div></details>)}</div>}</section>}
        <div className="save-row"><span><LockKeyhole size={14} />Tu espacio de creación es privado.</span><button className="primary-button" onClick={save} disabled={!ready || busy || (!!owner && !dirty)}>{busy ? <RefreshCw size={17} className="spin" /> : !dirty && owner ? <Check size={17} /> : <Save size={17} />}{busy ? "Guardando…" : !dirty && owner ? "Cambios guardados" : owner ? "Guardar cambios" : "Guardar mi sorpresa"}</button></div>
      </div><aside className="preview-column"><section className="preview-card"><div className="preview-top"><span className="eyebrow">DEL OTRO LADO DEL ENLACE</span><span className="mini-heart">♡</span></div><Envelope /><p className="preview-for">Una sorpresa para</p><h2>{draft.recipient.trim() || "tu persona favorita"}</h2><p className="preview-description">Unas preguntas, todas sus palabras<br />y un final que abraza.</p><div className="preview-meta"><span><MessageCircle size={14} />{total} preguntas</span><span><Mail size={14} />1 carta de amor</span></div><button className="secondary-button preview-button" onClick={() => setModal("preview")}><Eye size={16} />Así lo verá mi amor<ArrowRight size={16} /></button></section><section className="share-card"><span className="section-icon"><Link2 size={19} /></span><h3>Un enlace. Un momento suyo.</h3><p>Cuando todo esté listo, envíale su enlace y deja que el amor haga el resto.</p><button className="text-button" disabled={!owner} onClick={() => setModal("share")}>{owner ? "Compartir mi sorpresa" : "Disponible al guardar"}<ArrowRight size={15} /></button></section><div className="handwritten-note">Pequeños detalles,<br /><span>grandes sentimientos.</span><Heart size={18} /></div></aside></div>
      <footer className="page-footer"><span>entre nosotros.</span><p>Un espacio para preguntar bonito y responder con el corazón.</p><Heart size={13} /></footer>
      </main>
    </div>
    {notice && <div className="toast" role="status"><Check size={18} />{notice}</div>}
    {modal === "preview" && <Modal label="Vista previa de tu sorpresa" wide close={() => setModal(null)}><div className="preview-label"><Eye size={14} />VISTA PREVIA · Las respuestas de prueba no se guardan</div><Journey room={{ ...draft, id: "preview", revision: "preview", sender: draft.sender || "Tu amor", recipient: draft.recipient || "Mi amor" }} previewLetter={draft.letter} /></Modal>}
    {modal === "share" && owner && <Modal label="Compartir tu sorpresa" close={() => setModal(null)}><div className="share-modal-icon"><Heart size={28} /></div><h2>Un pedacito de ti,<br /><em>listo para llegar a su corazón.</em></h2><p>Este es el enlace para {draft.recipient || "tu amor"}. Podrá responder sin iniciar sesión.</p>{dirty && <p className="inline-warning">Tienes cambios pendientes. Guarda para que aparezcan en su enlace.</p>}<label>ENLACE PARA TU AMOR<div className="copy-field"><input readOnly value={respondentUrl} onFocus={e => e.target.select()} /><button className="icon-button" aria-label="Copiar enlace para responder" onClick={() => copy(respondentUrl)}><Copy size={18} /></button></div></label><button className="primary-button full-button" onClick={() => copy(respondentUrl)}><Copy size={17} />Copiar su enlace</button><div className="private-link"><label><LockKeyhole size={14} />TU ENLACE PRIVADO<div className="copy-field"><input readOnly value={ownerUrl} onFocus={e => e.target.select()} /><button className="icon-button" aria-label="Copiar mi enlace privado" onClick={() => copy(ownerUrl)}><Copy size={17} /></button></div></label><p>Guárdalo para editar y leer las respuestas desde otro dispositivo. Este enlace es solo para ti.</p></div></Modal>}
    {modal === "help" && <Modal label="Cómo funciona" close={() => setModal(null)}><div className="eyebrow">UN DETALLE EN TRES PASOS</div><h2>Ustedes ponen <em>la magia.</em></h2><ol className="help-steps"><li><strong>Escribe con amor.</strong><p>Añade sus nombres, tus preguntas y la carta que descubrirá al final.</p></li><li><strong>Guarda y comparte.</strong><p>Envíale el enlace para responder. Guarda tu enlace privado para volver a tu módulo.</p></li><li><strong>Descubre sus palabras.</strong><p>Responderá una pregunta a la vez. Cada intento completo se guarda como una nueva respuesta, sin borrar las anteriores.</p></li></ol><button className="primary-button full-button" onClick={() => setModal(null)}>A crear un recuerdo<Heart size={16} /></button></Modal>}
  </div>;
}


