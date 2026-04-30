export const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333"
).replace(/\/$/, "");

export const WS_URL = (process.env.NEXT_PUBLIC_WS_URL || API_URL).replace(
  /\/$/,
  "",
);
