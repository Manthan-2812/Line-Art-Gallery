// ─────────────────────────────────────────────────────────────────────────────
// netlify/functions/get-address.js
//
// Authenticated endpoint to fetch a user's shipping address.
// Keeps Firestore client rules locked down by routing reads through the backend.
// ─────────────────────────────────────────────────────────────────────────────
const { verifyToken } = require('@clerk/backend');
const { db } = require('./_firebaseAdmin');

exports.handler = async (event) => {
    if (event.httpMethod !== 'GET') {
        return json(405, { error: 'Method not allowed' });
    }

    const token = (event.headers.authorization || '').replace('Bearer ', '').trim();
    if (!token) {
        return json(401, { error: 'Unauthorized: No token provided' });
    }

    let userId;
    try {
        const payload = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY });
        userId = payload.sub;
    } catch (e) {
        console.error('[get-address] Token verification failed:', e.message);
        return json(401, { error: 'Unauthorized: Invalid token' });
    }

    try {
        const doc = await db.collection('users').doc(userId).get();
        if (!doc.exists) {
            return json(200, { address: null });
        }
        return json(200, { address: doc.data() });
    } catch (e) {
        console.error('[get-address] Firestore read failed:', e.message);
        return json(500, { error: 'Failed to read address' });
    }
};

function json(statusCode, obj) {
    return {
        statusCode,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(obj)
    };
}
