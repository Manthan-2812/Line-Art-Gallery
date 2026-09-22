// ─────────────────────────────────────────────────────────────────────────────
// netlify/functions/toggle-like.js
//
// Authenticated endpoint to toggle a like on an artwork.
// Ensures 1 like per user account across all devices and browsers.
// ─────────────────────────────────────────────────────────────────────────────
const { verifyToken } = require('@clerk/backend');
const { admin, db } = require('./_firebaseAdmin');
const { checkRateLimit, secureJson } = require('./_security');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return secureJson(405, { error: 'Method not allowed' });
    }

    if (!checkRateLimit(event, 60, 60000)) {
        return secureJson(429, { error: 'Too many requests. Please slow down.' });
    }

    const token = (event.headers.authorization || '').replace('Bearer ', '').trim();
    if (!token) {
        return secureJson(401, { error: 'Unauthorized: Please sign in to like artworks' });
    }

    let userId;
    try {
        const payload = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY });
        userId = payload.sub;
    } catch (e) {
        console.error('[toggle-like] Token verification failed:', e.message);
        return secureJson(401, { error: 'Unauthorized: Invalid session' });
    }

    let body;
    try { body = JSON.parse(event.body || '{}'); }
    catch (e) { return secureJson(400, { error: 'Invalid JSON body' }); }

    const { artId } = body;
    if (!artId || typeof artId !== 'string') {
        return secureJson(400, { error: 'Missing or invalid artId' });
    }

    try {
        const userRef = db.collection('users').doc(userId);
        const artRef  = db.collection('images').doc(artId);

        const result = await db.runTransaction(async (t) => {
            const uDoc = await t.get(userRef);
            const uData = uDoc.exists ? uDoc.data() : {};
            const likedList = Array.isArray(uData.likedArtworks) ? uData.likedArtworks : [];
            const isLiked = likedList.includes(artId);

            let newLikedList;
            let delta;

            if (isLiked) {
                newLikedList = likedList.filter(id => id !== artId);
                delta = -1;
            } else {
                newLikedList = [...likedList, artId];
                delta = 1;
            }

            t.set(userRef, { likedArtworks: newLikedList }, { merge: true });
            t.set(artRef, {
                likes: admin.firestore.FieldValue.increment(delta)
            }, { merge: true });

            return { liked: !isLiked };
        });

        return secureJson(200, { ok: true, liked: result.liked });
    } catch (e) {
        console.error('[toggle-like] Transaction failed:', e.message);
        return secureJson(500, { error: 'Failed to update like status' });
    }
};
