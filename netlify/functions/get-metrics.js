// ─────────────────────────────────────────────────────────────────────────────
// netlify/functions/get-metrics.js
//
// Public endpoint to retrieve live store metrics (Total Orders, Delivered, Ratings).
// ─────────────────────────────────────────────────────────────────────────────
const { db } = require('./_firebaseAdmin');

exports.handler = async () => {
    try {
        const mDoc = await db.collection('stats').doc('metrics').get();
        let data = mDoc.exists ? (mDoc.data() || {}) : {};
        
        let totalOrders = data.totalOrders || 0;
        let delivered = data.delivered || totalOrders;
        let totalRatingStars = data.totalRatingStars || 0;
        let totalRatingsCount = data.totalRatingsCount || 0;

        // Auto-sync fallback: if totalOrders is 0, count actual orders in collection
        if (!totalOrders) {
            try {
                const ordersSnap = await db.collection('orders').get();
                if (ordersSnap.size > 0) {
                    totalOrders = ordersSnap.size;
                    delivered = totalOrders;
                    // Sync back to stats doc
                    await db.collection('stats').doc('metrics').set({ totalOrders, delivered }, { merge: true });
                }
            } catch (e) {}
        }

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            },
            body: JSON.stringify({
                totalOrders,
                delivered,
                totalRatingStars,
                totalRatingsCount
            })
        };
    } catch (e) {
        console.error('[get-metrics] Error reading metrics:', e.message);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Failed to fetch metrics' })
        };
    }
};
