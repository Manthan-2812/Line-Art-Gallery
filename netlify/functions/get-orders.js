// ─────────────────────────────────────────────────────────────────────────────
// netlify/functions/get-orders.js
//
// Authenticated endpoint to retrieve order history for the logged-in Clerk user.
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
        return json(401, { error: 'Unauthorized: Invalid token' });
    }

    try {
        // Query orders by clerkUserId
        const snap = await db.collection('orders')
            .where('clerkUserId', '==', userId)
            .get();

        const orders = [];
        snap.forEach(doc => {
            const d = doc.data();
            orders.push({
                id: doc.id,
                orderId: d.orderId || doc.id,
                paymentId: d.paymentId || doc.id,
                amount: Math.round((d.amount || 0) / 100),
                artName: d.artName || 'Art Print',
                printUrl: d.printUrl || '',
                sku: d.sku || '',
                fulfillment: d.fulfillment || 'pending',
                shipping: d.shipping || {},
                createdAt: d.createdAt ? d.createdAt.toDate().toISOString() : new Date().toISOString()
            });
        });

        // Sort newest first
        orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        return json(200, { orders });
    } catch (e) {
        console.error('[get-orders] Error fetching orders:', e.message);
        return json(500, { error: 'Failed to fetch orders' });
    }
};

function json(statusCode, obj) {
    return {
        statusCode,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(obj)
    };
}
