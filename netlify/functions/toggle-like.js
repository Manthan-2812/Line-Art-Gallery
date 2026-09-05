// ─────────────────────────────────────────────────────────────────────────────
// netlify/functions/toggle-like.js
//
// Authenticated endpoint to toggle a like on an artwork.
// Ensures 1 like per user account across all devices and browsers.
// ─────────────────────────────────────────────────────────────────────────────
const { verifyToken } = require('@clerk/backend');
const { admin, db } = require('./_firebaseAdmin');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return json(405, { error: 'Method not allowed' });
    }

    const token = (event.headers.authorization || '').replace('Bearer ', '').trim();
    if (!token) {
        return json(401, { error: 'Unauthorized: Please sign in to like artworks' });
    }

    let userId;
    try {
        const payload = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY });
        userId = payload.sub;
    } catch (e) {
        console.error('[toggle-like] Token verification failed:', e.message);
        return json(401, { error: 'Unauthorized: Invalid session' });
    }

    let body;
    try { body = JSON.parse(event.body || '{}'); }
    catch (e) { return json(400, { error: 'Invalid JSON body' }); }

    const { artId } = body;
    if (!artId) {
        return json(400, { error: 'Missing artId' });
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

        return json(200, { ok: true, liked: result.liked });
    } catch (e) {
        console.error('[toggle-like] Transaction failed:', e.message);
        return json(500, { error: 'Failed to update like status' });
    }
};

function json(statusCode, obj) {
    return {
        statusCode,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(obj)
    };
}
