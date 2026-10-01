const fs = require('fs');

if (fs.existsSync('.env')) {
    const envContent = fs.readFileSync('.env', 'utf8');
    envContent.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
            const idx = trimmed.indexOf('=');
            if (idx > 0) {
                const k = trimmed.slice(0, idx).trim();
                const v = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');
                process.env[k] = v;
            }
        }
    });
}

const https = require('https');

async function testQikink(payload) {
    const base = process.env.QIKINK_BASE_URL || 'https://sandbox.qikink.com';
    const clientId = process.env.QIKINK_CLIENT_ID;
    const secret = process.env.QIKINK_CLIENT_SECRET;

    const form = new URLSearchParams();
    form.append('ClientId', clientId);
    form.append('client_secret', secret);

    const tokenRes = await new Promise((resolve, reject) => {
        const req = https.request(`${base}/api/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        }, res => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
        });
        req.on('error', reject);
        req.write(form.toString());
        req.end();
    });

    const token = tokenRes.Accesstoken || tokenRes.access_token || tokenRes.token;

    const body = JSON.stringify(payload);
    return new Promise((resolve, reject) => {
        const req = https.request(`${base}/api/order/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'ClientId': clientId,
                'Accesstoken': token,
                'Content-Length': Buffer.byteLength(body)
            }
        }, res => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, body: JSON.parse(data) });
                } catch(e) {
                    resolve({ status: res.statusCode, body: data });
                }
            });
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

async function verify() {
    // Test A: Having "company" in shipping_address
    const resA = await testQikink({
        order_number: 'TA' + Date.now().toString().slice(-8),
        qikink_shipping: '1',
        gateway: 'Prepaid',
        total_order_value: '900',
        line_items: [{
            search_from_my_products: 0,
            sku: 'MVnHs-Wh-M',
            quantity: '1',
            price: '900',
            print_type_id: 1,
            designs: [{
                design_code: 'ART_Test_A',
                width_inches: '11',
                height_inches: '14',
                placement_sku: 'fr',
                design_link: 'https://res.cloudinary.com/dd6s1dgx3/image/upload/sample.png',
                mockup_link: 'https://res.cloudinary.com/dd6s1dgx3/image/upload/sample.png'
            }]
        }],
        shipping_address: {
            first_name: 'Test',
            last_name: 'Customer',
            company: 'Line and Layer Gallery\nWebsite: line-art-gallery.netlify.app',
            address1: '123 Test Street',
            address2: '',
            phone: '9876543210',
            email: 'test@example.com',
            city: 'Mumbai',
            zip: '400001',
            province: 'Maharashtra',
            country_code: 'IN'
        }
    });

    console.log('Result A (with company field in shipping_address):', JSON.stringify(resA));

    // Test B: Having brand in address2 (which is printed on the physical courier label)
    const resB = await testQikink({
        order_number: 'TB' + Date.now().toString().slice(-8),
        qikink_shipping: '1',
        gateway: 'Prepaid',
        total_order_value: '900',
        line_items: [{
            search_from_my_products: 0,
            sku: 'MVnHs-Wh-M',
            quantity: '1',
            price: '900',
            print_type_id: 1,
            designs: [{
                design_code: 'ART_Test_B',
                width_inches: '11',
                height_inches: '14',
                placement_sku: 'fr',
                design_link: 'https://res.cloudinary.com/dd6s1dgx3/image/upload/sample.png',
                mockup_link: 'https://res.cloudinary.com/dd6s1dgx3/image/upload/sample.png'
            }]
        }],
        shipping_address: {
            first_name: 'Test',
            last_name: 'Customer',
            address1: '123 Test Street',
            address2: 'Line and Layer Gallery (line-art-gallery.netlify.app)',
            phone: '9876543210',
            email: 'test@example.com',
            city: 'Mumbai',
            zip: '400001',
            province: 'Maharashtra',
            country_code: 'IN'
        }
    });

    console.log('Result B (brand in address2 - printed on label):', JSON.stringify(resB));
}

verify();
