// ─────────────────────────────────────────────────────────────────────────────
// netlify/functions/submit-rating.js
//
// Endpoint to submit a post-purchase 1-5 star rating and update global metrics.
// ─────────────────────────────────────────────────────────────────────────────
const { admin, db } = require('./_firebaseAdmin');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return json(405, { error: 'Method not allowed' });
    }

    let body;
    try { body = JSON.parse(event.body || '{}'); }
    catch (e) { return json(400, { error: 'Invalid JSON body' }); }

    const { stars, feedback, orderId, artName } = body;
    const ratingNum = Number(stars);

    if (!ratingNum || ratingNum < 1 || ratingNum > 5) {
        return json(400, { error: 'Rating must be between 1 and 5 stars' });
    }

    try {
        const ratingDoc = {
            stars: ratingNum,
            feedback: String(feedback || '').slice(0, 500),
            orderId: String(orderId || ''),
            artName: String(artName || ''),
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        };

        await db.collection('ratings').add(ratingDoc);

        // Update stats/metrics atomically
        await db.collection('stats').doc('metrics').set({
            totalRatingStars: admin.firestore.FieldValue.increment(ratingNum),
            totalRatingsCount: admin.firestore.FieldValue.increment(1)
        }, { merge: true });

        return json(200, { ok: true });
    } catch (e) {
        console.error('[submit-rating] Error saving rating:', e.message);
        return json(500, { error: 'Failed to save rating' });
    }
};

function json(statusCode, obj) {
    return {
        statusCode,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(obj)
    };
}
