declare const __GITHUB_PAGES__: boolean;
declare const __STATIC_APP_BASE__: string;
declare const __SAME_ORIGIN_API__: boolean;
type BrowserLocation = Pick<Location, "hostname" | "origin">;
const pagesBase = "/preguntas-para-mi-negrita/";
const backendOrigin = "https://preguntas-para-mi-negrita.jazzyelk32.chatgpt.site";
const currentLocation = (): BrowserLocation | null => typeof window === "undefined" ? null : window.location;
export function isGitHubPages(location = currentLocation()) {
  return (typeof __GITHUB_PAGES__ !== "undefined" && __GITHUB_PAGES__) || location?.hostname === "lordmayes-cyber.github.io";
}
export function creatorPath(id?: string, token?: string, location = currentLocation()) {
  const staticBase = typeof __STATIC_APP_BASE__ !== "undefined" ? __STATIC_APP_BASE__ : pagesBase;
  const base = isGitHubPages(location) ? `${staticBase}?edit=1` : "/";
  if (!id || !token) return base;
  const separator = isGitHubPages(location) ? "&" : "?";
  return `${base}${separator}room=${encodeURIComponent(id)}#key=${encodeURIComponent(token)}`;
}
export function respondentPath(id: string, location = currentLocation()) {
  const staticBase = typeof __STATIC_APP_BASE__ !== "undefined" ? __STATIC_APP_BASE__ : pagesBase;
  return isGitHubPages(location) ? `${staticBase}?room=${encodeURIComponent(id)}` : `/r/${encodeURIComponent(id)}`;
}
export function apiPath(path: string, location = currentLocation()) {
  if (typeof __SAME_ORIGIN_API__ !== "undefined" && __SAME_ORIGIN_API__) return path;
  return isGitHubPages(location) ? `${backendOrigin}${path}` : path;
}
