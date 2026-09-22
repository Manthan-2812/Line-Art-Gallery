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
const { checkRateLimit, secureJson } = require('./_security');

// Server-side source of truth for prices (INR). Client prices are NOT trusted.
const defaultTshirtPrice = Number(process.env.PRICE_TSHIRT || process.env.PRICE_FRAME_11X14 || 900);

async function getPriceForSku(sku, artId, printSide) {
    if (!sku || typeof sku !== 'string') return null;
    let basePrice = defaultTshirtPrice;
    let navyOffset = 50;
    let royalBlueOffset = 50;
    let redOffset = 50;

    if (artId) {
        try {
            const doc = await db.collection('images').doc(String(artId)).get();
            if (doc.exists) {
                const data = doc.data() || {};
                if (data.price && !isNaN(Number(data.price)) && Number(data.price) > 0) {
                    basePrice = Number(data.price);
                }
                const legacy = (data.blueOffset !== undefined && !isNaN(Number(data.blueOffset))) ? Number(data.blueOffset) : 50;
                navyOffset = (data.navyOffset !== undefined && !isNaN(Number(data.navyOffset))) ? Number(data.navyOffset) : legacy;
                royalBlueOffset = (data.royalBlueOffset !== undefined && !isNaN(Number(data.royalBlueOffset))) ? Number(data.royalBlueOffset) : legacy;
                redOffset = (data.redOffset !== undefined && !isNaN(Number(data.redOffset))) ? Number(data.redOffset) : legacy;
            }
        } catch (e) {
            console.warn('[create-order] Could not fetch custom price from Firestore:', e && e.message);
        }
    }

    const skuUpper = sku.toUpperCase();
    let colorOffset = 0;
    if (skuUpper.includes('-NB-') || skuUpper.startsWith('MVNHS-NB')) {
        colorOffset = navyOffset;
    } else if (skuUpper.includes('-RB-') || skuUpper.startsWith('MVNHS-RB')) {
        colorOffset = royalBlueOffset;
    } else if (skuUpper.includes('-RD-') || skuUpper.startsWith('MVNHS-RD')) {
        colorOffset = redOffset;
    }

    const printOffset = printSide === 'both' ? 200 : 0;

    if (sku.startsWith('MVnHs-') || sku === 'FRAME_11X14') {
        return basePrice + colorOffset + printOffset;
    }
    return null;
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return secureJson(405, { error: 'Method not allowed' });
    }

    if (!checkRateLimit(event, 40, 60000)) {
        return secureJson(429, { error: 'Too many order attempts. Please slow down.' });
    }

    let body;
    try { body = JSON.parse(event.body || '{}'); }
    catch (e) { return secureJson(400, { error: 'Invalid JSON body' }); }

    const { sku, email, artId, artName, printUrl, clerkUserId, printSide } = body;
    const rawQty = parseInt(body.quantity, 10);
    const quantity = (!isNaN(rawQty) && rawQty >= 1) ? Math.floor(rawQty) : 1;
    const chosenPrintSide = printSide === 'both' ? 'both' : 'front';

    const unitPriceInr = await getPriceForSku(sku, artId, chosenPrintSide);
    if (!sku || !unitPriceInr) {
        return secureJson(400, { error: 'Unknown or unavailable product' });
    }
    if (!email || !EMAIL_RE.test(email)) {
        return secureJson(400, { error: 'A valid email is required' });
    }
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        return secureJson(500, { error: 'Payments are not configured on the server' });
    }

    const totalAmountInr = unitPriceInr * quantity;

    const razorpay = new Razorpay({
        key_id:     process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
    });

    let resolvedPrintUrl = printUrl || '';
    if (artId) {
        try {
            const artDoc = await db.collection('images').doc(String(artId)).get();
            if (artDoc.exists) {
                const artData = artDoc.data() || {};
                resolvedPrintUrl = artData.printUrl || artData.printMasterUrl || resolvedPrintUrl || artData.url || artData.imageUrl || '';
            }
        } catch (e) {
            console.warn('[create-order] Could not fetch artDoc for printUrl:', e && e.message);
        }
    }

    try {
        const order = await razorpay.orders.create({
            amount:   Math.round(totalAmountInr * 100),   // paise
            currency: 'INR',
            receipt:  `art_${String(artId || 'x').slice(0, 20)}_${Date.now()}`,
            notes: {
                sku,
                email,
                artId:       artId    || '',
                artName:     String(artName || '').slice(0, 120),
                printUrl:    resolvedPrintUrl || '',
                clerkUserId: clerkUserId || '',
                quantity:    String(quantity),
                unitPrice:   String(unitPriceInr),
                printSide:   chosenPrintSide
            }
        });

        return secureJson(200, {
            orderId:   order.id,
            amount:    order.amount,                 // paise, echoed from Razorpay
            currency:  order.currency,
            keyId:     process.env.RAZORPAY_KEY_ID,  // public key id — safe for browser
            quantity:  quantity,
            unitPrice: unitPriceInr,
            printSide: chosenPrintSide
        });
    } catch (err) {
        console.error('[create-order] Razorpay error:', err && err.message);
        return secureJson(502, { error: 'Could not create payment order' });
    }
};