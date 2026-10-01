// ─────────────────────────────────────────────────────────────────────────────
// netlify/functions/manage-artwork.js
//
// Admin serverless endpoint for adding, updating, and deleting artworks.
// Strictly requires a valid Clerk JWT token belonging to an authorized admin
// email address. Bypasses client-side permission vulnerabilities.
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

    const { action, img, id, fields } = body;

    try {
        if (action === 'add') {
            if (!img || !img.url) {
                return secureJson(400, { error: 'Missing artwork image payload' });
            }
            const docData = {
                url:       img.url,
                name:      img.name     ?? 'Untitled Artwork',
                likes:     img.likes    ?? 0,
                comments:  img.comments ?? [],
                pinned:    img.pinned   ?? false,
                addedAt:   img.addedAt  ?? Date.now(),
                createdAt: Date.now()
            };
            if (img.printUrl) docData.printUrl = img.printUrl;
            if (img.price !== undefined && !isNaN(Number(img.price))) docData.price = Number(img.price);
            if (img.blackOffset !== undefined) docData.blackOffset = Number(img.blackOffset);
            if (img.greyOffset !== undefined) docData.greyOffset = Number(img.greyOffset);
            if (img.navyOffset !== undefined) docData.navyOffset = Number(img.navyOffset);
            if (img.royalBlueOffset !== undefined) docData.royalBlueOffset = Number(img.royalBlueOffset);
            if (img.redOffset !== undefined) docData.redOffset = Number(img.redOffset);

            const docRef = await db.collection('images').add(docData);
            return secureJson(200, { ok: true, id: docRef.id });
        }

        if (action === 'delete') {
            if (!id) return secureJson(400, { error: 'Missing artwork ID' });
            await db.collection('images').doc(String(id)).delete();
            return secureJson(200, { ok: true, message: 'Artwork deleted' });
        }

        if (action === 'update') {
            if (!id || !fields || typeof fields !== 'object') {
                return secureJson(400, { error: 'Missing artwork ID or fields' });
            }
            await db.collection('images').doc(String(id)).update(fields);
            return secureJson(200, { ok: true, message: 'Artwork updated' });
        }

        if (action === 'delete-all') {
            const snap = await db.collection('images').get();
            const batch = db.batch();
            snap.docs.forEach(doc => batch.delete(doc.ref));
            await batch.commit();
            return secureJson(200, { ok: true, message: 'All artworks deleted' });
        }

        return secureJson(400, { error: 'Invalid or unsupported action' });
    } catch (err) {
        console.error('[manage-artwork] Error performing action:', action, err.message);
        return secureJson(500, { error: 'Failed to perform action: ' + err.message });
    }
};
