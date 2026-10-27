import { env } from "cloudflare:workers";
import { isAllowedApiOrigin } from "./api-cors";
type Room = { id: string; manage_hash: string; sender: string; recipient: string; title: string; questions: string; letter: string; revision: string; created_at: string };
type Submission = { id: string; room_id: string; attempt: number; answers: string; letter: string; sender: string; recipient: string; created_at: string };
class HttpError extends Error { constructor(public status: number, message: string) { super(message); } }
const db = () => { if (!env.DB) throw new Error("Missing database"); return env.DB; };
const idPattern = /^[a-f0-9-]{36}$/i;
export const json = (value: unknown, status = 200) => Response.json(value, { status, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer" } });
export async function safe(run: () => Promise<Response>) {
  try { return await run(); } catch (error) {
    if (error instanceof HttpError) return json({ error: error.message }, error.status);
    console.error("Love API:", error instanceof Error ? error.message : "Unknown failure");
    return json({ error: "No pudimos guardar este momento. Inténtalo de nuevo; tus palabras siguen aquí." }, 500);
  }
}
async function body(request: Request) {
  const raw = await request.text();
  const origin = request.headers.get("origin");
  if (origin && !isAllowedApiOrigin(origin, request.url)) throw new HttpError(403, "Este enlace no permite esa acción.");
  if (raw.length > 150000) throw new HttpError(413, "El contenido es demasiado largo.");
  try { const parsed = JSON.parse(raw); if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw 0; return parsed; }
  catch { throw new HttpError(400, "Revisa los datos e inténtalo de nuevo."); }
}
function text(value: unknown, max: number, field: string) {
  if (typeof value !== "string" || !value.trim() || value.trim().length > max) throw new HttpError(400, `Revisa ${field} (máximo ${max} caracteres).`);
  return value.trim();
}
function content(data: Record<string, unknown>) {
  if (!Array.isArray(data.questions) || data.questions.length < 1 || data.questions.length > 30) throw new HttpError(400, "Añade entre 1 y 30 preguntas.");
  return { sender: text(data.sender, 60, "tu nombre"), recipient: text(data.recipient, 60, "su nombre"), title: text(data.title, 120, "el título"), questions: data.questions.map(q => text(q, 500, "cada pregunta")), letter: text(data.letter, 15000, "la carta") };
}
async function hash(token: string) { return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token)))).map(x => x.toString(16).padStart(2,"0")).join(""); }
async function findRoom(id: string) {
  if (!idPattern.test(id)) throw new HttpError(404, "Este rincón no existe. Revisa el enlace.");
  const room = await db().prepare("SELECT * FROM rooms WHERE id = ?").bind(id).first<Room>();
  if (!room) throw new HttpError(404, "Este rincón no existe. Revisa el enlace.");
  return room;
}
async function authorize(request: Request, room: Room) {
  const token = request.headers.get("authorization")?.replace(/^Bearer /, "") ?? "";
  if (!token || await hash(token) !== room.manage_hash) throw new HttpError(403, "Necesitas tu enlace privado para entrar a este espacio.");
}
function publicRoom(room: Room) { return { id: room.id, sender: room.sender, recipient: room.recipient, title: room.title, questions: JSON.parse(room.questions) as string[], revision: room.revision }; }
function receipt(row: Submission) { return { id: row.id, attempt: row.attempt, letter: row.letter, sender: row.sender, recipient: row.recipient, createdAt: row.created_at }; }
export async function createRoom(request: Request) {
  const data = content(await body(request));
  const id = crypto.randomUUID(), token = crypto.randomUUID() + crypto.randomUUID(), revision = crypto.randomUUID();
  await db().prepare("INSERT INTO rooms (id, manage_hash, sender, recipient, title, questions, letter, revision, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(id, await hash(token), data.sender, data.recipient, data.title, JSON.stringify(data.questions), data.letter, revision, new Date().toISOString()).run();
  return json({ id, token, revision }, 201);
}
export async function getRoom(request: Request, id: string) {
  const room = await findRoom(id);
  if (new URL(request.url).searchParams.get("manage") !== "1") return json(publicRoom(room));
  await authorize(request, room);
  const history = await db().prepare("SELECT id, attempt, answers, created_at FROM submissions WHERE room_id = ? ORDER BY attempt DESC").bind(id).all<Submission>();
  return json({ ...publicRoom(room), letter: room.letter, history: history.results.map(row => ({ id: row.id, attempt: row.attempt, answers: JSON.parse(row.answers), createdAt: row.created_at })) });
}
export async function updateRoom(request: Request, id: string) {
  // Consume write bodies before early authorization returns so workerd can reuse the connection safely.
  const payload = await body(request);
  const room = await findRoom(id); await authorize(request, room);
  const data = content(payload); const revision = crypto.randomUUID();
  await db().prepare("UPDATE rooms SET sender=?, recipient=?, title=?, questions=?, letter=?, revision=? WHERE id=?").bind(data.sender, data.recipient, data.title, JSON.stringify(data.questions), data.letter, revision, id).run();
  return json({ id, revision });
}
export async function submitAnswers(request: Request, id: string) {
  const data = await body(request), room = await findRoom(id);
  if (typeof data.id !== "string" || !idPattern.test(data.id)) throw new HttpError(400, "El intento no es válido.");
  const prior = await db().prepare("SELECT * FROM submissions WHERE id=?").bind(data.id).first<Submission>();
  if (prior) { if (prior.room_id !== id) throw new HttpError(409, "Este intento no corresponde al enlace."); return json(receipt(prior)); }
  if (data.revision !== room.revision) throw new HttpError(409, "Las preguntas cambiaron mientras respondías. Recarga la página para ver las nuevas preguntas.");
  const questions = JSON.parse(room.questions) as string[];
  if (!Array.isArray(data.answers) || data.answers.length !== questions.length) throw new HttpError(400, "Responde todas las preguntas antes de enviar.");
  const rawAnswers = data.answers;
  const answers = questions.map((question, i) => ({ question, answer: text(rawAnswers[i], 5000, "cada respuesta") }));
  // Generate the attempt ordinal in the same serialized statement; retries keep their original ordinal.
  await db().prepare("INSERT INTO submissions (id, room_id, attempt, answers, letter, sender, recipient, created_at) SELECT ?, ?, COALESCE(MAX(attempt), 0)+1, ?, ?, ?, ?, ? FROM submissions WHERE room_id = ? ON CONFLICT(id) DO NOTHING").bind(data.id, id, JSON.stringify(answers), room.letter, room.sender, room.recipient, new Date().toISOString(), id).run();
  const saved = await db().prepare("SELECT * FROM submissions WHERE id=? AND room_id=?").bind(data.id, id).first<Submission>();
  if (!saved) throw new Error("Submission missing after insert");
  return json(receipt(saved), 201);
}
export async function getReceipt(roomId: string, submissionId: string) {
  if (!idPattern.test(roomId) || !idPattern.test(submissionId)) throw new HttpError(404, "No encontramos esta carta.");
  const row = await db().prepare("SELECT * FROM submissions WHERE room_id=? AND id=?").bind(roomId, submissionId).first<Submission>();
  if (!row) throw new HttpError(404, "No encontramos esta carta.");
  return json(receipt(row));
}
