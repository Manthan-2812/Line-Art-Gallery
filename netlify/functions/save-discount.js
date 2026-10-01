// ─────────────────────────────────────────────────────────────────────────────
// netlify/functions/save-discount.js
//
// Admin endpoint to save or remove global store discounts and product catalog.
// Uses Firebase Admin SDK to bypass client security rule restrictions on the
// 'settings/discounts' and 'settings/catalog' documents.
// ─────────────────────────────────────────────────────────────────────────────
const { db } = require('./_firebaseAdmin');
const { secureJson, verifyAdminUser } = require('./_security');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return secureJson(405, { error: 'Method not allowed' });
    }

    const authResult = await verifyAdminUser(event);
    if (!authResult.authorized) {
        return secureJson(403, { error: authResult.error || 'Access denied: Admin authorization required' });
    }

    let body;
    try {
        body = JSON.parse(event.body || '{}');
    } catch (e) {
        return secureJson(400, { error: 'Invalid JSON body' });
    }

    const { action, discountData, catalogData } = body;

    try {
        if (action === 'catalog') {
            await db.collection('settings').doc('catalog').set({
                products: catalogData || [],
                updatedAt: Date.now()
            });
            return secureJson(200, { ok: true, message: 'Catalog saved' });
        }

        if (action === 'remove') {
            await db.collection('settings').doc('discounts').set({
                active: false,
                discountPercent: 0,
                expiresAt: 0,
                updatedAt: Date.now()
            }, { merge: true });
            return secureJson(200, { ok: true, message: 'Discount removed' });
        }

        if (!discountData || typeof discountData.discountPercent !== 'number') {
            return secureJson(400, { error: 'Invalid discount data' });
        }

        await db.collection('settings').doc('discounts').set({
            ...discountData,
            active: true,
            updatedAt: Date.now()
        });

        return secureJson(200, { ok: true, message: 'Discount saved successfully' });
    } catch (err) {
        console.error('[save-discount] Error updating settings in Firestore:', err.message);
        return secureJson(500, { error: 'Failed to update settings in Firestore: ' + err.message });
    }
};
