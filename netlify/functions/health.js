// ─────────────────────────────────────────────────────────────────────────────
// netlify/functions/health.js
//
// Stage 1 smoke-test function. Confirms the serverless backend is wired up and
// reachable. Reports which environment variables are PRESENT (never their
// values) so we can verify configuration without leaking secrets.
//
//   Local:  http://localhost:8888/.netlify/functions/health   (or /api/health)
//   Prod:   https://<site>.netlify.app/.netlify/functions/health
// ─────────────────────────────────────────────────────────────────────────────

exports.handler = async () => {
    // Report only presence (true/false), never the actual secret values.
    const envPresence = {
        CLERK_PUBLISHABLE_KEY:  Boolean(process.env.CLERK_PUBLISHABLE_KEY),
        CLERK_SECRET_KEY:       Boolean(process.env.CLERK_SECRET_KEY),
        RAZORPAY_KEY_ID:        Boolean(process.env.RAZORPAY_KEY_ID),
        RAZORPAY_KEY_SECRET:    Boolean(process.env.RAZORPAY_KEY_SECRET),
        RAZORPAY_WEBHOOK_SECRET:Boolean(process.env.RAZORPAY_WEBHOOK_SECRET),
        QIKINK_CLIENT_ID:       Boolean(process.env.QIKINK_CLIENT_ID),
        QIKINK_CLIENT_SECRET:   Boolean(process.env.QIKINK_CLIENT_SECRET),
        QIKINK_BASE_URL:        Boolean(process.env.QIKINK_BASE_URL),
        PRICE_FRAME_11X14:      Boolean(process.env.PRICE_FRAME_11X14),
        FIREBASE_PROJECT_ID:    Boolean(process.env.FIREBASE_PROJECT_ID),
        FIREBASE_CLIENT_EMAIL:  Boolean(process.env.FIREBASE_CLIENT_EMAIL),
        FIREBASE_PRIVATE_KEY:   Boolean(process.env.FIREBASE_PRIVATE_KEY),
        ADMIN_EMAIL:            Boolean(process.env.ADMIN_EMAIL)
    };

    return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            ok:       true,
            service:  'line-and-layer-functions',
            stage:    1,
            time:     new Date().toISOString(),
            node:     process.version,
            envConfigured: envPresence
        }, null, 2)
    };
};
