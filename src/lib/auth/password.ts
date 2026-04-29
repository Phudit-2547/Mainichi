import { argon2id, argon2Verify } from "hash-wasm";

// OWASP 2023 baseline params for Argon2id; revisit when SecurityEngineer is hired.
const PARAMS = {
  parallelism: 1,
  iterations: 2,
  memorySize: 19 * 1024, // 19 MiB, in KiB
  hashLength: 32,
  outputType: "encoded" as const,
};

const SALT_BYTES = 16;

export async function hashPassword(plain: string): Promise<string> {
  if (!plain) throw new Error("password must not be empty");
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  return argon2id({ ...PARAMS, password: plain, salt });
}

export async function verifyPassword(
  plain: string,
  encoded: string,
): Promise<boolean> {
  if (!plain || !encoded) return false;
  try {
    return await argon2Verify({ password: plain, hash: encoded });
  } catch {
    return false;
  }
}

// 16 random bytes returned as a Buffer for the `kdf_salt` bytea column.
// MS-5 will consume this to derive the user's E2E master key from the same
// password (Argon2id) without re-prompting.
export function generateKdfSalt(): Buffer {
  return Buffer.from(crypto.getRandomValues(new Uint8Array(SALT_BYTES)));
}
