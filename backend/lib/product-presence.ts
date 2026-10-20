/** Recent, anonymous viewing sessions. Like the cache facade, this lives in
 * the single backend process; use a shared store before adding instances. */
export class ProductPresence {
  private readonly sessions = new Map<string, { slug: string; expiresAt: number }>();
  static readonly ttlMs = 60_000;

  heartbeat(slug: string, sessionId: string, active: boolean, now = Date.now()): number {
    for (const [key, session] of this.sessions) {
      if (session.expiresAt <= now) this.sessions.delete(key);
    }
    const key = `${slug}:${sessionId}`;
    if (!active) this.sessions.delete(key);
    else if (this.sessions.has(key) || this.sessions.size < 5000) {
      this.sessions.set(key, { slug, expiresAt: now + ProductPresence.ttlMs });
    }
    return [...this.sessions.values()].filter(session => session.slug === slug).length;
  }
}
