// Verifies an App Store signed transaction (StoreKit 2 "JWS") without any Apple credentials.
// The JWS header carries a certificate chain (leaf, intermediate, Apple root). We check that
//   1. the root is Apple Root CA - G3 (by its SHA-256 fingerprint) and signed itself,
//   2. the intermediate is signed by the root and the leaf by the intermediate,
//   3. the leaf is an App Store receipt signing certificate,
//   4. the JWS signature was made by the leaf's key.
// Only then is the payload trusted. Uses WebCrypto only, so it runs in Deno and Node.

// SHA-256 of "Apple Root CA - G3" (https://www.apple.com/certificateauthority/). Can be replaced with the
// APPLE_ROOT_SHA256 secret if Apple ever changes it.
export const APPLE_ROOT_G3_SHA256 = "63343abfb89a6a03ebb57e9b3f5fa7be7c4f5c756f3017b3a8c488c3653e9179";

const enc = new TextEncoder();
const hex = (b: ArrayBuffer | Uint8Array) => Array.from(new Uint8Array(b)).map((x) => x.toString(16).padStart(2, "0")).join("");

export function b64uToBytes(s: string): Uint8Array {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (s.length % 4)) % 4);
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}
const b64ToBytes = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

// ---- a very small DER reader: enough to take a certificate apart ----
type Node = { tag: number; start: number; hdr: number; len: number; end: number };
function node(d: Uint8Array, pos: number): Node {
  const tag = d[pos];
  let len = d[pos + 1];
  let hdr = 2;
  if (len & 0x80) {
    const n = len & 0x7f;
    if (n < 1 || n > 4) throw new Error("bad DER length");
    len = 0;
    for (let i = 0; i < n; i++) len = len * 256 + d[pos + 2 + i];
    hdr = 2 + n;
  }
  const end = pos + hdr + len;
  if (end > d.length) throw new Error("DER overrun");
  return { tag, start: pos, hdr, len, end };
}
const children = (d: Uint8Array, n: Node): Node[] => {
  const out: Node[] = [];
  let p = n.start + n.hdr;
  while (p < n.end) { const c = node(d, p); out.push(c); p = c.end; }
  return out;
};
const body = (d: Uint8Array, n: Node) => d.slice(n.start + n.hdr, n.end);
const whole = (d: Uint8Array, n: Node) => d.slice(n.start, n.end);
const oidHex = (d: Uint8Array, n: Node) => hex(body(d, n));

const OID_ECDSA_SHA256 = "2a8648ce3d040302";
const OID_ECDSA_SHA384 = "2a8648ce3d040303";
const OID_P256 = "2a8648ce3d030107";
const OID_P384 = "2b81040022";
// 1.2.840.113635.100.6.11.1 (leaf: Mac App Store / App Store receipt signing) and 1.2.840.113635.100.6.2.1 (intermediate)
const OID_APPLE_LEAF = "2a864886f76364060b01";
const OID_APPLE_INTERMEDIATE = "2a864886f76364060201";

type Cert = { der: Uint8Array; tbs: Uint8Array; sigAlg: string; sig: Uint8Array; spki: Uint8Array; curve: "P-256" | "P-384" };

function parseCert(der: Uint8Array): Cert {
  const top = node(der, 0);
  const [tbsN, algN, sigN] = children(der, top);
  const alg = children(der, algN)[0];
  const tbsKids = children(der, tbsN);
  const first = tbsKids[0].tag === 0xa0 ? 1 : 0; // explicit [0] version present
  const spkiN = tbsKids[first + 5];              // serial, sigAlg, issuer, validity, subject, spki
  const spkiKids = children(der, spkiN);
  const curveOid = oidHex(der, children(der, spkiKids[0])[1]);
  const curve = curveOid === OID_P256 ? "P-256" : curveOid === OID_P384 ? "P-384" : null;
  if (!curve) throw new Error("unsupported certificate key");
  return { der, tbs: whole(der, tbsN), sigAlg: oidHex(der, alg), sig: body(der, sigN).slice(1), spki: whole(der, spkiN), curve };
}

