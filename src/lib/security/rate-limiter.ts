// API Rate Limiting
// Prevents abuse and ensures fair resource usage

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

type RateLimitStore = Map<string, RateLimitEntry>;

/**
 * In-memory rate limit store
 * In production, use Redis for distributed rate limiting
 */
const rateLimitStore: RateLimitStore = new Map();

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number; // Time window in milliseconds
  message?: string;
  keyGenerator?: (req: any) => string; // Custom key generator
}

/**
 * Rate limit middleware configuration presets
 */
export const RATE_LIMIT_PRESETS = {
  // Strict limits for authentication endpoints
  auth: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    message: 'Çok fazla giriş denemesi. Lütfen daha sonra tekrar deneyin.',
  },
  // Standard limits for API endpoints
  api: {
    maxRequests: 100,
    windowMs: 15 * 60 * 1000, // 15 minutes
    message: 'İstek sınırı aşıldı. Lütfen daha sonra tekrar deneyin.',
  },
  // Loose limits for public endpoints
  public: {
    maxRequests: 1000,
    windowMs: 15 * 60 * 1000, // 15 minutes
    message: 'İstek sınırı aşıldı.',
  },
  // Very strict for sensitive operations
  sensitive: {
    maxRequests: 10,
    windowMs: 60 * 60 * 1000, // 60 minutes
    message: 'Bu işlem için çok fazla istek gönderdiniz.',
  },
};

/**
 * Check if request is rate limited
 * Returns true if request should be blocked, false if it should be allowed
 */
export function checkRateLimit(key: string, config: RateLimitConfig): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetTime) {
    // Create new entry
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return false; // Allow request
  }

  // Check if limit exceeded
  if (entry.count >= config.maxRequests) {
    return true; // Block request
  }

  // Increment counter
  entry.count += 1;
  return false; // Allow request
}

/**
 * Get remaining requests for a given key
 */
export function getRateLimitRemaining(key: string, config: RateLimitConfig): number {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetTime) {
    return config.maxRequests;
  }

  return Math.max(0, config.maxRequests - entry.count);
}

/**
 * Get reset time for a rate limit key
 */
export function getRateLimitResetTime(key: string): number | null {
  const entry = rateLimitStore.get(key);
  return entry?.resetTime || null;
}

/**
 * Reset rate limit for a specific key
 */
export function resetRateLimit(key: string): void {
  rateLimitStore.delete(key);
}

/**
 * Clear all rate limits
 * Use with caution, typically for testing
 */
export function clearAllRateLimits(): void {
  rateLimitStore.clear();
}

/**
 * Clean up expired rate limit entries
 * Call periodically to free up memory
 */
export function cleanupExpiredRateLimits(): number {
  const now = Date.now();
  let cleaned = 0;

  const keysToDelete: string[] = [];
  rateLimitStore.forEach((entry, key) => {
    if (now > entry.resetTime) {
      keysToDelete.push(key);
    }
  });

  keysToDelete.forEach(key => {
    rateLimitStore.delete(key);
    cleaned++;
  });

  return cleaned;
}

/**
 * Get rate limit statistics
 */
export function getRateLimitStats(): {
  totalEntries: number;
  memoryUsage: number;
} {
  return {
    totalEntries: rateLimitStore.size,
    memoryUsage: rateLimitStore.size * 64, // Rough estimate in bytes
  };
}

/**
 * Generate rate limit key from request info
 * Can use IP address, user ID, or combination
 */
export function generateRateLimitKey(
  identifier: string,
  endpoint: string,
  scope: 'user' | 'ip' | 'global' = 'ip'
): string {
  const parts = [scope, endpoint, identifier].filter(Boolean);
  return parts.join(':');
}

/**
 * Distributed rate limiting helper for multi-instance deployments
 * In production, integrate with Redis
 */
export class DistributedRateLimiter {
  private redisClient?: any; // Would be redis client in production

  constructor(redisUrl?: string) {
    // In production, initialize Redis client
    // this.redisClient = redis.createClient({ url: redisUrl });
  }

  async checkLimit(key: string, config: RateLimitConfig): Promise<boolean> {
    if (!this.redisClient) {
      // Fallback to in-memory rate limiting
      return checkRateLimit(key, config);
    }

    // Use Redis for distributed rate limiting
    // const current = await this.redisClient.incr(key);
    // if (current === 1) {
    //   await this.redisClient.expire(key, Math.ceil(config.windowMs / 1000));
    // }
    // return current > config.maxRequests;

    return false; // Placeholder
  }

  async getRemainingRequests(key: string, config: RateLimitConfig): Promise<number> {
    if (!this.redisClient) {
      return getRateLimitRemaining(key, config);
    }

    // const current = await this.redisClient.get(key);
    // return Math.max(0, config.maxRequests - (parseInt(current) || 0));

    return config.maxRequests; // Placeholder
  }
}
