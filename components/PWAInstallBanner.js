// ─────────────────────────────────────────────────────────────────────────────
// components/PWAInstallBanner.js
// Bottom slide-up banner prompting the user to install the PWA app.
// Shows only once per user (persisted in localStorage).
// ─────────────────────────────────────────────────────────────────────────────

function PWAInstallBanner() {
    const { useState, useEffect } = React;
    const [visible, setVisible] = useState(false);
    const [installPrompt, setInstallPrompt] = useState(null);
    const [installing, setInstalling] = useState(false);
    const [showIosGuide, setShowIosGuide] = useState(false);
    const [installed, setInstalled] = useState(false);

    useEffect(() => {
        // 1. Never show if already running inside standalone installed PWA
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                             window.navigator.standalone === true;
        if (isStandalone) return;

        // 2. Never show if dismissed previously (persisted in localStorage)
        if (localStorage.getItem('pwa_prompt_dismissed') === 'true') return;

        // 3. Listen for browser native install prompt
        const handler = (e) => {
            e.preventDefault();
            setInstallPrompt(e);
            window.__deferredPwaPrompt = e;
        };
        window.addEventListener('beforeinstallprompt', handler);

        // Also check if previously captured
        if (window.__deferredPwaPrompt) {
            setInstallPrompt(window.__deferredPwaPrompt);
        }

        // Delay banner entrance slightly (1.5s) for smooth page arrival
        const timer = setTimeout(() => {
            setVisible(true);
        }, 1500);

        // Listen for successful install event
        const onAppInstalled = () => {
            setInstalling(false);
            setInstalled(true);
            localStorage.setItem('pwa_prompt_dismissed', 'true');
            setTimeout(() => setVisible(false), 2500);
        };
        window.addEventListener('appinstalled', onAppInstalled);

        return () => {
            clearTimeout(timer);
            window.removeEventListener('beforeinstallprompt', handler);
            window.removeEventListener('appinstalled', onAppInstalled);
        };
    }, []);

    const dismiss = () => {
        setVisible(false);
        localStorage.setItem('pwa_prompt_dismissed', 'true');
    };

    const isIos = () => {
        const ua = window.navigator.userAgent.toLowerCase();
        return /iphone|ipad|ipod/.test(ua);
    };

    const handleInstallClick = async () => {
        setInstalling(true);

        // iOS Safari Flow
        if (isIos() || !installPrompt) {
            // If iOS Safari or unsupported prompt, show guided prompt with animation
            setTimeout(() => {
                setInstalling(false);
                setShowIosGuide(true);
            }, 800);
            return;
        }

        // Android / Chrome / Desktop Flow
        try {
            installPrompt.prompt();
            const { outcome } = await installPrompt.userChoice;
            if (outcome === 'accepted') {
                setInstalled(true);
                localStorage.setItem('pwa_prompt_dismissed', 'true');
                setTimeout(() => setVisible(false), 2000);
            }
        } catch (err) {
            console.warn('Install prompt error:', err);
        } finally {
            setInstalling(false);
        }
    };

    if (!visible) return null;

    return (
        <div 
            className="fixed bottom-4 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-lg z-50 transition-all duration-500 ease-out transform translate-y-0"
            data-name="PWAInstallBanner"
        >
            <div className="bg-slate-900/98 backdrop-blur-2xl border border-cyan-400/40 rounded-3xl p-4 sm:p-6 shadow-[0_12px_50px_rgba(0,0,0,0.85)] ring-1 ring-white/15 relative overflow-hidden">
                {/* Background ambient neon glow */}
                <div className="absolute -top-12 -right-12 w-36 h-36 bg-cyan-500/20 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

                {/* Dismiss Cross Button */}
                <button
                    onClick={dismiss}
                    className="absolute top-3 right-3 text-slate-400 hover:text-white w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 active:scale-95 transition-all z-10"
                    title="Dismiss"
                    aria-label="Close"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>

                {showIosGuide ? (
                    /* iOS Specific visual install instructions */
                    <div className="pr-7">
                        <div className="flex items-center gap-2 text-cyan-300 font-extrabold text-sm sm:text-base mb-2">
                            <span>📱 Install on iPhone / iPad</span>
                        </div>
                        <ol className="text-xs sm:text-sm text-slate-200 space-y-1.5 list-decimal list-inside leading-relaxed mb-4">
                            <li>Tap the <strong className="text-white font-bold">Share</strong> button ( <span className="inline-block text-cyan-300 font-bold">⎋ / ⬆</span> ) at bottom of Safari.</li>
                            <li>Scroll down and tap <strong className="text-cyan-300 font-bold">Add to Home Screen</strong>.</li>
                        </ol>
                        <button
                            onClick={dismiss}
                            className="w-full py-2.5 sm:py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs sm:text-sm font-extrabold rounded-xl transition-colors shadow-md"
                        >
                            Got It!
                        </button>
                    </div>
                ) : (
                    /* Default banner content */
                    <div className="flex items-center gap-3 sm:gap-4 pr-6">
                        <img 
                            src="icons/icon.svg" 
                            alt="App Icon" 
                            className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl border border-cyan-400/50 shadow-xl shrink-0 object-cover" 
                        />

                        <div className="flex-1 min-w-0">
                            <p className="text-sm sm:text-base font-extrabold text-white leading-tight truncate tracking-tight">
                                Line & Layer Gallery
                            </p>
                            <p className="text-xs sm:text-sm text-slate-300 leading-snug mt-1">
                                Install app for full-screen & fast browsing
                            </p>
                        </div>

                        {/* Side-by-side Install Button with loading/installed animation */}
                        <button
                            onClick={handleInstallClick}
                            disabled={installing || installed}
                            className="shrink-0 px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-sm font-extrabold text-slate-950 transition-all shadow-lg flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-default active:scale-95"
                            style={{
                                background: installed 
                                    ? '#10b981' 
                                    : 'linear-gradient(135deg, #22d3ee, #818cf8)'
                            }}
                        >
                            {installing ? (
                                <>
                                    <svg className="animate-spin -ml-0.5 mr-1.5 h-4 w-4 text-slate-950" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                                    </svg>
                                    <span>Installing…</span>
                                </>
                            ) : installed ? (
                                <>
                                    <span>✓ Installed</span>
                                </>
                            ) : (
                                <>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                        <polyline points="7 10 12 15 17 10" />
                                        <line x1="12" y1="15" x2="12" y2="3" />
                                    </svg>
                                    <span>Install</span>
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

window.PWAInstallBanner = PWAInstallBanner;
