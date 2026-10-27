"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, Check, Heart, MailOpen, RefreshCw } from "lucide-react";
import { api, Brand, Envelope, Hearts, type Receipt, type Room } from "./shared";
type Progress = { revision: string; id: string; answers: string[]; step: number; started: boolean };
function readProgress(key: string) { try { return JSON.parse(localStorage.getItem(key) || "null"); } catch { return null; } }
function storeProgress(key: string, value: unknown) { try { localStorage.setItem(key,JSON.stringify(value)); } catch { /* The current visit works without local storage. */ } }

export function Journey({ room, previewLetter, initialReceipt }: { room: Room; previewLetter?: string; initialReceipt?: Receipt | null }) {
  const preview = previewLetter !== undefined;
  const [started,setStarted] = useState(false);
  const [answers,setAnswers] = useState<string[]>([]);
  const [step,setStep] = useState(0);
  const [receipt,setReceipt] = useState<Receipt | null>(initialReceipt ?? null);
  const [opened,setOpened] = useState(false);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState("");
  const [ready,setReady] = useState(false);
  const [attemptId,setAttemptId] = useState("");
  const focusRef = useRef<HTMLTextAreaElement>(null);
  const progressKey = `en-progress-v1-${room.id}`;
  const receiptKey = `en-receipt-v1-${room.id}`;
  useEffect(() => {
    const progress = !preview ? readProgress(progressKey) as Progress | null : null;
    if (!initialReceipt && progress?.revision === room.revision && Array.isArray(progress.answers)) { setAnswers(progress.answers); setStep(Math.max(0, Math.min(progress.step,room.questions.length - 1))); setStarted(progress.started); setAttemptId(progress.id); }
    else setAttemptId(crypto.randomUUID());
    setReady(true);
  }, [preview, progressKey, room.revision, room.questions.length, initialReceipt]);
  useEffect(() => {
    if (ready && !preview && !receipt) storeProgress(progressKey, { id: attemptId, revision: room.revision, answers, step, started });
  }, [ready,preview,receipt,progressKey,attemptId,room.revision,answers,step,started]);
  useEffect(() => { if (started && !receipt) focusRef.current?.focus(); }, [step, started, receipt]);
  async function next(e: FormEvent) {
    e.preventDefault(); setError("");
    if (!answers[step]?.trim()) { setError("Cuéntame un poquito antes de continuar."); focusRef.current?.focus(); return; }
    if (step < room.questions.length - 1) { setStep(s => s + 1); return; }
    setBusy(true);
    try {
      const saved = preview ? { id: "preview", attempt: 1, letter: previewLetter || "", sender: room.sender, recipient: room.recipient, createdAt: new Date().toISOString() } : await api<Receipt>(`/api/rooms/${room.id}/answers`, { method: "POST", body: JSON.stringify({ id: attemptId, revision: room.revision, answers }) });
      setReceipt(saved);
      if (!preview) { storeProgress(receiptKey,saved.id); try { localStorage.removeItem(progressKey); } catch { /* optional recovery storage */ } }
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  function restart() {
    if (!preview) { try { localStorage.removeItem(receiptKey); localStorage.removeItem(progressKey); } catch {} window.location.reload(); return; }
    setAnswers([]); setStep(0); setReceipt(null); setStarted(true); setOpened(false); setAttemptId(crypto.randomUUID()); setError("");
  }
  return <div className={`journey ${preview ? "is-preview" : ""}`}><Hearts />
    {!started && !receipt ? <section className="welcome-card"><span className="eyebrow">DE {room.sender} · PARA {room.recipient}</span><Envelope /><p className="script-intro">Hola, {room.recipient}.</p><h1>{room.title}</h1><p>Hay cosas que me encanta descubrir de ti.<br />Te dejé unas preguntas y algo especial al final.</p><button className="primary-button" disabled={!ready} onClick={() => setStarted(true)}>Abrir este momento<Heart size={18} /></button><span className="journey-note">{room.questions.length} preguntas · Sin prisa, con el corazón</span></section>
    : receipt ? !opened ? <section className="welcome-card finish-card"><span className="completion-icon"><Check size={24} /></span><span className="eyebrow">TUS PALABRAS YA TIENEN UN LUGAR</span><h1>Y ahora, algo <em>para ti.</em></h1><p>{preview ? "Así descubrirá tu carta al terminar." : `Tu respuesta ${receipt.attempt} se guardó con cariño.`}<br />{receipt.sender} te dejó una última sorpresa.</p><Envelope /><button className="primary-button" onClick={() => setOpened(true)}><MailOpen size={18} />Abrir mi carta</button></section>
    : <section className="final-card"><div className="letter-seal"><Heart size={24} fill="currentColor" /></div><div className="eyebrow">PARA {receipt.recipient}, CON AMOR</div><h1>Unas palabras <em>para ti.</em></h1><div className="letter-body">{receipt.letter}</div><div className="letter-signature">Con amor,<br /><span>{receipt.sender}</span><Heart size={20} /></div><div className="after-letter"><span><Check size={14} />{preview ? "Vista previa" : `Respuesta ${receipt.attempt} guardada`}</span><button className="text-button" onClick={restart}><RefreshCw size={15} />Volver a responder</button><p>Cada vez será un nuevo recuerdo. Los anteriores se conservan.</p></div></section>
    : <section className="answer-card"><div className="question-progress"><span>UN POQUITO MÁS DE TI</span><span>{String(step + 1).padStart(2,"0")} <i>/ {String(room.questions.length).padStart(2,"0")}</i></span></div><div className="progress-track"><span style={{ width: `${(step + 1) / room.questions.length * 100}%` }} /></div><span className="question-heart" aria-hidden="true">♡</span><form onSubmit={next}><label htmlFor="answer" className="answer-question" key={step}>{room.questions[step]}</label><p>No hay una respuesta perfecta. Solo la tuya.</p><textarea ref={focusRef} id="answer" required rows={5} maxLength={5000} value={answers[step] || ""} placeholder="Te cuento que…" onChange={e => { const value = e.target.value; setAnswers(previous => { const next = [...previous]; next[step] = value; return next; }); setError(""); }} disabled={busy} /><div className="answer-count">{(answers[step] || "").length}/5000</div>{error && <div className="error-banner" role="alert">{error}</div>}<div className="answer-actions"><button type="button" className="text-button" disabled={step === 0 || busy} onClick={() => { setStep(s => s - 1); setError(""); }}><ArrowLeft size={16} />Anterior</button><button type="submit" className="primary-button" disabled={busy}>{busy ? <><RefreshCw className="spin" size={17} />Guardando…</> : step === room.questions.length - 1 ? <>Enviar mis respuestas<Heart size={17} /></> : <>Siguiente pregunta<ArrowRight size={17} /></>}</button></div></form><p className="journey-note">{room.sender} quiere conocerte un poquito más.</p></section>}
  </div>;
}
export default function Respondent({ roomId }: { roomId: string }) {
  const [room,setRoom] = useState<Room | null>(null);
  const [receipt,setReceipt] = useState<Receipt | null>(null);
  const [error,setError] = useState("");
  const [reload,setReload] = useState(0);
  useEffect(() => { let active = true;
    async function load() {
      setError("");
      try {
        const data = await api<Room>(`/api/rooms/${roomId}`);
        const savedId = readProgress(`en-receipt-v1-${roomId}`);
        let recovered: Receipt | null = null;
        if (typeof savedId === "string") { try { recovered = await api<Receipt>(`/api/rooms/${roomId}/answers/${savedId}`); } catch {} }
        if (active) { setRoom(data); setReceipt(recovered); }
      } catch (e) { if (active) setError((e as Error).message); }
    }
    void load(); return () => { active = false; };
  }, [roomId,reload]);
  return <div className="respondent-shell"><header className="respondent-header"><Brand /><span>UN ESPACIO PARA DOS <Heart size={14} /></span></header><main>{error ? <div className="loading-card"><Heart size={32} /><h1>Este momento puede esperar un poquito.</h1><p role="alert">{error}</p><button className="primary-button" onClick={() => setReload(n => n + 1)}>Intentar de nuevo<RefreshCw size={16} /></button></div> : room ? <Journey room={room} initialReceipt={receipt} /> : <div className="loading-card" role="status"><Heart size={36} className="pulse" /><p>Abriendo un pequeño mundo para dos…</p></div>}</main><footer className="respondent-footer">Hecho con amor. Para vivirlo sin prisa.<Heart size={12} /></footer></div>;
}
