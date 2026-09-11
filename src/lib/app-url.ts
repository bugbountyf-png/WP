export function publicOrigin() {
  const explicit = process.env.APP_URL?.trim().replace(/\/$/, "");
  if (explicit) {
    const withProtocol = /^https?:\/\//i.test(explicit) ? explicit : `https://${explicit}`;
    try {
      return new URL(withProtocol).origin;
    } catch {
      /* fall through */
    }
  }
  if (process.env.RAILWAY_PUBLIC_DOMAIN) return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
  return "http://localhost:3000";
}
