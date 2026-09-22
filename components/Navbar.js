// ─────────────────────────────────────────────────────────────────────────────
// components/Navbar.js
//
// Fixed top navbar with responsive mobile dropdown (hamburger menu)
// Supports: Brand, About Artist, Contact for Query (logged-in), My Orders, Address, PWA install.
// ─────────────────────────────────────────────────────────────────────────────

const ADMIN_EMAILS = [
    'manthanparekh9d@gmail.com',
    'lineartgallery28@gmail.com'
];

function Navbar({ onAboutClick, onBrandClick }) {
    const { useState, useEffect, useRef } = React;
    const userState = window.useClerkUser ? window.useClerkUser() : { isSignedIn: false, user: null };
    const isSignedIn = userState.isSignedIn;
    const user = userState.user;

    const [showAddress, setShowAddress]       = useState(false);
    const [showOrders,  setShowOrders]        = useState(false);
    const [showContact, setShowContact]       = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [addressData, setAddressData]       = useState(null);
    const [installPrompt, setInstallPrompt]   = useState(null);
    const [isAppInstalled, setIsAppInstalled] = useState(() => {
        return (
            (typeof window !== 'undefined' && (
                window.matchMedia('(display-mode: standalone)').matches || 
                window.navigator.standalone === true ||
                localStorage.getItem('pwa_app_installed') === 'true'
            ))
        );
    });

    const menuRef = useRef(null);

    // Close mobile dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setMobileMenuOpen(false);
            }
        };
        if (mobileMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('touchstart', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [mobileMenuOpen]);

    // Capture install prompt for the navbar install button & detect appinstalled
    useEffect(() => {
        const handler = (e) => {
            if (e && e.preventDefault) e.preventDefault();
            const promptEvent = e.detail || e;
            setInstallPrompt(promptEvent);
            window.__deferredPwaPrompt = promptEvent;
        };
        const onInstalled = () => {
            setIsAppInstalled(true);
            localStorage.setItem('pwa_app_installed', 'true');
            setInstallPrompt(null);
            window.__deferredPwaPrompt = null;
        };

        window.addEventListener('beforeinstallprompt', handler);
        window.addEventListener('pwa-prompt-ready', handler);
        window.addEventListener('appinstalled', onInstalled);

        if (window.__deferredPwaPrompt) setInstallPrompt(window.__deferredPwaPrompt);
        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
            window.removeEventListener('pwa-prompt-ready', handler);
            window.removeEventListener('appinstalled', onInstalled);
        };
    }, []);

    const triggerInstall = async () => {
        const isIos = /iPhone|iPad|iPod/i.test(navigator.userAgent) && !window.MSStream;
        if (isIos) {
            alert('To install Line & Layer App on iPhone/iPad:\n1. Tap the Share button at the bottom of Safari (box with arrow ↑)\n2. Scroll down and tap "Add to Home Screen" (+ icon)\n3. Tap "Add" in the top-right corner.');
            return;
        }

        const p = installPrompt || window.__deferredPwaPrompt;
        if (p && typeof p.prompt === 'function') {
            try {
                p.prompt();
                const { outcome } = await p.userChoice;
                if (outcome === 'accepted') {
                    setIsAppInstalled(true);
                    localStorage.setItem('pwa_app_installed', 'true');
                    setInstallPrompt(null);
                    window.__deferredPwaPrompt = null;
                }
            } catch (err) {
                console.warn('Install prompt error:', err);
            }
        } else {
            alert('To install on Android or Desktop:\nOpen your browser menu (⋮ or Share) and tap "Install app" or "Add to Home screen".');
        }
    };

    // Check if the current logged-in Clerk user is the admin
    const userEmails = user ? (user.emailAddresses || []).map(e => (e.emailAddress || '').toLowerCase()) : [];
    const isClerkAdmin = userEmails.some(e => ADMIN_EMAILS.includes(e));

    // Fetch user's address when they sign in
    useEffect(() => {
        if (isSignedIn && window.Clerk && window.Clerk.session) {
            window.Clerk.session.getToken().then(token => {
                fetch('/api/get-address', {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                .then(r => r.json())
                .then(d => { if (d.address) setAddressData(d.address); })
                .catch(e => console.error('Failed to load address', e));
            });
        }
    }, [isSignedIn]);

    const scrollToTop = () => {
        if (onBrandClick) { onBrandClick(); }
        else { window.scrollTo({ top: 0, behavior: 'smooth' }); }
    };

    return (
        <React.Fragment>
            <nav
                className="fixed top-0 left-0 w-full z-50 bg-slate-900/85 backdrop-blur-md border-b border-white/10 px-3 sm:px-6 py-3 flex justify-between items-center shadow-lg"
                data-name="Navbar"
            >
                {/* Brand — clicking scrolls to page top */}
                <div
                    className="text-sm sm:text-xl font-extrabold cursor-pointer tracking-wide select-none flex items-center gap-2 sm:gap-2.5 truncate"
                    onClick={scrollToTop}
                    title="Scroll to top"
                >
                    <img src="icons/icon.svg" alt="Logo" className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg border border-cyan-400/30 shadow-md shrink-0" />
                    <span
                        className="truncate"
                        style={{
                            background: 'linear-gradient(90deg, #22d3ee, #818cf8, #f472b6)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            textShadow: 'none',
                            filter: 'drop-shadow(0 0 8px rgba(56,189,248,0.45))'
                        }}
                    >
                        Line and Layer Gallery
                    </span>
                    {isClerkAdmin && (
                        <span className="text-[9px] sm:text-[10px] font-bold tracking-wider px-1.5 sm:px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 uppercase shrink-0">
                            Admin
                        </span>
                    )}
                </div>

                {/* Desktop controls (Laptop / Tablets >= 768px) */}
                <div className="hidden md:flex items-center gap-2.5 sm:gap-3 shrink-0">
                    {/* Install App Button */}
                    {!isAppInstalled && (
                        <button
                            onClick={triggerInstall}
                            className="flex items-center gap-1.5 text-xs font-bold text-cyan-300 hover:text-white bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-400/50 hover:border-cyan-300 rounded-xl px-2.5 sm:px-3 py-1.5 transition-all shadow-sm shrink-0 cursor-pointer"
                            title="Install Line & Layer App"
                        >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            <span>Install App</span>
                        </button>
                    )}

                    <button
                        onClick={onAboutClick}
                        className="text-xs sm:text-sm text-slate-300 hover:text-cyan-400 transition-colors font-medium px-2 py-1 cursor-pointer"
                    >
                        About Artist
                    </button>

                    {/* Contact for query button — visible only when signed in */}
                    {isSignedIn && (
                        <button
                            onClick={() => setShowContact(true)}
                            className="text-xs sm:text-sm font-semibold text-cyan-300 hover:text-cyan-200 border border-cyan-500/40 hover:border-cyan-400 bg-cyan-950/40 rounded-lg px-2.5 py-1.5 transition-all cursor-pointer flex items-center gap-1.5"
                        >
                            <span>Support</span>
                        </button>
                    )}

                    {/* My Orders button — visible only when signed in */}
                    {isSignedIn && (
                        <button
                            onClick={() => setShowOrders(true)}
                            className="text-xs sm:text-sm font-semibold text-slate-200 hover:text-cyan-400 border border-white/15 hover:border-cyan-400/40 rounded-lg px-2.5 sm:px-3 py-1.5 transition-all cursor-pointer"
                        >
                            <span>My Orders</span>
                        </button>
                    )}

                    {/* Address button for signed-in customers */}
                    {isSignedIn && (
                        <button
                            onClick={() => setShowAddress(true)}
                            className="text-xs sm:text-sm text-slate-300 hover:text-white transition-colors font-medium border border-white/15 px-2.5 sm:px-3 py-1.5 rounded-lg cursor-pointer"
                        >
                            Address
                        </button>
                    )}

                    {/* Customer authentication (Clerk) */}
                    <ClerkAuthButton />
                </div>

                {/* Mobile controls (< 768px): Auth + Hamburger menu */}
                <div className="flex md:hidden items-center gap-2 shrink-0" ref={menuRef}>
                    <ClerkAuthButton compact={true} />

                    {/* Three-lines Hamburger Button */}
                    <button
                        type="button"
                        onClick={() => setMobileMenuOpen(v => !v)}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all cursor-pointer ${
                            mobileMenuOpen 
                                ? 'bg-cyan-500 text-slate-950 border-cyan-400' 
                                : 'bg-slate-800/90 text-slate-200 border-white/15 hover:border-cyan-400/50'
                        }`}
                        aria-label="Toggle navigation menu"
                    >
                        {mobileMenuOpen ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <line x1="18" y1="6" x2="6" y2="18"/>
                                <line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                        ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                <line x1="4" y1="7" x2="20" y2="7"/>
                                <line x1="4" y1="12" x2="20" y2="12"/>
                                <line x1="4" y1="17" x2="20" y2="17"/>
                            </svg>
                        )}
                    </button>

                    {/* Mobile Dropdown Menu Box */}
                    {mobileMenuOpen && (
                        <div 
                            className="absolute top-full right-3 mt-2 w-56 bg-slate-900/95 backdrop-blur-xl border border-white/15 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                            style={{ boxShadow: '0 20px 40px -10px rgba(0,0,0,0.85)' }}
                        >
                            <div className="space-y-1">
                                <button
                                    onClick={() => {
                                        setMobileMenuOpen(false);
                                        if (onAboutClick) onAboutClick();
                                    }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-200 hover:text-cyan-300 hover:bg-white/5 rounded-xl transition-colors text-left"
                                >
                                    <span>👤</span>
                                    <span>About Artist</span>
                                </button>

                                {isSignedIn && (
                                    <button
                                        onClick={() => {
                                            setMobileMenuOpen(false);
                                            setShowContact(true);
                                        }}
                                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-cyan-300 hover:bg-cyan-950/40 rounded-xl transition-colors text-left"
                                    >
                                        <span>💬</span>
                                        <span>Contact for Query</span>
                                    </button>
                                )}

                                {isSignedIn && (
                                    <button
                                        onClick={() => {
                                            setMobileMenuOpen(false);
                                            setShowOrders(true);
                                        }}
                                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-200 hover:text-cyan-300 hover:bg-white/5 rounded-xl transition-colors text-left"
                                    >
                                        <span>📦</span>
                                        <span>My Orders</span>
                                    </button>
                                )}

                                {isSignedIn && (
                                    <button
                                        onClick={() => {
                                            setMobileMenuOpen(false);
                                            setShowAddress(true);
                                        }}
                                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-200 hover:text-cyan-300 hover:bg-white/5 rounded-xl transition-colors text-left"
                                    >
                                        <span>📍</span>
                                        <span>Shipping Address</span>
                                    </button>
                                )}

                                {!isAppInstalled && (
                                    <button
                                        onClick={() => {
                                            setMobileMenuOpen(false);
                                            triggerInstall();
                                        }}
                                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-pink-300 hover:bg-pink-950/30 rounded-xl transition-colors text-left border-t border-white/5 mt-1 pt-2"
                                    >
                                        <span>📱</span>
                                        <span>Install App</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </nav>

            {/* Contact for Query Modal */}
            {typeof ContactQueryModal !== 'undefined' && (
                <ContactQueryModal
                    isOpen={showContact}
                    onClose={() => setShowContact(false)}
                />
            )}

            {/* Order History Drawer */}
            {window.OrderHistoryDrawer && (
                <window.OrderHistoryDrawer
                    isOpen={showOrders}
                    onClose={() => setShowOrders(false)}
                />
            )}

            {/* Address Modal Overlay */}
            {showAddress && window.AddressModal && (
                <window.AddressModal
                    address={addressData}
                    onSaved={(addr) => setAddressData(addr)}
                    onClose={() => setShowAddress(false)}
                />
            )}
        </React.Fragment>
    );
}
