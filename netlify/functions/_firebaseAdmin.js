// ─────────────────────────────────────────────────────────────────────────────
// netlify/functions/_firebaseAdmin.js
//
// Shared Firebase Admin SDK init for serverless functions. Uses a service
// account (server-only credentials) so writes are trusted and bypass the
// public client security rules. Reused by verify-payment, the webhook, and
// later fulfilment stages.
// ─────────────────────────────────────────────────────────────────────────────

const admin = require('firebase-admin');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId:   process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            // Netlify stores the key as one line with literal "\n" — restore newlines.
            privateKey:  (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n')
        })
    });
}

module.exports = { admin, db: admin.firestore() };
