// Data Encryption Utilities
// Handles encryption for sensitive data in transit and at rest

import crypto from 'crypto';

/**
 * Encryption configuration
 * The actual encryption key should be stored in environment variables
 */
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 
  crypto.scryptSync(process.env.ENCRYPTION_SALT || 'default-salt', 'salt', 32);

/**
 * Encrypt sensitive data
 * Uses AES-256-GCM for authenticated encryption
 */
export function encryptData(plaintext: string, key?: Buffer): string {
  try {
    const encryptionKey = key || ENCRYPTION_KEY;
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, encryptionKey, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Combine IV and encrypted data with auth tag
    // Format: iv:encrypted:authTag
    return `${iv.toString('hex')}:${encrypted}:${authTag.toString('hex')}`;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt encrypted data
 */
export function decryptData(encrypted: string, key?: Buffer): string {
  try {
    const encryptionKey = key || ENCRYPTION_KEY;
    const parts = encrypted.split(':');

    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = parts[1];
    const authTag = Buffer.from(parts[2], 'hex');

    const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, encryptionKey, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Hash sensitive data (one-way)
 * Uses SHA-256 for hashing
 */
export function hashData(data: string, salt?: string): string {
  try {
    const hashSalt = salt || crypto.randomBytes(16).toString('hex');
    const hash = crypto.createHash('sha256');
    hash.update(data + hashSalt);
    return `${hash.digest('hex')}:${hashSalt}`;
  } catch (error) {
    console.error('Hashing error:', error);
    throw new Error('Failed to hash data');
  }
}

/**
 * Verify hashed data
 */
export function verifyHashedData(data: string, hashed: string): boolean {
  try {
    const [hash, salt] = hashed.split(':');
    const newHash = crypto.createHash('sha256');
    newHash.update(data + salt);
    return newHash.digest('hex') === hash;
  } catch (error) {
    console.error('Hash verification error:', error);
    return false;
  }
}

/**
 * Generate a random encryption key for sensitive operations
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Mask sensitive information (email, phone, etc.)
 * Returns masked version like: test...@example.com
 */
export function maskSensitiveData(data: string, type: 'email' | 'phone' | 'credit_card' = 'email'): string {
  switch (type) {
    case 'email': {
      const [local, domain] = data.split('@');
      const masked = local.substring(0, 3) + '...';
      return `${masked}@${domain}`;
    }
    case 'phone': {
      const last4 = data.slice(-4);
      return `***-****-${last4}`;
    }
    case 'credit_card': {
      const last4 = data.slice(-4);
      return `****-****-****-${last4}`;
    }
    default:
      return data;
  }
}

/**
 * Check if data appears to be encrypted
 */
export function isEncrypted(data: string): boolean {
  // Check if data matches the encryption format: hex:hex:hex
  const parts = data.split(':');
  return parts.length === 3 && parts.every(part => /^[0-9a-f]+$/.test(part));
}

/**
 * Generate secure random token for API keys, tokens, etc.
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}
