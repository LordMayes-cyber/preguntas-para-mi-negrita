export const pagesOrigin = "https://lordmayes-cyber.github.io";
export function isAllowedApiOrigin(origin: string, requestUrl: string) {
  return origin === new URL(requestUrl).origin || origin === pagesOrigin;
}
function corsHeaders(request: Request) {
  const origin = request.headers.get("origin");
  const headers = new Headers({ Vary: "Origin" });
  if (origin && isAllowedApiOrigin(origin, request.url)) headers.set("Access-Control-Allow-Origin", origin);
  return headers;
}
export function preflight(request: Request) {
  const origin = request.headers.get("origin");
  const method = request.headers.get("access-control-request-method") ?? "";
  const requestedHeaders = (request.headers.get("access-control-request-headers") ?? "").toLowerCase().split(",").map(value => value.trim()).filter(Boolean);
  if (!origin || !isAllowedApiOrigin(origin, request.url) || !["GET", "POST", "PUT"].includes(method) || requestedHeaders.some(header => !["authorization", "content-type"].includes(header))) {
    return new Response(null, { status: 403, headers: { Vary: "Origin" } });
  }
  const headers = corsHeaders(request);
  headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  headers.set("Access-Control-Max-Age", "600");
  return new Response(null, { status: 204, headers });
}
export function withApiCors(request: Request, response: Response) {
  const headers = new Headers(response.headers);
  for (const [key,value] of corsHeaders(request)) {
    if (key === "vary") {
      const existing = headers.get("Vary");
      if (!existing?.toLowerCase().split(",").some(value => value.trim() === "origin")) headers.set("Vary", existing ? `${existing}, Origin` : "Origin");
    } else headers.set(key,value);
  }
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
