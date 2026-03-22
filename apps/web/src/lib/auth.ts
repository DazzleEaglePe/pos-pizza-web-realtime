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

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem("pos_refresh_token");
  } catch {
    return null;
  }
}

export function saveTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem("pos_access_token", accessToken);
  localStorage.setItem("pos_refresh_token", refreshToken);
  document.cookie = `pos_access_token=${accessToken}; path=/; SameSite=Lax`;
}

export function clearTokens() {
  localStorage.removeItem("pos_access_token");
  localStorage.removeItem("pos_refresh_token");
  localStorage.removeItem("pos_user");
  document.cookie =
    "pos_access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
}
