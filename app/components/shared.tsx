"use client";
import { Heart } from "lucide-react";
import { apiPath, creatorPath, isGitHubPages } from "../../lib/client-urls";
export type Draft = { sender: string; recipient: string; title: string; questions: string[]; letter: string };
export type Room = Omit<Draft, "letter"> & { id: string; revision: string };
export type Receipt = { id: string; attempt: number; letter: string; sender: string; recipient: string; createdAt: string };
export type History = { id: string; attempt: number; answers: { question: string; answer: string }[]; createdAt: string };
export const initialDraft: Draft = {
  sender: "", recipient: "", title: "Un ratito para nosotros",
  questions: ["¿Cuál es tu recuerdo favorito de nosotros?", "¿Qué fue lo primero que pensaste cuando me conociste?", "¿Qué te gustaría que viviéramos juntos?"],
  letter: "Mi amor,\n\nSi llegaste hasta aquí, ya me regalaste algo muy bonito: un pedacito de lo que sientes.\n\nMe encanta descubrirte, incluso en las cosas pequeñas. Tus recuerdos, tus sueños y esa forma tan tuya de ver el mundo hacen que quiera seguir eligiéndote cada día.\n\nGracias por ser tú. Por las risas, los abrazos y por todo lo que todavía nos espera.\n\nTe quiero, hoy y en todos nuestros días.",
};
export async function api<T>(url: string, options: RequestInit = {}): Promise<T> {
  let response: Response;
  try { response = await fetch(apiPath(url), { ...options, credentials: isGitHubPages() ? "omit" : "same-origin", headers: { "Content-Type": "application/json", ...options.headers }, cache: "no-store" }); }
  catch { throw new Error("No hay conexión. Tus palabras siguen aquí; inténtalo de nuevo."); }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = data && typeof data === "object" && "error" in data && typeof data.error === "string" ? data.error : "No pudimos completar la acción. Inténtalo de nuevo.";
    throw new Error(error);
  }
  return data as T;
}
export function Brand() { return <a className="brand" href={creatorPath()} aria-label="Entre nosotros, inicio"><span className="brand-icon"><Heart size={21} strokeWidth={1.5} /></span><span>entre nosotros<span className="brand-dot">.</span></span></a>; }
export function Hearts() { return <div className="hearts" aria-hidden="true">{Array.from({ length: 16 }, (_, i) => <span key={i} style={{ left: `${(i * 47 + 7) % 100}%`, animationDelay: `${i * -.67}s`, animationDuration: `${7 + i % 5}s`, fontSize: `${14 + i % 4 * 10}px` }}>♥</span>)}</div>; }
export function Envelope({ small = false }: { small?: boolean }) { return <div className={`envelope-scene ${small ? "small" : ""}`} aria-hidden="true"><span className="little-heart one">♡</span><span className="little-heart two">♥</span><div className="envelope-paper"><span>Para ti,</span><i>con todo mi amor.</i><div /><div /><div /></div><div className="envelope-body"><div className="envelope-fold" /><span className="wax"><Heart size={24} fill="currentColor" strokeWidth={1} /></span></div><span className="little-heart three">✧</span></div>; }
export function dateLabel(date: string) { return new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "short" }).format(new Date(date)); }
