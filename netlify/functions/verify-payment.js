// ─────────────────────────────────────────────────────────────────────────────
// netlify/functions/verify-payment.js
//
// Stage 7 — Verifies a Razorpay payment SERVER-SIDE, then records the order.
//
// Flow:
//   1) Recompute HMAC_SHA256(order_id + "|" + payment_id) with the key secret
//      and constant-time compare it to razorpay_signature. If it doesn't match,
//      the "success" is fake -> reject.
//   2) Fetch the order from Razorpay for AUTHORITATIVE details (amount + notes:
//      email/sku/artId/printUrl) — never trust the browser for these.
//   3) Write the order to Firestore (idempotent by payment id) and increment
//      the live "totalOrders" metric.
//
//   POST /api/verify-payment
//   body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
//   200 : { ok: true, orderId, paymentId }
// ─────────────────────────────────────────────────────────────────────────────

const crypto = require('crypto');
const Razorpay = require('razorpay');
const { admin, db } = require('./_firebaseAdmin');
const { submitToQikink } = require('./_qikink');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return json(405, { error: 'Method not allowed' });
    }

    let body;
    try { body = JSON.parse(event.body || '{}'); }
    catch (e) { return json(400, { error: 'Invalid JSON body' }); }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return json(400, { error: 'Missing payment fields' });
    }
    if (!process.env.RAZORPAY_KEY_SECRET || !process.env.RAZORPAY_KEY_ID) {
        return json(500, { error: 'Payments are not configured on the server' });
    }

    // 1) Verify signature (constant-time compare)
    const expected = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

    const a = Buffer.from(expected);
    const b = Buffer.from(String(razorpay_signature));
    const valid = a.length === b.length && crypto.timingSafeEqual(a, b);
    if (!valid) {
        return json(400, { error: 'Payment signature verification failed' });
    }

    // 2) Authoritative order details from Razorpay
    const razorpay = new Razorpay({
        key_id:     process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
    });
    let order;
    try { order = await razorpay.orders.fetch(razorpay_order_id); }
    catch (e) {
        console.error('[verify-payment] order fetch:', e && e.message);
        return json(502, { error: 'Could not confirm order with Razorpay' });
    }
    const notes = order.notes || {};

    // 3) Persist order (idempotent) + bump live metric
    try {
        const ref = db.collection('orders').doc(razorpay_payment_id);
        const existing = await ref.get();

        if (!existing.exists) {
            let shipping = {};
            const clerkUserId = notes.clerkUserId || '';
            if (clerkUserId) {
                try {
                    const udoc = await db.collection('users').doc(clerkUserId).get();
                    if (udoc.exists) shipping = udoc.data();
                } catch (e) {
                    console.error('[verify-payment] shipping fetch failed:', e);
                }
            }

            await ref.set({
                status:      'paid',
                source:      'client-verify',
                paymentId:   razorpay_payment_id,
                orderId:     razorpay_order_id,
                amount:      order.amount,        // paise
                currency:    order.currency,
                email:       notes.email    || '',
                clerkUserId,
                shipping,
                sku:         notes.sku      || '',
                artId:       notes.artId    || '',
                artName:     notes.artName  || '',
                printUrl:    notes.printUrl || '',
                fulfillment: 'pending',
                createdAt:   admin.firestore.FieldValue.serverTimestamp()
            });

            await db.collection('stats').doc('metrics').set(
                { totalOrders: admin.firestore.FieldValue.increment(1) },
                { merge: true }
            );

            // Stage 9 — Hand off to QikInk for printing and shipping.
            // Runs AFTER the Firestore write so the order is never lost even if
            // QikInk is temporarily unavailable. Failure is logged but does NOT
            // cause this endpoint to return an error (the payment is already verified).
            try {
                const { qikinkOrderId } = await submitToQikink({
                    orderNumber: razorpay_payment_id,
                    printUrl:    notes.printUrl || '',
                    email:       notes.email    || '',
                    amountInr:   Math.round((order.amount || 0) / 100),  // paise -> INR
                    shipping,
                    sku:         notes.sku      || ''
                });
                await ref.update({
                    fulfillment:       'submitted',
                    qikinkOrderId:     qikinkOrderId,
                    qikinkSubmittedAt: admin.firestore.FieldValue.serverTimestamp()
                });
                console.log(`[verify-payment] QikInk order created: ${qikinkOrderId}`);
            } catch (qErr) {
                console.error('[verify-payment] QikInk submission failed:', qErr && qErr.message);
                await ref.update({
                    fulfillment: 'submit_failed',
                    qikinkError: String(qErr && qErr.message)
                });
            }
        } else {
            // Order already exists (webhook fired first). Attempt QikInk only if not yet submitted.
            const snap = existing.data();
            if (!snap.qikinkOrderId && snap.printUrl) {
                try {
                    const { qikinkOrderId } = await submitToQikink({
                        orderNumber: razorpay_payment_id,
                        printUrl:    snap.printUrl,
                        email:       snap.email || '',
                        amountInr:   Math.round((snap.amount || 0) / 100),
                        shipping:    snap.shipping || {},
                        sku:         snap.sku || ''
                    });
                    await ref.update({
                        fulfillment:       'submitted',
                        qikinkOrderId:     qikinkOrderId,
                        qikinkSubmittedAt: admin.firestore.FieldValue.serverTimestamp()
                    });
                    console.log(`[verify-payment] QikInk order created (late): ${qikinkOrderId}`);
                } catch (qErr) {
                    console.error('[verify-payment] QikInk submission failed (late):', qErr && qErr.message);
                    await ref.update({
                        fulfillment: 'submit_failed',
                        qikinkError: String(qErr && qErr.message)
                    });
                }
            }
        }
    } catch (e) {
        console.error('[verify-payment] firestore write:', e && e.message);
        return json(500, { error: 'Payment verified but the order could not be saved' });
    }

    return json(200, { ok: true, orderId: razorpay_order_id, paymentId: razorpay_payment_id });
};

function json(statusCode, obj) {
    return {
        statusCode,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(obj)
    };
}
