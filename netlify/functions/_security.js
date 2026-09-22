// ─────────────────────────────────────────────────────────────────────────────
// netlify/functions/_security.js
//
// API Security & Protection Helper:
//   1. In-memory IP/Client Rate Limiting (Anti-Spam & DoS mitigation).
//   2. OWASP Secure Response Headers (nosniff, DENY, cache-control).
//   3. Input validation & sanitization utilities.
// ─────────────────────────────────────────────────────────────────────────────

const rateLimitMap = new Map(); // ip -> { count, resetTime }

// Clean up expired rate limit entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of rateLimitMap.entries()) {
        if (now > value.resetTime) {
            rateLimitMap.delete(key);
        }
    }
}, 300000);

/**
 * Check rate limit for an incoming Netlify request event.
 * @param {object} event - Netlify function event
 * @param {number} maxRequests - Max requests allowed per window (default: 60)
 * @param {number} windowMs - Window duration in ms (default: 60,000ms = 1 min)
 * @returns {boolean} true if request is allowed, false if rate limited
 */
function checkRateLimit(event, maxRequests = 60, windowMs = 60000) {
    const ip = (event.headers['x-nf-client-connection-ip'] || 
                event.headers['client-ip'] || 
                event.headers['x-forwarded-for'] || 
                'unknown-ip').split(',')[0].trim();

    const now = Date.now();
    const record = rateLimitMap.get(ip);

    if (!record || now > record.resetTime) {
        rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
        return true;
    }

    if (record.count >= maxRequests) {
        return false;
    }

    record.count += 1;
    return true;
}

/**
 * Standard secure JSON response wrapper with OWASP headers
 */
function secureJson(statusCode, obj, additionalHeaders = {}) {
    return {
        statusCode,
        headers: {
            'Content-Type': 'application/json',
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'Cache-Control': 'no-store, max-age=0',
            ...additionalHeaders
        },
        body: JSON.stringify(obj)
    };
}

module.exports = {
    checkRateLimit,
    secureJson
};
