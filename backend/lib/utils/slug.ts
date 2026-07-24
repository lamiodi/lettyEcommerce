/**
 * URL-safe slug helper.
 * - Lowercase, ASCII only, hyphen-separated.
 * - Collapses multiple hyphens.
 * - Used by product / category / brand / collection creators.
 */
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 160);
}
