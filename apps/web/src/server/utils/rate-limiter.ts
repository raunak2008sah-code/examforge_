import { DomainError } from '../errors/domain-errors';

const rateLimitStore = new Map<string, { count: number, resetAt: number }>();

export class RateLimiter {
  static check(ipOrUserId: string, limit: number, windowMs: number) {
    const now = Date.now();
    const record = rateLimitStore.get(ipOrUserId);
    
    if (!record || record.resetAt < now) {
       rateLimitStore.set(ipOrUserId, { count: 1, resetAt: now + windowMs });
       return;
    }
    
    if (record.count >= limit) {
       throw new DomainError('Too many requests, please try again later.', 'RATE_LIMIT_EXCEEDED', 429);
    }
    
    record.count++;
  }
  
  static cleanup() {
     const now = Date.now();
     for (const [key, value] of rateLimitStore.entries()) {
        if (value.resetAt < now) {
           rateLimitStore.delete(key);
        }
     }
  }
}

if (typeof setInterval !== 'undefined') {
  setInterval(RateLimiter.cleanup, 60000);
}
