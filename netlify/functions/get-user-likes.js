// ─────────────────────────────────────────────────────────────────────────────
// netlify/functions/get-user-likes.js
//
// Authenticated endpoint to fetch the list of liked artwork IDs for a user.
// ─────────────────────────────────────────────────────────────────────────────
const { verifyToken } = require('@clerk/backend');
const { db } = require('./_firebaseAdmin');

exports.handler = async (event) => {
    if (event.httpMethod !== 'GET') {
        return json(405, { error: 'Method not allowed' });
    }

    const token = (event.headers.authorization || '').replace('Bearer ', '').trim();
    if (!token) {
        return json(200, { likedArtworks: [] });
    }

    let userId;
    try {
        const payload = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY });
        userId = payload.sub;
    } catch (e) {
        return json(200, { likedArtworks: [] });
    }

    try {
        const doc = await db.collection('users').doc(userId).get();
        if (!doc.exists) {
            return json(200, { likedArtworks: [] });
        }
        const data = doc.data() || {};
        return json(200, { likedArtworks: data.likedArtworks || [] });
    } catch (e) {
        console.error('[get-user-likes] Firestore read failed:', e.message);
        return json(500, { error: 'Failed to read likes' });
    }
};

function json(statusCode, obj) {
    return {
        statusCode,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(obj)
    };
}