// ECDSA signature DER {r, s} -> raw r||s
function derSigToRaw(sig: Uint8Array, size: number): Uint8Array {
  const seq = node(sig, 0);
  const [r, s] = children(sig, seq);
  const fix = (n: Node) => {
    let v = body(sig, n);
    while (v.length > size && v[0] === 0) v = v.slice(1);
    if (v.length > size) throw new Error("bad signature");
    const out = new Uint8Array(size);
    out.set(v, size - v.length);
    return out;
  };
  const out = new Uint8Array(size * 2);
  out.set(fix(r), 0);
  out.set(fix(s), size);
  return out;
}

async function certSignedBy(cert: Cert, issuer: Cert): Promise<boolean> {
  const hash = cert.sigAlg === OID_ECDSA_SHA384 ? "SHA-384" : cert.sigAlg === OID_ECDSA_SHA256 ? "SHA-256" : null;
  if (!hash) return false;
  const size = issuer.curve === "P-384" ? 48 : 32;
  const key = await crypto.subtle.importKey("spki", issuer.spki, { name: "ECDSA", namedCurve: issuer.curve }, false, ["verify"]);
  return crypto.subtle.verify({ name: "ECDSA", hash }, key, derSigToRaw(cert.sig, size), cert.tbs);
}

const contains = (d: Uint8Array, needle: string) => hex(d).includes(needle);

export type VerifyResult = { ok: true; payload: Record<string, unknown> } | { ok: false; reason: string };

export async function verifyAppleJws(jws: string, rootSha256 = APPLE_ROOT_G3_SHA256): Promise<VerifyResult> {
  try {
    const parts = jws.split(".");
    if (parts.length !== 3) return { ok: false, reason: "not_a_jws" };
    const header = JSON.parse(new TextDecoder().decode(b64uToBytes(parts[0])));
    if (header.alg !== "ES256" || !Array.isArray(header.x5c) || header.x5c.length !== 3) return { ok: false, reason: "bad_header" };

    const [leafDer, interDer, rootDer] = header.x5c.map((c: string) => b64ToBytes(c));
    if (hex(await crypto.subtle.digest("SHA-256", rootDer)) !== rootSha256.toLowerCase()) return { ok: false, reason: "untrusted_root" };

    const leaf = parseCert(leafDer);
    const inter = parseCert(interDer);
    const root = parseCert(rootDer);
    if (!(await certSignedBy(root, root))) return { ok: false, reason: "root_not_self_signed" };
    if (!(await certSignedBy(inter, root))) return { ok: false, reason: "intermediate_not_signed_by_root" };
    if (!(await certSignedBy(leaf, inter))) return { ok: false, reason: "leaf_not_signed_by_intermediate" };
    if (!contains(leaf.tbs, OID_APPLE_LEAF)) return { ok: false, reason: "leaf_not_app_store" };
    if (!contains(inter.tbs, OID_APPLE_INTERMEDIATE)) return { ok: false, reason: "intermediate_not_app_store" };
    if (leaf.curve !== "P-256") return { ok: false, reason: "leaf_key" };

    const leafKey = await crypto.subtle.importKey("spki", leaf.spki, { name: "ECDSA", namedCurve: "P-256" }, false, ["verify"]);
    const okSig = await crypto.subtle.verify({ name: "ECDSA", hash: "SHA-256" }, leafKey, b64uToBytes(parts[2]), enc.encode(`${parts[0]}.${parts[1]}`));
    if (!okSig) return { ok: false, reason: "bad_signature" };

    return { ok: true, payload: JSON.parse(new TextDecoder().decode(b64uToBytes(parts[1]))) };
  } catch (e) {
    return { ok: false, reason: `invalid: ${e instanceof Error ? e.message : String(e)}` };
  }
}
