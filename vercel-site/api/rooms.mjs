const backend = "https://preguntas-para-mi-negrita.jazzyelk32.chatgpt.site";
const uuid = "[a-f0-9-]{36}";
const routePattern = new RegExp(`^(?:${uuid}(?:/answers(?:/${uuid})?)?)?$`, "i");
const fail = (message, status) => Response.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
export async function proxy(request, fetcher = fetch) {
    const url = new URL(request.url);
    if (!["GET", "POST", "PUT"].includes(request.method))
        return fail("Esta acción no está disponible.", 405);
    const origin = request.headers.get("origin");
    if (origin && origin !== url.origin)
        return fail("Este enlace no permite esa acción.", 403);
    const suffix = (url.searchParams.get("_route") ?? url.pathname.replace(/^\/api\/rooms\/?/, "")).replace(/^\/+|\/+$/g, "");
    if (!routePattern.test(suffix))
        return fail("Este rincón no existe. Revisa el enlace.", 404);
    const target = new URL(`/api/rooms${suffix ? `/${suffix}` : ""}`, backend);
    if (url.searchParams.get("manage") === "1")
        target.searchParams.set("manage", "1");
    const headers = new Headers({ "Content-Type": "application/json" });
    const authorization = request.headers.get("authorization");
    if (authorization)
        headers.set("Authorization", authorization);
    let body;
    if (request.method !== "GET") {
        body = await request.text();
        if (body.length > 150000)
            return fail("El contenido es demasiado largo.", 413);
    }
    try {
        // Only the known API receives requests; cookies and browser identity headers are never forwarded.
        const upstream = await fetcher(target, { method: request.method, headers, body, redirect: "error", signal: AbortSignal.any([request.signal, AbortSignal.timeout(25000)]) });
        if (!upstream.headers.get("Content-Type")?.includes("application/json"))
            return fail("No pudimos conectar con tu espacio. Inténtalo de nuevo.", 502);
        return new Response(upstream.body, { status: upstream.status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer" } });
    }
    catch {
        console.error("Love API connection failed");
        return fail("No pudimos conectar con tu espacio. Tus respuestas guardadas siguen a salvo.", 502);
    }
}
export async function GET(request) { return proxy(request); }
export async function POST(request) { return proxy(request); }
export async function PUT(request) { return proxy(request); }
