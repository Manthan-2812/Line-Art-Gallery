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

const { createClerkClient, verifyToken } = require('@clerk/backend');

const ADMIN_EMAILS = [
    'manthanparekh9d@gmail.com'
];

/**
 * Verify if the request comes from an authenticated, verified admin user via Clerk.
 * @param {object} event - Netlify event
 * @returns {Promise<{authorized: boolean, error?: string, userId?: string, email?: string}>}
 */
async function verifyAdminUser(event) {
    const header = event.headers.authorization || event.headers.Authorization || '';
    const token = header.replace('Bearer ', '').trim();
    if (!token) {
        return { authorized: false, error: 'Unauthorized: No authorization token provided' };
    }

    const secretKey = process.env.CLERK_SECRET_KEY;
    if (!secretKey) {
        return { authorized: false, error: 'Server authentication misconfigured: CLERK_SECRET_KEY missing' };
    }

    try {
        const payload = await verifyToken(token, { secretKey });
        const userId = payload.sub;

        const clerk = createClerkClient({ secretKey });
        const user = await clerk.users.getUser(userId);

        const verifiedEmails = (user.emailAddresses || [])
            .filter(e => e.verification && e.verification.status === 'verified')
            .map(e => (e.emailAddress || '').toLowerCase());

        const isAdmin = verifiedEmails.some(email => ADMIN_EMAILS.includes(email));

        if (!isAdmin) {
            return { authorized: false, error: 'Forbidden: User is not an authorized administrator' };
        }

        return { authorized: true, userId, email: verifiedEmails[0] };
    } catch (err) {
        console.error('[AdminAuth] Token/User verification failed:', err.message);
        return { authorized: false, error: 'Unauthorized: Invalid or expired session token' };
    }
}

module.exports = {
    checkRateLimit,
    secureJson,
    verifyAdminUser,
    ADMIN_EMAILS
};
