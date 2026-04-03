import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 32;
const KEY_LENGTH = 32;
const TAG_LENGTH = 16;

function deriveKey(secret: string, salt: Buffer): Buffer {
    return scryptSync(secret, salt, KEY_LENGTH) as Buffer;
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Returns base64-encoded ciphertext containing: salt + iv + tag + ciphertext
 */
export function encrypt(plaintext: string, secret: string): string {
    const salt = randomBytes(SALT_LENGTH);
    const iv = randomBytes(IV_LENGTH);
    const key = deriveKey(secret, salt);

    const cipher = createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();

    const result = Buffer.concat([salt, iv, tag, encrypted]);
    return result.toString('base64');
}

/**
 * Decrypts a base64-encoded ciphertext produced by `encrypt()`.
 */
export function decrypt(ciphertext: string, secret: string): string {
    const data = Buffer.from(ciphertext, 'base64');

    const salt = data.subarray(0, SALT_LENGTH);
    const iv = data.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const tag = data.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
    const encrypted = data.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);

    const key = deriveKey(secret, salt);
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    return decipher.update(encrypted) + decipher.final('utf8');
}
