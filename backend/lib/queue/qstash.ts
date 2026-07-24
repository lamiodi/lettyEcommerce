/**
 * Vercel QStash helpers: publish async jobs and verify incoming signatures.
 */
import { Client, Receiver } from "@upstash/qstash";
import { env } from "@/lib/env";

let _client: Client | null = null;
let _receiver: Receiver | null = null;

function getClient(): Client | null {
  if (_client) return _client;
  const cfg = env();
  if (!cfg.QSTASH_TOKEN) return null;
  _client = new Client({ token: cfg.QSTASH_TOKEN });
  return _client;
}

function getReceiver(): Receiver | null {
  if (_receiver) return _receiver;
  const cfg = env();
  if (!cfg.QSTASH_CURRENT_SIGNING_KEY || !cfg.QSTASH_NEXT_SIGNING_KEY) return null;
  _receiver = new Receiver({
    currentSigningKey: cfg.QSTASH_CURRENT_SIGNING_KEY,
    nextSigningKey: cfg.QSTASH_NEXT_SIGNING_KEY,
  });
  return _receiver;
}

export interface PublishOpts {
  /** Delay in seconds before delivery. */
  delay?: number;
  /** Idempotency key — QStash will dedupe deliveries with the same key. */
  notBefore?: number;
  /** Headers to forward. */
  headers?: Record<string, string>;
  /** Optional content-type override. */
  contentType?: "application/json" | "application/x-www-form-urlencoded";
}

export async function publishJob<T>(
  url: string,
  body: T,
  opts: PublishOpts = {},
): Promise<{ messageId: string } | null> {
  const client = getClient();
  if (!client) {
    // No QStash configured — log and continue; jobs are best-effort.
    // eslint-disable-next-line no-console
    console.warn("[qstash] QSTASH_TOKEN missing — skipping publish", { url });
    return null;
  }
  const target = url.startsWith("http") ? url : `${env().NEXT_PUBLIC_SITE_URL}${url}`;
  const res = await client.publishJSON({
    url: target,
    body: body as Record<string, unknown>,
    delay: opts.delay,
    notBefore: opts.notBefore,
    headers: opts.headers,
    contentType: opts.contentType,
  });
  return { messageId: res.messageId };
}

export async function verifyQStashSignature(
  signature: string | null,
  rawBody: string,
): Promise<boolean> {
  const receiver = getReceiver();
  if (!receiver) {
    // Refuse unsigned requests in production, allow in dev.
    return env().NODE_ENV !== "production";
  }
  if (!signature) return false;
  try {
    await receiver.verify({ body: rawBody, signature });
    return true;
  } catch {
    return false;
  }
}
