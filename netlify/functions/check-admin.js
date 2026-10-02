// ─────────────────────────────────────────────────────────────────────────────
// netlify/functions/check-admin.js
//
// Endpoint: GET /api/check-admin
// Returns { isAdmin: true/false } for the calling authenticated user.
// Admin email list is NEVER exposed to the client.
// ─────────────────────────────────────────────────────────────────────────────

const { checkRateLimit, secureJson, verifyAdminUser } = require('./_security');

exports.handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Authorization,Content-Type',
                'Access-Control-Allow-Methods': 'GET,OPTIONS',
            },
            body: '',
        };
    }

    if (event.httpMethod !== 'GET') {
        return secureJson(405, { error: 'Method Not Allowed' });
    }

    // Rate-limit: lightweight, just checking status
    if (!checkRateLimit(event, 60, 60_000)) {
        return secureJson(429, { error: 'Too many requests' });
    }

    const header = (event.headers.authorization || event.headers.Authorization || '').trim();
    if (!header) {
        // Not authenticated at all — just return isAdmin: false (no error)
        return secureJson(200, { isAdmin: false });
    }

    try {
        const result = await verifyAdminUser(event);
        return secureJson(200, { isAdmin: result.authorized === true });
    } catch (err) {
        console.error('[check-admin] Error:', err.message);
        return secureJson(200, { isAdmin: false });
    }
};
