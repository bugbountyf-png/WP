export function safeNextPath(raw: string | null | undefined, fallback = "/app") {
  const value = String(raw ?? "").trim();
  if (!value.startsWith("/")) return fallback;
  if (value.startsWith("//") || value.startsWith("/\\") || value.includes("://") || value.includes("\\")) {
    return fallback;
  }
  if (value.startsWith("/app") || value.startsWith("/onboarding") || value.startsWith("/invite/")) {
    return value;
  }
  return fallback;
}

export function isLocalApp() {
  if (process.env.NODE_ENV !== "production") return true;
  const url = process.env.APP_URL ?? "";
  return url.includes("localhost") || url.includes("127.0.0.1");
}
