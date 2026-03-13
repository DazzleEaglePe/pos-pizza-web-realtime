export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;

  try {
    const fromLs = window.localStorage.getItem("pos_access_token");
    if (fromLs) return fromLs;

    const match = window.document.cookie.match(
      /(?:^|;\s*)pos_access_token=([^;]*)/,
    );
    return match?.[1] ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
}
