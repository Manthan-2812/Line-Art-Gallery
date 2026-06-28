// ─────────────────────────────────────────────────────────────────────────────
// utils/auth.js  –  JWT-style Admin Authentication (frontend simulation)
//
// HOW IT WORKS:
//   loginAdmin()  → validates hardcoded credentials, then creates and stores
//                   a pseudo-JWT (base64url header + payload + signature).
//   checkIsAdmin() → decodes the stored token, verifies the role field and
//                   checks the exp timestamp.  Clears expired tokens.
//   logoutAdmin()  → removes the token from localStorage.
//   getAdminToken()→ returns the raw token string for future API Authorization
//                   headers when you wire this to a real backend.
//
// TO CONNECT A REAL BACKEND:
//   Replace loginAdmin() body with a fetch('/api/login', ...) call that returns
//   a real JWT, and replace checkIsAdmin() with a token-validity endpoint call.
// ─────────────────────────────────────────────────────────────────────────────

const ADMIN_EMAIL = 'manthanparekh9d@gmail.com';
const ADMIN_PASS  = 'Mntp@2876';
const TOKEN_KEY   = 'lnl_admin_jwt';
const _SECRET     = 'LnL_S3cr3t_K3y_2025';  // pseudo-sign secret

// Safe base64url encode (works in all browsers)
const _b64url = (str) =>
    btoa(unescape(encodeURIComponent(str)))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

// Build 3-part pseudo-JWT:  header.payload.signature
const _makeToken = (email) => {
    const h = _b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const p = _b64url(JSON.stringify({
        sub:  email,
        role: 'admin',
        iat:  Date.now(),
        exp:  Date.now() + 86400000   // 24 hours
    }));
    const s = _b64url(`${h}.${p}.${_SECRET}`);
    return `${h}.${p}.${s}`;
};

// Decode payload section of the pseudo-JWT
const _decodePayload = (token) => {
    try {
        const part = token.split('.')[1]
            .replace(/-/g, '+').replace(/_/g, '/');
        return JSON.parse(decodeURIComponent(escape(atob(part))));
    } catch (_) {
        return null;
    }
};

// ── Public API ────────────────────────────────────────────────────────────────

/** Returns true when a valid, non-expired admin token is in localStorage */
const checkIsAdmin = () => {
    const tok = localStorage.getItem(TOKEN_KEY);
    if (!tok) return false;
    const payload = _decodePayload(tok);
    if (!payload || payload.role !== 'admin') return false;
    if (payload.exp < Date.now()) {
        localStorage.removeItem(TOKEN_KEY);  // auto-clear expired tokens
        return false;
    }
    return true;
};

/** Validates credentials → stores pseudo-JWT → returns true on success */
const loginAdmin = (email, password) => {
    if (email === ADMIN_EMAIL && password === ADMIN_PASS) {
        localStorage.setItem(TOKEN_KEY, _makeToken(email));
        return true;
    }
    return false;
};

/** Removes the admin token from localStorage */
const logoutAdmin = () => localStorage.removeItem(TOKEN_KEY);

/** Returns the raw token string (attach as Bearer token in future API calls) */
const getAdminToken = () => localStorage.getItem(TOKEN_KEY);