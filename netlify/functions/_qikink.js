// ─────────────────────────────────────────────────────────────────────────────
// netlify/functions/_qikink.js
//
// Stage 9 — QikInk fulfillment helper (on-the-fly artwork fulfillment).
//
// Flow:
//   1. Authenticate with QikInk (POST /api/token) -> get Accesstoken
//   2. Create order (POST /api/order/create) with line items + dynamic design links
// ─────────────────────────────────────────────────────────────────────────────

const https = require('https');
const http  = require('http');
const { URL } = require('url');

/**
 * Fetches a fresh QikInk access token.
 */
async function getQikinkToken() {
    const base     = process.env.QIKINK_BASE_URL || 'https://sandbox.qikink.com';
    const clientId = process.env.QIKINK_CLIENT_ID;
    const secret   = process.env.QIKINK_CLIENT_SECRET;

    if (!clientId || !secret) {
        throw new Error('QIKINK_CLIENT_ID or QIKINK_CLIENT_SECRET is not set');
    }

    const form = new URLSearchParams();
    form.append('ClientId', clientId);
    form.append('client_secret', secret);

    const data = await qikinkRequest(
        'POST',
        `${base}/api/token`,
        { 'Content-Type': 'application/x-www-form-urlencoded' },
        form.toString()
    );

    const token = data.Accesstoken || data.access_token || data.token;
    if (!token) {
        throw new Error(`QikInk token missing Accesstoken. Response: ${JSON.stringify(data)}`);
    }
    return token;
}

/**
 * Submits a print-and-ship order to QikInk.
 *
 * @param {object} opts
 * @param {string} opts.orderNumber  - Unique order reference (e.g. Razorpay paymentId, truncated <=15 chars)
 * @param {string} opts.printUrl     - Public Cloudinary URL of the print master
 * @param {string} opts.email        - Customer email
 * @param {number} opts.amountInr    - Amount charged in INR
 * @param {object} opts.shipping     - { fullName, phone, address1, address2, city, state, pincode }
 *
 * @returns {Promise<{ qikinkOrderId: string }>}
 */
async function submitToQikink({ orderNumber, printUrl, email, amountInr, shipping, sku: itemSku }) {
    const base      = process.env.QIKINK_BASE_URL || 'https://sandbox.qikink.com';
    const clientId  = process.env.QIKINK_CLIENT_ID;
    const token     = await getQikinkToken();
    const sh        = shipping || {};

    const sku         = itemSku || process.env.QIKINK_SKU || 'MVnHs-Wh-M';
    const printTypeId = Number(process.env.QIKINK_PRINT_TYPE_ID || 1);

    // QikInk order_number max length is 15 chars
    const safeOrderNo = String(orderNumber || 'ORD' + Date.now()).replace(/[^a-zA-Z0-9_]/g, '').slice(0, 15);
    const designCode  = 'ART_' + Date.now().toString().slice(-8);

    // Parse customer name
    const fullName  = (sh.fullName || 'Customer').trim();
    const nameParts = fullName.split(/\s+/);
    const firstName = nameParts[0] || 'Customer';
    const lastName  = nameParts.slice(1).join(' ') || '.';

    const payload = JSON.stringify({
        order_number:      safeOrderNo,
        qikink_shipping:   '1',
        gateway:           'Prepaid',
        total_order_value: String(amountInr || 900),

        line_items: [
            {
                search_from_my_products: 0,
                sku:           sku,
                quantity:      '1',
                price:         String(amountInr || 900),
                print_type_id: printTypeId,
                designs: [
                    {
                        design_code:   designCode,
                        width_inches:  '11',
                        height_inches: '14',
                        placement_sku: 'fr',
                        design_link:   printUrl,
                        mockup_link:   printUrl
                    }
                ]
            }
        ],

        shipping_address: {
            first_name:   firstName,
            last_name:    lastName,
            address1:     sh.address1 || '',
            address2:     sh.address2 || '',
            phone:        sh.phone    || '',
            email:        email       || '',
            city:         sh.city     || '',
            zip:          String(sh.pincode || ''),
            province:     sh.state    || '',
            country_code: 'IN'
        }
    });

    const headers = {
        'Content-Type':   'application/json',
        'ClientId':       clientId,
        'Accesstoken':    token
    };

    const data = await qikinkRequest('POST', `${base}/api/order/create`, headers, payload);

    const qikinkOrderId = data.order_id || data.id || data.orderId || null;
    if (!qikinkOrderId) {
        throw new Error(`QikInk order create failed: ${JSON.stringify(data)}`);
    }
    return { qikinkOrderId: String(qikinkOrderId) };
}

function qikinkRequest(method, urlStr, customHeaders, body) {
    return new Promise((resolve, reject) => {
        const parsed  = new URL(urlStr);
        const lib     = parsed.protocol === 'https:' ? https : http;
        const headers = Object.assign({}, customHeaders || {});

        if (body) {
            headers['Content-Length'] = Buffer.byteLength(body);
        }

        const req = lib.request(
            {
                hostname: parsed.hostname,
                port:     parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
                path:     parsed.pathname + (parsed.search || ''),
                method,
                headers
            },
            (res) => {
                let raw = '';
                res.on('data', (chunk) => { raw += chunk; });
                res.on('end', () => {
                    try {
                        const json = JSON.parse(raw);
                        if (res.statusCode >= 400) {
                            reject(new Error(`QikInk API error (${res.statusCode}): ${json.error || raw}`));
                        } else {
                            resolve(json);
                        }
                    } catch (e) {
                        reject(new Error(`QikInk non-JSON response (${res.statusCode}): ${raw.slice(0, 300)}`));
                    }
                });
            }
        );
        req.on('error', reject);
        if (body) req.write(body);
        req.end();
    });
}

module.exports = { submitToQikink };
