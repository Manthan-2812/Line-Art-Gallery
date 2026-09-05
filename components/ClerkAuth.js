// ─────────────────────────────────────────────────────────────────────────────
// components/ClerkAuth.js
//
// <ClerkAuthButton /> — customer authentication control for the navbar.
//   • Signed OUT → "Sign In" + "Sign Up" buttons that open Clerk modals.
//   • Signed IN  → Clerk's UserButton avatar (account menu + sign out).
//
// Relies on window.__clerkReady (see utils/clerk-config.js). Themed globally via
// window.CLERK_APPEARANCE, so modals + avatar match the dark gallery UI.
//
// This is CUSTOMER auth — completely independent of the admin login in auth.js.
// Exposes window.useClerkUser() helper hook for other components (Stage 3+).
// ─────────────────────────────────────────────────────────────────────────────

function ClerkAuthButton({ compact }) {
    const { useState, useEffect, useRef } = React;

    const [ready,    setReady]    = useState(false);
    const [signedIn, setSignedIn] = useState(false);
    const userBtnRef              = useRef(null);

    // Wait for Clerk to finish loading, then subscribe to auth-state changes.
    useEffect(() => {
        let unsub;
        if (!window.__clerkReady) return;
        window.__clerkReady
            .then((clerk) => {
                setReady(true);
                const sync = () => setSignedIn(Boolean(clerk.user));
                sync();
                unsub = clerk.addListener(sync);
            })
            .catch(() => setReady(false));
        return () => { if (typeof unsub === 'function') unsub(); };
    }, []);

    // Mount / unmount Clerk's UserButton when signed-in state flips.
    useEffect(() => {
        if (!signedIn || !userBtnRef.current || !window.Clerk) return;
        const node = userBtnRef.current;
        window.Clerk.mountUserButton(node, {
            afterSignOutUrl: window.location.href,
            appearance: window.CLERK_APPEARANCE
        });
        return () => { try { window.Clerk.unmountUserButton(node); } catch (e) {} };
    }, [signedIn]);

    if (!ready) {
        // Neutral placeholder keeps navbar layout stable while Clerk loads.
        return <div className="w-16 h-8" aria-hidden="true" />;
    }

    if (signedIn) {
        return <div ref={userBtnRef} className="flex items-center" data-name="ClerkUserButton" />;
    }

    const openSignIn = () => window.Clerk && window.Clerk.openSignIn({ appearance: window.CLERK_APPEARANCE });
    const openSignUp = () => window.Clerk && window.Clerk.openSignUp({ appearance: window.CLERK_APPEARANCE });

    return (
        <div className="flex items-center gap-2" data-name="ClerkAuthButton">
            <button
                onClick={openSignIn}
                className="text-xs sm:text-sm font-semibold text-slate-200 hover:text-white border border-white/15 hover:border-white/30 rounded-lg px-2.5 sm:px-3 py-1.5 transition-all"
            >
                Sign In
            </button>
            {!compact && (
                <button
                    onClick={openSignUp}
                    className="text-xs sm:text-sm font-semibold text-white rounded-lg px-2.5 sm:px-3 py-1.5 transition-all"
                    style={{ background: 'linear-gradient(135deg,#06b6d4,#818cf8)' }}
                >
                    Sign Up
                </button>
            )}
        </div>
    );
}

// ── Shared helper hook: current Clerk user + loading flag (Stage 3+ use) ──────
// Usage:  const { user, isLoaded, isSignedIn } = window.useClerkUser();
window.useClerkUser = function useClerkUser() {
    const { useState, useEffect } = React;
    const [state, setState] = useState({ user: null, isLoaded: false, isSignedIn: false });

    useEffect(() => {
        let unsub;
        if (!window.__clerkReady) return;
        window.__clerkReady.then((clerk) => {
            const sync = () => setState({
                user:       clerk.user,
                isLoaded:   true,
                isSignedIn: Boolean(clerk.user)
            });
            sync();
            unsub = clerk.addListener(sync);
        });
        return () => { if (typeof unsub === 'function') unsub(); };
    }, []);

    return state;
};
