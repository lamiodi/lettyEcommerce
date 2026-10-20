/** Only local paths may be used after authentication. */
export function safeRedirectPath(input: string | null): string {
  if (!input) return "/";
  try {
    const decoded = decodeURIComponent(input);
    if (!decoded.startsWith("/") || decoded.startsWith("//") || /[\\\u0000-\u0020]/.test(decoded)) return "/";
    const target = new URL(decoded, "https://www.houseofletty.com");
    return target.origin === "https://www.houseofletty.com" ? input : "/";
  } catch { return "/"; }
}
