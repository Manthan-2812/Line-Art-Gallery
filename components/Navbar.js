// ─────────────────────────────────────────────────────────────────────────────
// components/Navbar.js
//
// Fixed top navbar — always visible above all layers (z-50).
// Props:
//   isAdmin      {boolean}  — switches "Admin Login" ↔ "Log Out"
//   onLoginClick {fn}       — opens the login modal
//   onLogout     {fn}       — fires logoutAdmin() and refreshes isAdmin state
//   onAboutClick {fn}       — triggers the shutter reveal animation
// ─────────────────────────────────────────────────────────────────────────────

function Navbar({ isAdmin, onLoginClick, onLogout, onAboutClick, onBrandClick }) {
    // If the parent provides onBrandClick (e.g. to close the about shutter first),
    // call that; otherwise fall back to a plain scroll-to-top.
    const scrollToTop = () => {
        if (onBrandClick) { onBrandClick(); }
        else { window.scrollTo({ top: 0, behavior: 'smooth' }); }
    };

    return (
        <nav
            className="fixed top-0 left-0 w-full z-50 bg-slate-900/80 backdrop-blur-md border-b border-white/10 px-4 sm:px-6 py-3 flex justify-between items-center shadow-lg"
            data-name="Navbar"
        >
            {/* Brand — clicking scrolls to page top */}
            <div
                className="text-base sm:text-xl font-extrabold cursor-pointer tracking-wide select-none"
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
            </div>

            {/* Right-side controls */}
            <div className="flex items-center gap-3 sm:gap-5">
                <button
                    onClick={onAboutClick}
                    className="text-sm text-slate-300 hover:text-cyan-400 transition-colors font-medium hidden sm:inline"
                >
                    About Artist
                </button>

                {isAdmin ? (
                    <button
                        onClick={onLogout}
                        className="text-sm bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1.5 rounded-lg hover:bg-red-500/35 hover:border-red-400/60 transition-all font-semibold"
                    >
                        Log Out
                    </button>
                ) : (
                    <button
                        onClick={onLoginClick}
                        className="text-sm bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 px-3 py-1.5 rounded-lg hover:bg-cyan-500/30 hover:border-cyan-400/60 transition-all font-semibold"
                    >
                        Admin Login
                    </button>
                )}
            </div>
        </nav>
    );
}