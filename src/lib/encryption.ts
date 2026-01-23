
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;

/**
 * Encrypts a text string using AES-256-GCM.
 * Requires ENCRYPTION_KEY env var (32 bytes hex or 32 chars).
 */
export function encrypt(text: string): string {
    const secret = process.env.ENCRYPTION_KEY;
    if (!secret) throw new Error("ENCRYPTION_KEY is not defined");

    const iv = crypto.randomBytes(IV_LENGTH);
    const salt = crypto.randomBytes(SALT_LENGTH);

    // Derive key using PBKDF2
    const key = crypto.pbkdf2Sync(secret, salt, 100000, 32, 'sha512');

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();

    // Format: salt:iv:tag:encrypted
    return Buffer.concat([salt, iv, tag, encrypted]).toString('hex');
}

/**
 * Decrypts a text string.
 */
export function decrypt(encryptedText: string): string {
    const secret = process.env.ENCRYPTION_KEY;
    if (!secret) throw new Error("ENCRYPTION_KEY is not defined");

    const buffer = Buffer.from(encryptedText, 'hex');

    // Extract parts
    const salt = buffer.subarray(0, SALT_LENGTH);
    const iv = buffer.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const tag = buffer.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
    const encrypted = buffer.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);

    const key = crypto.pbkdf2Sync(secret, salt, 100000, 32, 'sha512');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    return decipher.update(encrypted) + decipher.final('utf8');
}
