// ─────────────────────────────────────────────────────────────────────────────
// netlify/edge-functions/ip-blocker.js
//
// Edge function that blocks suspicious IP addresses/ranges at the CDN edge,
// BEFORE any page or API request reaches your site.
//
// To add more blocked IPs: add them to the BLOCKED_IPS or BLOCKED_RANGES array.
// ─────────────────────────────────────────────────────────────────────────────

// Exact IPs to block
const BLOCKED_IPS = [
    '37.19.221.234',
    '37.19.221.233',
];

// IP prefix ranges to block (blocks all IPs starting with this prefix)
const BLOCKED_RANGES = [
    '37.19.221.',    // Entire 37.19.221.0/24 subnet (Houston VPN/proxy)
];

export default async (request, context) => {
    const ip = context.ip || request.headers.get('x-nf-client-connection-ip') || '';

    // Check exact IP match
    if (BLOCKED_IPS.includes(ip)) {
        return new Response('Access Denied', { status: 403 });
    }

    // Check range/prefix match
    for (const prefix of BLOCKED_RANGES) {
        if (ip.startsWith(prefix)) {
            return new Response('Access Denied', { status: 403 });
        }
    }

    // Allow request to proceed normally
    return context.next();
};

export const config = {
    path: "/*",   // Runs on ALL requests (pages + API)
};
