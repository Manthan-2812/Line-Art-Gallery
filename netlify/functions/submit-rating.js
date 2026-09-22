// ─────────────────────────────────────────────────────────────────────────────
// netlify/functions/submit-rating.js
//
// Endpoint to submit a post-purchase 1-5 star rating and update global metrics.
// ─────────────────────────────────────────────────────────────────────────────
const { admin, db } = require('./_firebaseAdmin');
const { checkRateLimit, secureJson } = require('./_security');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return secureJson(405, { error: 'Method not allowed' });
    }

    if (!checkRateLimit(event, 30, 60000)) {
        return secureJson(429, { error: 'Too many requests. Please slow down.' });
    }

    let body;
    try { body = JSON.parse(event.body || '{}'); }
    catch (e) { return secureJson(400, { error: 'Invalid JSON body' }); }

    const { stars, feedback, orderId, artName } = body;
    const ratingNum = Number(stars);

    if (!ratingNum || ratingNum < 1 || ratingNum > 5) {
        return secureJson(400, { error: 'Rating must be between 1 and 5 stars' });
    }

    try {
        const ratingDoc = {
            stars: ratingNum,
            feedback: String(feedback || '').slice(0, 500),
            orderId: String(orderId || '').slice(0, 100),
            artName: String(artName || '').slice(0, 150),
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        };

        await db.collection('ratings').add(ratingDoc);

        // Update stats/metrics atomically
        await db.collection('stats').doc('metrics').set({
            totalRatingStars: admin.firestore.FieldValue.increment(ratingNum),
            totalRatingsCount: admin.firestore.FieldValue.increment(1)
        }, { merge: true });

        return secureJson(200, { ok: true });
    } catch (e) {
        console.error('[submit-rating] Error saving rating:', e.message);
        return secureJson(500, { error: 'Failed to save rating' });
    }
};
