// ─────────────────────────────────────────────────────────────────────────────
// netlify/functions/razorpay-webhook.js
//
// Stage 8 — Razorpay webhook receiver (server-to-server order confirmation).
//
// Razorpay calls this endpoint directly when a payment is captured, so the
// order is recorded even if the customer closed the browser before the
// client-side verify ran. This is the AUTHORITATIVE, reliable confirmation.
//
// Security: the raw request body is HMAC-verified against RAZORPAY_WEBHOOK_SECRET
// (the "Secret" you set in the Razorpay Webhook Setup dialog). Requests that
// don't match are rejected.
//
// Idempotent: orders are keyed by payment id, so the webhook and the client
// verify can both fire without creating duplicates or double-counting metrics.
//
//   POST /api/razorpay-webhook   (subscribe to the "payment.captured" event)
// ─────────────────────────────────────────────────────────────────────────────

const crypto = require('crypto');
const Razorpay = require('razorpay');
const { admin, db } = require('./_firebaseAdmin');
const { submitToQikink } = require('./_qikink');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return json(405, { error: 'Method not allowed' });
    }

    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) {
        return json(500, { error: 'Webhook not configured' });
    }

    // Use the RAW body exactly as received — re-serializing would break the HMAC.
    const raw = event.isBase64Encoded
        ? Buffer.from(event.body || '', 'base64').toString('utf8')
        : (event.body || '');

    // Netlify lower-cases header keys, but accept either just in case.
    const headers = event.headers || {};
    const signature = headers['x-razorpay-signature'] || headers['X-Razorpay-Signature'];
    if (!signature) {
        return json(400, { error: 'Missing signature header' });
    }

    // Verify webhook signature (constant-time compare)
    const expected = crypto.createHmac('sha256', secret).update(raw).digest('hex');
    const a = Buffer.from(expected);
    const b = Buffer.from(String(signature));
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
        return json(400, { error: 'Invalid webhook signature' });
    }

    let payload;
    try { payload = JSON.parse(raw); }
    catch (e) { return json(400, { error: 'Invalid JSON body' }); }

    // We only act on successful captures. Acknowledge everything else with 200
    // so Razorpay doesn't keep retrying events we intentionally ignore.
    if (payload.event !== 'payment.captured') {
        return json(200, { ok: true, ignored: payload.event });
    }

    const payment = payload.payload
        && payload.payload.payment
        && payload.payload.payment.entity;
    if (!payment || !payment.id) {
        return json(200, { ok: true, ignored: 'no-payment-entity' });
    }

    const paymentId = payment.id;
    const orderId   = payment.order_id;

    // Notes were set at ORDER creation; the payment entity may not carry them,
    // so fetch the order for authoritative details when they're missing.
    let notes = payment.notes || {};
    if ((!notes.email || !notes.sku) && orderId && process.env.RAZORPAY_KEY_ID) {
        try {
            const rzp = new Razorpay({
                key_id:     process.env.RAZORPAY_KEY_ID,
                key_secret: process.env.RAZORPAY_KEY_SECRET
            });
            const order = await rzp.orders.fetch(orderId);
            notes = Object.assign({}, order.notes || {}, notes);
        } catch (e) {
            console.error('[razorpay-webhook] order fetch:', e && e.message);
        }
    }

    try {
        const ref = db.collection('orders').doc(paymentId);
        const existing = await ref.get();

        if (!existing.exists) {
            const printUrl = notes.printUrl || '';
            const email    = notes.email || payment.email || '';
            const clerkUserId = notes.clerkUserId || '';

            let shipping = {};
            if (clerkUserId) {
                try {
                    const udoc = await db.collection('users').doc(clerkUserId).get();
                    if (udoc.exists) shipping = udoc.data();
                } catch (e) {
                    console.error('[razorpay-webhook] shipping fetch failed:', e);
                }
            }

            await ref.set({
                status:      'paid',
                source:      'webhook',
                paymentId,
                orderId,
                amount:      payment.amount,      // paise
                currency:    payment.currency,
                email,
                clerkUserId,
                shipping,
                sku:         notes.sku      || '',
                artId:       notes.artId    || '',
                artName:     notes.artName  || '',
                printUrl,
                fulfillment: 'pending',
                createdAt:   admin.firestore.FieldValue.serverTimestamp()
            });

            await db.collection('stats').doc('metrics').set(
                { totalOrders: admin.firestore.FieldValue.increment(1) },
                { merge: true }
            );

            // Stage 9 — Submit to QikInk for print and ship.
            // Non-fatal: payment and order are already recorded. QikInk failure
            // leaves fulfillment:'pending' for manual retry.
            try {
                const { qikinkOrderId } = await submitToQikink({
                    orderNumber: paymentId,
                    printUrl,
                    email,
                    amountInr:   Math.round((payment.amount || 0) / 100),  // paise -> INR
                    shipping,
                    sku:         notes.sku || ''
                });
                await ref.update({
                    fulfillment:       'submitted',
                    qikinkOrderId:     qikinkOrderId,
                    qikinkSubmittedAt: admin.firestore.FieldValue.serverTimestamp()
                });
                console.log(`[razorpay-webhook] QikInk order created: ${qikinkOrderId}`);
            } catch (qErr) {
                console.error('[razorpay-webhook] QikInk submission failed:', qErr && qErr.message);
                await ref.update({
                    fulfillment: 'submit_failed',
                    qikinkError: String(qErr && qErr.message)
                });
            }
        } else {
            // Order already exists (client-verify fired first). Attempt QikInk only if not yet submitted.
            const snap = existing.data();
            if (!snap.qikinkOrderId && snap.printUrl) {
                try {
                    const { qikinkOrderId } = await submitToQikink({
                        orderNumber: paymentId,
                        printUrl:    snap.printUrl,
                        email:       snap.email || '',
                        amountInr:   Math.round((snap.amount || 0) / 100),
                        shipping:    snap.shipping || {}
                    });
                    await ref.update({
                        fulfillment:       'submitted',
                        qikinkOrderId:     qikinkOrderId,
                        qikinkSubmittedAt: admin.firestore.FieldValue.serverTimestamp()
                    });
                    console.log(`[razorpay-webhook] QikInk order created (late): ${qikinkOrderId}`);
                } catch (qErr) {
                    console.error('[razorpay-webhook] QikInk submission failed (late):', qErr && qErr.message);
                    await ref.update({
                        fulfillment: 'submit_failed',
                        qikinkError: String(qErr && qErr.message)
                    });
                }
            }
        }
    } catch (e) {
        console.error('[razorpay-webhook] firestore write:', e && e.message);
        return json(500, { error: 'Order persist failed' });
    }

    return json(200, { ok: true });
};

function json(statusCode, obj) {
    return {
        statusCode,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(obj)
    };
}
