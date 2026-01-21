/**
 * API Vault Encryption
 * AES-256-GCM şifreleme ile güvenli API key depolama
 */

// Browser-native crypto API kullanarak şifreleme
const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12;
const TAG_LENGTH = 128;

// Derive encryption key from user's master password + user ID
export async function deriveEncryptionKey(
  masterPassword: string,
  userId: string
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const salt = encoder.encode(`canvasflow-vault-${userId}`);
  
  // Import master password as key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(masterPassword),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  
  // Derive AES-GCM key using PBKDF2
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

// Encrypt data with AES-256-GCM
export async function encryptData(
  data: string,
  key: CryptoKey
): Promise<{ encrypted: string; iv: string }> {
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  
  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: ALGORITHM,
      iv,
      tagLength: TAG_LENGTH,
    },
    key,
    encoder.encode(data)
  );
  
  return {
    encrypted: bufferToBase64(new Uint8Array(encryptedBuffer)),
    iv: bufferToBase64(iv),
  };
}

// Decrypt data with AES-256-GCM
export async function decryptData(
  encryptedData: string,
  iv: string,
  key: CryptoKey
): Promise<string> {
  const decoder = new TextDecoder();
  
  const ivBuffer = base64ToBuffer(iv);
  const dataBuffer = base64ToBuffer(encryptedData);
  
  const decryptedBuffer = await crypto.subtle.decrypt(
    {
      name: ALGORITHM,
      iv: ivBuffer.buffer.slice(ivBuffer.byteOffset, ivBuffer.byteOffset + ivBuffer.byteLength) as ArrayBuffer,
      tagLength: TAG_LENGTH,
    },
    key,
    dataBuffer.buffer.slice(dataBuffer.byteOffset, dataBuffer.byteOffset + dataBuffer.byteLength) as ArrayBuffer
  );
  
  return decoder.decode(decryptedBuffer);
}

// Helper: Buffer to Base64
function bufferToBase64(buffer: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < buffer.length; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  return btoa(binary);
}

// Helper: Base64 to Buffer
function base64ToBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const buffer = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    buffer[i] = binary.charCodeAt(i);
  }
  return buffer;
}

// Generate a secure random key for first-time setup
export function generateMasterKey(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return bufferToBase64(array);
}

// Hash master password for verification (without storing actual password)
export async function hashPassword(password: string, userId: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${password}:${userId}:canvasflow-vault`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return bufferToBase64(new Uint8Array(hashBuffer));
}

// Verify password against stored hash
export async function verifyPassword(
  password: string,
  userId: string,
  storedHash: string
): Promise<boolean> {
  const computedHash = await hashPassword(password, userId);
  return computedHash === storedHash;
}
