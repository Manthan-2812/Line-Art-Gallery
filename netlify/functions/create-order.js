// ─────────────────────────────────────────────────────────────────────────────
// netlify/functions/create-order.js
//
// Stage 6 — Creates a Razorpay order for a single artwork print.
//
// SECURITY: the price is looked up SERVER-SIDE from env (PRICE_BY_SKU). The
// amount sent by the browser is ignored, so a customer can never pay less by
// tampering with the request. Payment VERIFICATION happens in Stage 7.
//
//   POST /api/create-order
//   body: { sku, email, artId, artName, printUrl }
//   200 : { orderId, amount, currency, keyId }
// ─────────────────────────────────────────────────────────────────────────────

const Razorpay = require('razorpay');
const { db } = require('./_firebaseAdmin');

// Server-side source of truth for prices (INR). Client prices are NOT trusted.
const defaultTshirtPrice = Number(process.env.PRICE_TSHIRT || process.env.PRICE_FRAME_11X14 || 900);

async function getPriceForSku(sku, artId) {
    if (!sku || typeof sku !== 'string') return null;
    if (artId) {
        try {
            const doc = await db.collection('images').doc(String(artId)).get();
            if (doc.exists) {
                const data = doc.data() || {};
                if (data.price && !isNaN(Number(data.price)) && Number(data.price) > 0) {
                    return Number(data.price);
                }
            }
        } catch (e) {
            console.warn('[create-order] Could not fetch custom price from Firestore:', e && e.message);
        }
    }
    if (sku.startsWith('MVnHs-') || sku === 'FRAME_11X14') {
        return defaultTshirtPrice;
    }
    return null;
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return json(405, { error: 'Method not allowed' });
    }

    let body;
    try { body = JSON.parse(event.body || '{}'); }
    catch (e) { return json(400, { error: 'Invalid JSON body' }); }

    const { sku, email, artId, artName, printUrl, clerkUserId } = body;

    const priceInr = await getPriceForSku(sku, artId);
    if (!sku || !priceInr) {
        return json(400, { error: 'Unknown or unavailable product' });
    }
    if (!email || !EMAIL_RE.test(email)) {
        return json(400, { error: 'A valid email is required' });
    }
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        return json(500, { error: 'Payments are not configured on the server' });
    }

    const razorpay = new Razorpay({
        key_id:     process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
    });

    try {
        const order = await razorpay.orders.create({
            amount:   Math.round(priceInr * 100),   // paise
            currency: 'INR',
            receipt:  `art_${String(artId || 'x').slice(0, 20)}_${Date.now()}`,
            notes: {
                sku,
                email,
                artId:       artId    || '',
                artName:     String(artName || '').slice(0, 120),
                printUrl:    printUrl || '',
                clerkUserId: clerkUserId || ''
            }
        });

        return json(200, {
            orderId:  order.id,
            amount:   order.amount,                 // paise, echoed from Razorpay
            currency: order.currency,
            keyId:    process.env.RAZORPAY_KEY_ID    // public key id — safe for browser
        });
    } catch (err) {
        console.error('[create-order] Razorpay error:', err && err.message);
        return json(502, { error: 'Could not create payment order' });
    }
};

function json(statusCode, obj) {
    return {
        statusCode,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(obj)
    };
}