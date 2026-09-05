// ─────────────────────────────────────────────────────────────────────────────
// utils/clerk-config.js
//
// Loads Clerk (customer authentication) for the whole site. Plain <script> —
// runs immediately, defines globals, and injects the Clerk hotloading SDK.
//
//   • The PUBLISHABLE KEY is PUBLIC and safe to ship in the browser.
//   • Customer auth (Clerk) is SEPARATE from the existing admin login in
//     utils/auth.js — the two coexist and serve different roles.
//
// Exposes:
//   window.CLERK_PUBLISHABLE_KEY   — the pk_test_… key
//   window.CLERK_APPEARANCE        — dark/glassmorphic theme matching the site
//   window.__clerkReady            — Promise<Clerk> resolved after Clerk.load()
// ─────────────────────────────────────────────────────────────────────────────

// Publishable key (public by design — not a secret).
window.CLERK_PUBLISHABLE_KEY = 'pk_test_d2FybS1zcGlkZXItMTk1Ny5jbGVyay5hY2NvdW50cy5kZXYk';

// Frontend API host (decoded from the publishable key) — serves clerk.browser.js
const CLERK_FRONTEND_API = 'warm-spider-1957.clerk.accounts.dev';

// Dark / glassmorphic theme so Clerk's modals + user button match the gallery.
window.CLERK_APPEARANCE = {
    variables: {
        colorPrimary:         '#22d3ee',
        colorBackground:      '#0f172a',
        colorInputBackground: '#1e293b',
        colorInputText:       '#f1f5f9',
        colorText:            '#e2e8f0',
        colorTextSecondary:   '#94a3b8',
        colorDanger:          '#f87171',
        colorSuccess:         '#4ade80',
        borderRadius:         '0.75rem',
        fontFamily:           "'Segoe UI', system-ui, -apple-system, sans-serif"
    },
    elements: {
        card:                          'shadow-2xl border border-white/10',
        headerTitle:                   'text-white',
        socialButtonsBlockButton:      'border border-white/15 !text-white',
        socialButtonsBlockButtonText:  '!text-white'
    }
};

// Inject a stylesheet that forces Clerk's text to white across ALL components
// and scales/centers the sign-in / sign-up modal to a comfortable, spacious size.
(function injectClerkStyles() {
    if (document.getElementById('clerk-dark-overrides')) return;
    const css = `
        /* Centering & Enlarging Clerk Modal */
        .cl-modalBackdrop {
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            background-color: rgba(0, 0, 0, 0.8) !important;
            backdrop-filter: blur(8px) !important;
            z-index: 99999 !important;
        }
        .cl-modalContent {
            margin: auto !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
        }
        .cl-card {
            width: 100% !important;
            max-width: 480px !important;
            min-width: 380px !important;
            padding: 2.25rem !important;
            border-radius: 1.25rem !important;
            background: #0f172a !important;
            border: 1px solid rgba(255, 255, 255, 0.14) !important;
            box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.9), 0 0 30px rgba(34, 211, 238, 0.1) !important;
        }
        @media (max-width: 640px) {
            .cl-card {
                min-width: 90vw !important;
                padding: 1.5rem !important;
            }
        }
        .cl-headerTitle, .cl-formHeaderTitle {
            font-size: 1.45rem !important;
            font-weight: 800 !important;
            color: #ffffff !important;
            letter-spacing: -0.02em !important;
        }
        .cl-headerSubtitle, .cl-formHeaderSubtitle {
            font-size: 0.92rem !important;
            color: #94a3b8 !important;
            margin-top: 0.25rem !important;
        }
        .cl-formFieldInput {
            padding: 0.75rem 1rem !important;
            font-size: 0.95rem !important;
            background-color: #1e293b !important;
            border-color: #334155 !important;
            color: #f8fafc !important;
            border-radius: 0.65rem !important;
        }
        .cl-formFieldInput:focus {
            border-color: #22d3ee !important;
            box-shadow: 0 0 0 2px rgba(34, 211, 238, 0.25) !important;
        }
        .cl-formButtonPrimary {
            padding: 0.8rem 1.25rem !important;
            font-size: 0.95rem !important;
            font-weight: 700 !important;
            background: linear-gradient(135deg, #06b6d4, #6366f1) !important;
            border-radius: 0.65rem !important;
            box-shadow: 0 4px 14px rgba(6, 182, 212, 0.35) !important;
            transition: all 0.2s ease !important;
        }
        .cl-formButtonPrimary:hover {
            opacity: 0.95 !important;
            transform: translateY(-1px) !important;
        }
        .cl-socialButtonsBlockButton {
            padding: 0.75rem 1rem !important;
            border-radius: 0.65rem !important;
            border: 1px solid rgba(255, 255, 255, 0.15) !important;
            background: #1e293b !important;
        }
        .cl-socialButtonsBlockButton:hover {
            background: #334155 !important;
        }
        .cl-userButtonPopoverActionButton,
        .cl-userButtonPopoverActionButtonText,
        .cl-userButtonPopoverActionButtonIcon,
        .cl-userButtonPopoverActionButton svg,
        .cl-userPreviewMainIdentifier,
        .cl-userPreviewSecondaryIdentifier,
        .cl-socialButtonsBlockButton,
        .cl-socialButtonsBlockButtonText,
        .cl-formFieldLabel,
        .cl-footerActionText,
        .cl-dividerText,
        .cl-identityPreviewText,
        .cl-menuButton,
        .cl-menuItem {
            color: #f1f5f9 !important;
        }
        .cl-userButtonPopoverActionButtonIcon,
        .cl-userButtonPopoverActionButton svg {
            opacity: 0.9;
        }
    `;
    const style = document.createElement('style');
    style.id = 'clerk-dark-overrides';
    style.textContent = css;
    document.head.appendChild(style);
})();

// Inject the Clerk hotloading script (single source of truth = the key above).
(function injectClerkScript() {
    if (document.querySelector('script[data-clerk-publishable-key]')) return;
    const s = document.createElement('script');
    s.async = true;
    s.crossOrigin = 'anonymous';
    s.setAttribute('data-clerk-publishable-key', window.CLERK_PUBLISHABLE_KEY);
    s.src = `https://${CLERK_FRONTEND_API}/npm/@clerk/clerk-js@5/dist/clerk.browser.js`;
    s.type = 'text/javascript';
    document.head.appendChild(s);
})();

// Resolve once window.Clerk exists AND Clerk.load() has completed.
window.__clerkReady = new Promise((resolve, reject) => {
    let tries = 0;
    const boot = () => {
        if (window.Clerk && typeof window.Clerk.load === 'function') {
            window.Clerk
                .load({ appearance: window.CLERK_APPEARANCE })
                .then(() => resolve(window.Clerk))
                .catch((err) => { console.error('[Clerk] load() failed:', err); reject(err); });
        } else if (tries++ < 200) {          // ~10s max (200 × 50ms)
            setTimeout(boot, 50);
        } else {
            console.error('[Clerk] SDK failed to load within timeout.');
            reject(new Error('Clerk SDK load timeout'));
        }
    };
    boot();
});
