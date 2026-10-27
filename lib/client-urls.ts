declare const __GITHUB_PAGES__: boolean;
type BrowserLocation = Pick<Location, "hostname" | "origin">;
const pagesBase = "/preguntas-para-mi-negrita/";
const backendOrigin = "https://preguntas-para-mi-negrita.jazzyelk32.chatgpt.site";
const currentLocation = (): BrowserLocation | null => typeof window === "undefined" ? null : window.location;
export function isGitHubPages(location = currentLocation()) {
  return (typeof __GITHUB_PAGES__ !== "undefined" && __GITHUB_PAGES__) || location?.hostname === "lordmayes-cyber.github.io";
}
export function creatorPath(id?: string, token?: string, location = currentLocation()) {
  const base = isGitHubPages(location) ? `${pagesBase}?edit=1` : "/";
  if (!id || !token) return base;
  const separator = isGitHubPages(location) ? "&" : "?";
  return `${base}${separator}room=${encodeURIComponent(id)}#key=${encodeURIComponent(token)}`;
}
export function respondentPath(id: string, location = currentLocation()) {
  return isGitHubPages(location) ? `${pagesBase}?room=${encodeURIComponent(id)}` : `/r/${encodeURIComponent(id)}`;
}
export function apiPath(path: string, location = currentLocation()) {
  return isGitHubPages(location) ? `${backendOrigin}${path}` : path;
}
