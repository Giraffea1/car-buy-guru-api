import { Request, Response, NextFunction } from 'express';

interface IpData {
  count: number;
  resetTime: number;
}

interface RateLimiterFunction {
  (req: Request, res: Response, next: NextFunction): void;
  ipMap?: Map<string, IpData>;
}

const rateLimiter: RateLimiterFunction = (req: Request, res: Response, next: NextFunction): void => {
  // Simple in-memory rate limiter
  // In production, use Redis or a proper rate limiting service
  
  const ipMap = rateLimiter.ipMap || (rateLimiter.ipMap = new Map<string, IpData>());
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 100; // max requests per window

  if (!ipMap.has(ip)) {
    ipMap.set(ip, { count: 1, resetTime: now + windowMs });
    return next();
  }

  const ipData = ipMap.get(ip)!;

  if (now > ipData.resetTime) {
    // Reset the window
    ipData.count = 1;
    ipData.resetTime = now + windowMs;
    return next();
  }

  if (ipData.count >= maxRequests) {
    res.status(429).json({
      success: false,
      error: 'Too many requests, please try again later.',
      retryAfter: Math.ceil((ipData.resetTime - now) / 1000)
    });
    return;
  }

  ipData.count++;
  next();
};

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  if (rateLimiter.ipMap) {
    for (const [ip, data] of rateLimiter.ipMap.entries()) {
      if (now > data.resetTime) {
        rateLimiter.ipMap.delete(ip);
      }
    }
  }
}, 5 * 60 * 1000); // Clean every 5 minutes

export default rateLimiter;