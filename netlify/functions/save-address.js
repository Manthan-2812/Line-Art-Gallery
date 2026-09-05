// ─────────────────────────────────────────────────────────────────────────────
// netlify/functions/save-address.js
//
// Authenticated endpoint to save a user's shipping address.
// Verifies the Clerk token server-side, ensuring users can only write to
// their own document in the 'users' collection.
// ─────────────────────────────────────────────────────────────────────────────
const { createClerkClient, verifyToken } = require('@clerk/backend');
const { admin, db } = require('./_firebaseAdmin');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
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
        console.error('[save-address] Token verification failed:', e.message);
        return json(401, { error: 'Unauthorized: Invalid token' });
    }

    let body;
    try { body = JSON.parse(event.body || '{}'); }
    catch (e) { return json(400, { error: 'Invalid JSON body' }); }

    try {
        await db.collection('users').doc(userId).set({
            fullName: body.fullName || '',
            phone:    body.phone    || '',
            address1: body.address1 || '',
            address2: body.address2 || '',
            city:     body.city     || '',
            state:    body.state    || '',
            pincode:  body.pincode  || '',
            country:  'India',
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        return json(200, { ok: true });
    } catch (e) {
        console.error('[save-address] Firestore write failed:', e.message);
        return json(500, { error: 'Failed to save address' });
    }
};

function json(statusCode, obj) {
    return {
        statusCode,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(obj)
    };
}
