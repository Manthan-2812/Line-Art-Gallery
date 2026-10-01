const fs = require('fs');
const path = require('path');

// 1. Load .env file
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8').split('\n');
    envConfig.forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            const val = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
            if (key) process.env[key] = val;
        }
    });
}

const { db, admin } = require('../netlify/functions/_firebaseAdmin');
const { submitToQikink } = require('../netlify/functions/_qikink');

async function retryStuckOrder() {
    const paymentId = 'pay_TiiHSYmufVtk6B';
    console.log(`Retrying stuck order for paymentId: ${paymentId}...`);

    const ref = db.collection('orders').doc(paymentId);
    const doc = await ref.get();

    if (!doc.exists) {
        console.error('Order document not found in Firestore!');
        process.exit(1);
    }

    const orderData = doc.data();
    console.log('Order data retrieved from Firestore:');
    console.log(`- Art Name: ${orderData.artName}`);
    console.log(`- Customer: ${orderData.email}`);
    console.log(`- Amount: ₹${orderData.amount / 100}`);
    console.log(`- Fulfillment status: ${orderData.fulfillment}`);
    console.log(`- Previous Error: ${orderData.qikinkError}`);

    console.log('\nSubmitting to QikInk with updated design_code format...');

    try {
        const { qikinkOrderId } = await submitToQikink({
            orderNumber: paymentId,
            printUrl:    orderData.printUrl,
            email:       orderData.email || '',
            amountInr:   Math.round((orderData.amount || 0) / 100),
            shipping:    orderData.shipping || {},
            sku:         orderData.sku || 'MVnHs-Nb-M',
            quantity:    orderData.quantity || 1,
            printSide:   orderData.printSide || 'both',
            artName:     orderData.artName || 'Cute Little Krishna'
        });

        console.log('\nSUCCESS! QikInk Order Created Successfully:');
        console.log(`QikInk Order ID: ${qikinkOrderId}`);

        // Update Firestore Document
        await ref.update({
            fulfillment:       'submitted',
            qikinkOrderId:     qikinkOrderId,
            qikinkSubmittedAt: admin.firestore.FieldValue.serverTimestamp(),
            qikinkError:       admin.firestore.FieldValue.delete()
        });

        console.log('Firestore document updated with fulfillment = "submitted" and qikinkOrderId!');
    } catch (err) {
        console.error('\nFAILED to submit to QikInk:', err.message || err);
    }

    process.exit(0);
}

retryStuckOrder();
