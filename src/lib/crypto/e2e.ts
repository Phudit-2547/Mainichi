// Browser-only. All calls require the Web Crypto API (window.crypto.subtle).

const PBKDF2_ITERATIONS = 600_000;
const SESSION_STORAGE_KEY = "mainichi_ek";

// ── Encoding helpers ──────────────────────────────────────────────────────────

function toBase64url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  const chunks: string[] = [];
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    chunks.push(
      String.fromCharCode(...bytes.subarray(offset, offset + chunkSize)),
    );
  }
  return btoa(chunks.join(""))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromBase64url(s: string): Uint8Array<ArrayBuffer> {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}

// ── Key derivation ────────────────────────────────────────────────────────────

export async function deriveKey(
  password: string,
  kdfSaltB64: string,
): Promise<CryptoKey> {
  const salt = fromBase64url(kdfSaltB64);
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true, // extractable so we can persist to sessionStorage
    ["encrypt", "decrypt"],
  );
}

// ── sessionStorage persistence ────────────────────────────────────────────────

export async function saveKeyToSession(key: CryptoKey): Promise<void> {
  const raw = await crypto.subtle.exportKey("raw", key);
  sessionStorage.setItem(SESSION_STORAGE_KEY, toBase64url(raw));
}

export async function loadKeyFromSession(): Promise<CryptoKey | null> {
  const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (!stored) return null;
  try {
    const raw = fromBase64url(stored);
    return await crypto.subtle.importKey("raw", raw.buffer, { name: "AES-GCM", length: 256 }, true, [
      "encrypt",
      "decrypt",
    ]);
  } catch {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    return null;
  }
}

export function clearKeyFromSession(): void {
  sessionStorage.removeItem(SESSION_STORAGE_KEY);
}

// ── Encrypt / decrypt ─────────────────────────────────────────────────────────

const PAYLOAD_PREFIX = "v1:";

export async function encryptText(key: CryptoKey, plaintext: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(plaintext),
  );
  return `${PAYLOAD_PREFIX}${toBase64url(iv.buffer)}:${toBase64url(ciphertext)}`;
}

export async function decryptText(key: CryptoKey, payload: string): Promise<string> {
  if (!payload.startsWith(PAYLOAD_PREFIX)) {
    // Legacy plaintext row — return as-is
    return payload;
  }
  const parts = payload.slice(PAYLOAD_PREFIX.length).split(":");
  if (parts.length !== 2) throw new Error("malformed ciphertext");
  const [ivB64, ctB64] = parts as [string, string];
  const iv = fromBase64url(ivB64);
  const ciphertext = fromBase64url(ctB64);
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
  return new TextDecoder().decode(plain);
}

export function isEncrypted(value: string): boolean {
  return value.startsWith(PAYLOAD_PREFIX);
}
