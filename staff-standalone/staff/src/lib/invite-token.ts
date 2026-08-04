import { createHmac, randomBytes } from "crypto";

const INVITE_SECRET = process.env.NEXTAUTH_SECRET || "forensiq-invite-secret";

export interface InvitePayload {
  orgId: string;
  email: string;
  name: string;
  phone?: string;
  role: string;
  exp: number;
}

export function createEncodedInvite(payload: Omit<InvitePayload, "exp">, expiresInHours = 168): string {
  const exp = Math.floor(Date.now() / 1000) + expiresInHours * 3600;
  const data = JSON.stringify({ ...payload, exp });
  const nonce = randomBytes(8).toString("base64url");
  const hmac = createHmac("sha256", INVITE_SECRET)
    .update(`${nonce}.${data}`)
    .digest("base64url");
  return `${nonce}.${Buffer.from(data).toString("base64url")}.${hmac}`;
}

export function decodeInvite(token: string): InvitePayload | null {
  try {
    const [nonce, dataB64, hmac] = token.split(".");
    if (!nonce || !dataB64 || !hmac) return null;

    const data = Buffer.from(dataB64, "base64url").toString("utf8");
    const expected = createHmac("sha256", INVITE_SECRET)
      .update(`${nonce}.${data}`)
      .digest("base64url");

    if (hmac !== expected) return null;

    const payload = JSON.parse(data) as InvitePayload;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;

    return payload;
  } catch {
    return null;
  }
}
