// Client-side data encryption for the static site.
//
// Each data file ships as ciphertext (salt ‖ iv ‖ AES-GCM ciphertext+tag). The
// password never leaves the browser and is never stored in the bundle; the key
// is derived from it at runtime via PBKDF2. A wrong password fails the AES-GCM
// auth check, so decryptFile throws — that's how the login gate validates.
//
// Layout of a .enc file: [salt: 16 bytes][iv: 12 bytes][ciphertext + 16-byte GCM tag]

const SALT_BYTES = 16;
const IV_BYTES = 12;
const PBKDF2_ITERS = 250_000;

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations: PBKDF2_ITERS, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt', 'encrypt'],
  );
}

/** Decrypt a .enc file buffer with the password. Throws on wrong password or corrupt data. */
export async function decryptFile(buf: ArrayBuffer, password: string): Promise<ArrayBuffer> {
  const bytes = new Uint8Array(buf);
  if (bytes.length <= SALT_BYTES + IV_BYTES) throw new Error('Encrypted file too small / malformed.');
  const salt = bytes.slice(0, SALT_BYTES);
  const iv = bytes.slice(SALT_BYTES, SALT_BYTES + IV_BYTES);
  const ciphertext = bytes.slice(SALT_BYTES + IV_BYTES);
  const key = await deriveKey(password, salt);
  // Throws DOMException (OperationError) if the password is wrong.
  return crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv as BufferSource }, key, ciphertext as BufferSource);
}

/** Encrypt a plaintext buffer with the password, producing the .enc layout. (Used by tooling/tests.) */
export async function encryptFile(buf: ArrayBuffer, password: string): Promise<ArrayBuffer> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const key = await deriveKey(password, salt);
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv as BufferSource }, key, buf),
  );
  const out = new Uint8Array(SALT_BYTES + IV_BYTES + ciphertext.length);
  out.set(salt, 0);
  out.set(iv, SALT_BYTES);
  out.set(ciphertext, SALT_BYTES + IV_BYTES);
  return out.buffer;
}
