// ─────────────────────────────────────────────────────────────────────────────
// components/Navbar.js
//
// Fixed top navbar — always visible above all layers (z-50).
// ─────────────────────────────────────────────────────────────────────────────

const ADMIN_EMAILS = [
    'manthanparekh9d@gmail.com',
    'parekhmanthan9d@gmail.com',
    'manthanparekh.recovery@gmail.com'
];

function Navbar({ onAboutClick, onBrandClick }) {
    const { useState, useEffect } = React;
    const userState = window.useClerkUser ? window.useClerkUser() : { isSignedIn: false, user: null };
    const isSignedIn = userState.isSignedIn;
    const user = userState.user;

    const [showAddress, setShowAddress] = useState(false);
    const [showOrders,  setShowOrders]  = useState(false);
    const [addressData, setAddressData] = useState(null);

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
                className="fixed top-0 left-0 w-full z-50 bg-slate-900/80 backdrop-blur-md border-b border-white/10 px-4 sm:px-6 py-3 flex justify-between items-center shadow-lg"
                data-name="Navbar"
            >
                {/* Brand — clicking scrolls to page top */}
                <div
                    className="text-base sm:text-xl font-extrabold cursor-pointer tracking-wide select-none flex items-center gap-2"
                    style={{
                        background: 'linear-gradient(90deg, #22d3ee, #818cf8, #f472b6)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        textShadow: 'none',
                        filter: 'drop-shadow(0 0 8px rgba(56,189,248,0.45))'
                    }}
                    onClick={scrollToTop}
                    title="Scroll to top"
                >
                    Line and Layer Gallery
                    {isClerkAdmin && (
                        <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 uppercase">
                            Admin
                        </span>
                    )}
                </div>

                {/* Right-side controls */}
                <div className="flex items-center gap-2.5 sm:gap-4">
                    <button
                        onClick={onAboutClick}
                        className="text-sm text-slate-300 hover:text-cyan-400 transition-colors font-medium hidden sm:inline"
                    >
                        About Artist
                    </button>

                    {/* My Orders button — visible only when signed in */}
                    {isSignedIn && (
                        <button
                            onClick={() => setShowOrders(true)}
                            className="text-xs sm:text-sm font-semibold text-slate-200 hover:text-cyan-400 border border-white/15 hover:border-cyan-400/40 rounded-lg px-2.5 sm:px-3 py-1.5 transition-all"
                        >
                            <span>My Orders</span>
                        </button>
                    )}

                    {/* Address button for signed-in customers */}
                    {isSignedIn && (
                        <button
                            onClick={() => setShowAddress(true)}
                            className="text-xs sm:text-sm text-slate-300 hover:text-white transition-colors font-medium hidden sm:inline border border-white/15 px-2.5 sm:px-3 py-1.5 rounded-lg"
                        >
                            Address
                        </button>
                    )}

                    {/* Customer authentication (Clerk) */}
                    <ClerkAuthButton />
                </div>
            </nav>

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