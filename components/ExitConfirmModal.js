// ─────────────────────────────────────────────────────────────────────────────
// components/ExitConfirmModal.js
//
// Native Mobile App Exit Confirmation Dialog
// Catches hardware back gestures / exit navigation on mobile devices & PWAs.
// ─────────────────────────────────────────────────────────────────────────────

function ExitConfirmModal({ enabled = true }) {
    const { useState, useEffect } = React;
    const [showExitModal, setShowExitModal] = useState(false);

    useEffect(() => {
        if (!enabled || typeof window === 'undefined') return;

        // Push initial state to history so back button can be intercepted at root
        try {
            window.history.pushState({ app: 'line_and_layer_root' }, '');
        } catch (e) {}

        const handlePopState = (e) => {
            // When user tries to navigate back past the root, show the native exit confirmation
            setShowExitModal(true);
            // Re-push state to keep user inside the app until they confirm
            try {
                window.history.pushState({ app: 'line_and_layer_root' }, '');
            } catch (err) {}
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [enabled]);

    const handleStay = () => {
        setShowExitModal(false);
    };

    const handleExit = () => {
        setShowExitModal(false);
        // If standalone PWA or browser, attempt to navigate back or close
        if (window.history.length > 2) {
            window.history.go(-2);
        } else {
            try {
                window.close();
            } catch (e) {}
            window.location.href = 'about:blank';
        }
    };

    if (!showExitModal) return null;

    return (
        <div 
            className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
            onClick={handleStay}
        >
            <div 
                className="bg-slate-900/98 border border-white/15 rounded-3xl p-6 sm:p-7 max-w-sm w-full shadow-2xl relative text-center text-slate-200"
                onClick={e => e.stopPropagation()}
                style={{ boxShadow: '0 25px 60px -15px rgba(0,0,0,0.95)' }}
            >
                {/* Icon */}
                <div className="w-14 h-14 rounded-2xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center mx-auto mb-4 text-2xl shadow-inner">
                    👋
                </div>

                <h3 className="text-xl font-extrabold text-white mb-1.5 tracking-tight">
                    Do you want to exit?
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 mb-6 leading-relaxed">
                    Are you sure you want to leave Line and Layer Gallery?
                </p>

                {/* Yes / No Buttons matching native mobile app design */}
                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={handleStay}
                        className="flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold text-white bg-slate-800 hover:bg-slate-700 border border-white/10 transition-all cursor-pointer active:scale-95"
                    >
                        No, Stay
                    </button>
                    <button
                        type="button"
                        onClick={handleExit}
                        className="flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold text-slate-950 bg-gradient-to-r from-cyan-400 to-cyan-300 hover:from-cyan-300 hover:to-cyan-200 shadow-lg transition-all cursor-pointer active:scale-95"
                    >
                        Yes, Exit
                    </button>
                </div>
            </div>
        </div>
    );
}

window.ExitConfirmModal = ExitConfirmModal;
