// ─────────────────────────────────────────────────────────────────────────────
// gallery-app.js  –  Gallery Page  (gallery.html)
// ─────────────────────────────────────────────────────────────────────────────

// ── GalleryCanvasBackground ───────────────────────────────────────────────────
// Same orb-based nebula as the landing page but with dramatically reduced alpha
// and speed so the gallery feels calm and the artwork takes focus.
// TO TWEAK: Adjust GALLERY_ALPHA and VEL below.
// ─────────────────────────────────────────────────────────────────────────────
function GalleryCanvasBackground() {
    const { useRef, useEffect } = React;
    const ref = useRef(null);

    useEffect(() => {
        const canvas = ref.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let animId;

        const GALLERY_ALPHA = 0.06;   // very subtle — don't distract from art
        const VEL           = 0.18;
        const COUNT         = 5;

        const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
        resize();
        window.addEventListener('resize', resize);

        const orbs = Array.from({ length: COUNT }, (_, i) => ({
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            r: 220 + Math.random() * 200,
            vx: (Math.random() - 0.5) * VEL,
            vy: (Math.random() - 0.5) * VEL,
            hue: (i * 72) % 360
        }));

        const draw = () => {
            ctx.fillStyle = '#080e1d';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.globalCompositeOperation = 'lighter';
            orbs.forEach(o => {
                o.x += o.vx; o.y += o.vy;
                if (o.x + o.r < 0)             o.x = canvas.width  + o.r;
                if (o.x - o.r > canvas.width)  o.x = -o.r;
                if (o.y + o.r < 0)             o.y = canvas.height + o.r;
                if (o.y - o.r > canvas.height) o.y = -o.r;
                o.hue = (o.hue + 0.05) % 360;

                const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
                g.addColorStop(0,   `hsla(${o.hue},65%,45%,${GALLERY_ALPHA})`);
                g.addColorStop(0.5, `hsla(${(o.hue+40)%360},55%,35%,${GALLERY_ALPHA*0.5})`);
                g.addColorStop(1,   'transparent');
                ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, Math.PI*2);
                ctx.fillStyle = g; ctx.fill();
            });
            ctx.globalCompositeOperation = 'source-over';
            animId = requestAnimationFrame(draw);
        };
        draw();
        return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
    }, []);

    return <canvas ref={ref} style={{ position:'fixed', top:0, left:0, width:'100%', height:'100%', zIndex:0, pointerEvents:'none' }} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// GalleryApp — Gallery Page root component
//
// STATE FLOW:
//   isAdmin  — read from JWT token on every mount (checkIsAdmin()).
//              If admin logs out from the Landing page and returns here, the
//              token will be gone so isAdmin will be false automatically.
//   images   — array loaded from localStorage via getGalleryImages() on mount.
//              Every like/comment/delete is written back via saveGalleryImages().
//   isLoaded — triggers the entry TransitionOverlay to wipe off.
//
// CLOUDINARY UPLOAD:
//   handleUpload() calls cloudinary.createUploadWidget().
//   Replace CLOUD_NAME and UPLOAD_PRESET with your own values before using.
//   The Cloudinary script tag in gallery.html loads the widget SDK.
// ─────────────────────────────────────────────────────────────────────────────

// ── Cloudinary config — fill these in before using the upload widget ──────────
const CLOUD_NAME    = 'dd6s1dgx3';
const UPLOAD_PRESET = 'vfxnz7wq';

// Gallery title — same per-letter palette as the landing page (no typewriter)
const GALLERY_LETTER_COLORS = [
    '#f472b6','#fb923c','#facc15','#4ade80',
    '#22d3ee','#60a5fa','#a78bfa','#f472b6',
    '#fb923c','#facc15'
];

// ── GalleryTitle — defined outside GalleryApp so React never re-mounts it ─────
// Renders "Art Gallery" with per-letter static colours matching the landing page.
// No typewriter animation here — the gallery is a destination, not an intro.
function GalleryTitle() {
    return (
        <h1 className="text-xl sm:text-3xl font-extrabold tracking-wider text-center flex-1 mx-2 sm:mx-4 leading-none flex items-center justify-center gap-2">
            <img src="icons/icon.svg" alt="Logo" className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg border border-cyan-400/30 shadow-md inline-block" />
            <span>
                {'Art Gallery'.split('').map((char, i) => (
                    <span key={i} style={{
                        color:      char === ' ' ? 'transparent' : GALLERY_LETTER_COLORS[i % GALLERY_LETTER_COLORS.length],
                        textShadow: char === ' ' ? 'none' : `0 0 12px ${GALLERY_LETTER_COLORS[i % GALLERY_LETTER_COLORS.length]}88`,
                        display:    'inline-block',
                        whiteSpace: char === ' ' ? 'pre' : 'normal'
                    }}>
                        {char === ' ' ? '\u00A0' : char}
                    </span>
                ))}
            </span>
        </h1>
    );
}

const ADMIN_EMAILS = [
    'manthanparekh9d@gmail.com',
    'parekhmanthan9d@gmail.com',
    'manthanparekh.recovery@gmail.com'
];

function GalleryApp() {
    const { useState, useEffect } = React;
    const { motion } = window.Motion;
    const userState = window.useClerkUser ? window.useClerkUser() : { isSignedIn: false, user: null };
    const isSignedIn = userState.isSignedIn;

    const [isAdmin,             setIsAdmin]             = useState(false);
    const [images,              setImages]              = useState([]);
    const [isLoaded,            setIsLoaded]            = useState(false);
    const [showUpload,          setShowUpload]          = useState(false);
    const [showOrders,          setShowOrders]          = useState(false);
    const [userLikes,           setUserLikes]           = useState(new Set());
    const [showBulkPriceModal,  setShowBulkPriceModal]  = useState(false);
    const [bulkPriceVal,        setBulkPriceVal]        = useState('900');
    const [bulkOffsetVal,       setBulkOffsetVal]       = useState('50');
    const [isProcessingBulk,    setIsProcessingBulk]    = useState(false);
    const [isDeletingAll,       setIsDeletingAll]       = useState(false);
    const [installPrompt,       setInstallPrompt]       = useState(null);
    const [isAppInstalled,      setIsAppInstalled]      = useState(() => {
        return (
            (typeof window !== 'undefined' && (
                window.matchMedia('(display-mode: standalone)').matches || 
                window.navigator.standalone === true ||
                localStorage.getItem('pwa_app_installed') === 'true'
            ))
        );
    });

    // Listen for PWA installation prompt & detection
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
        }
    };

    // Sync admin status and user-specific likes from Clerk authentication
    useEffect(() => {
        if (!window.__clerkReady) return;
        let unsubClerk;
        window.__clerkReady.then((clerk) => {
            const syncUser = async () => {
                if (clerk.user) {
                    const emails = (clerk.user.emailAddresses || []).map(e => (e.emailAddress || '').toLowerCase());
                    const isAdm = emails.some(e => ADMIN_EMAILS.includes(e));
                    setIsAdmin(isAdm);

                    try {
                        const token = await clerk.session.getToken();
                        const res = await fetch('/api/get-user-likes', {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        const data = await res.json();
                        const s = new Set(data.likedArtworks || []);
                        window.__userLikedIds = s;
                        setUserLikes(s);
                    } catch (e) {
                        console.error('Failed to load user likes:', e);
                    }
                } else {
                    setIsAdmin(false);
                    window.__userLikedIds = new Set();
                    setUserLikes(new Set());
                }
            };
            syncUser();
            unsubClerk = clerk.addListener(syncUser);
        });
        return () => { if (typeof unsubClerk === 'function') unsubClerk(); };
    }, []);

    useEffect(() => {
        let first = true;
        const unsub = subscribeToImages((imgs) => {
            setImages(imgs);
            if (first) {
                setTimeout(() => setIsLoaded(true), 120);
                first = false;
            }
        });
        return () => unsub();
    }, []);

    // ── Helpers ───────────────────────────────────────────────────────────────

    const navigateHome = () => TriggerTransition('index.html');

    // Persist updated likes/comments to Firestore; onSnapshot auto-refreshes UI
    const handleUpdate = (id, updatedImage) => {
        updateImageInFirebase(id, {
            likes:    updatedImage.likes,
            comments: updatedImage.comments
        }).catch(err => console.error('[Firebase] update failed:', err));
    };

    // Delete a card — removes Firestore doc; onSnapshot removes card from UI
    const handleDelete = (id) => {
        if (!confirm('Delete this artwork?')) return;
        deleteImageFromFirebase(id)
            .catch(err => console.error('[Firebase] delete failed:', err));
    };

    // Called by FileUploadZone after each successful Cloudinary upload.
    // Adds a new Firestore doc; onSnapshot prepends card to gallery automatically.
    const handleUploaded = (newImg) => {
        addImageToFirebase({ ...newImg, pinned: false, addedAt: Date.now() })
            .catch(err => console.error('[Firebase] add failed:', err));
    };

    // Toggle pinned state for a single image — pinned images sort to the top
    const handlePin = (id, currentPinned) => {
        updateImageInFirebase(id, { pinned: !currentPinned })
            .catch(err => console.error('[Firebase] pin failed:', err));
    };
    
    // Rename an artwork — admin only; persists the custom name to Firestore
    const handleRename = (id, newName) => {
        updateImageInFirebase(id, { name: newName })
            .catch(err => console.error('[Firebase] rename failed:', err));
    };

    // Update artwork price & blue offset — admin only; persists custom price to Firestore
    const handleUpdatePrice = (id, newPrice, newOffset) => {
        const updateObj = { price: Number(newPrice) };
        if (newOffset !== undefined && !isNaN(Number(newOffset))) {
            updateObj.blueOffset = Number(newOffset);
        }
        updateImageInFirebase(id, updateObj)
            .catch(err => console.error('[Firebase] update price failed:', err));
    };

    // Attach, update or remove the 300-DPI Print Master URL (2nd URL) for an artwork — admin only
    const handleUpdatePrintUrl = (id, newPrintUrl) => {
        const cleanUrl = (newPrintUrl && typeof newPrintUrl === 'string') ? newPrintUrl.trim() : null;
        updateImageInFirebase(id, { printUrl: cleanUrl || null })
            .catch(err => console.error('[Firebase] update printUrl failed:', err));
    };

    // Bulk delete all artworks — admin only
    const handleDeleteAll = async () => {
        if (images.length === 0) {
            alert('No artworks to delete.');
            return;
        }
        const confirmed = confirm(
            `⚠️ DANGER: Are you sure you want to delete ALL ${images.length} artworks from the gallery?\n\nThis will permanently remove all cards and cannot be undone.`
        );
        if (!confirmed) return;

        setIsDeletingAll(true);
        try {
            const deletePromises = images.map(img => deleteImageFromFirebase(img.id));
            await Promise.all(deletePromises);
        } catch (err) {
            console.error('[Firebase] Bulk delete failed:', err);
            alert('Failed to delete some artworks: ' + (err.message || err));
        } finally {
            setIsDeletingAll(false);
        }
    };

    // Bulk update price for all artworks — admin only
    const handleBulkUpdatePrice = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        const parsedPrice = Number(bulkPriceVal);
        const parsedOffset = Number(bulkOffsetVal);
        if (isNaN(parsedPrice) || parsedPrice <= 0) {
            alert('Please enter a valid positive base price (e.g. 900)');
            return;
        }
        if (isNaN(parsedOffset) || parsedOffset < 0) {
            alert('Please enter a valid offset for Navy Blue (e.g. 50, 80, or 0)');
            return;
        }
        if (images.length === 0) {
            alert('No artworks found to update.');
            return;
        }
        const confirmed = confirm(
            `Update ALL ${images.length} artworks to:\n• Base Price: ₹${parsedPrice}\n• Navy Blue: ₹${parsedPrice + parsedOffset} (+₹${parsedOffset})?`
        );
        if (!confirmed) return;

        setIsProcessingBulk(true);
        try {
            const updatePromises = images.map(img => updateImageInFirebase(img.id, { 
                price: parsedPrice,
                blueOffset: parsedOffset
            }));
            await Promise.all(updatePromises);
            setShowBulkPriceModal(false);
        } catch (err) {
            console.error('[Firebase] Bulk price update failed:', err);
            alert('Failed to update some prices: ' + (err.message || err));
        } finally {
            setIsProcessingBulk(false);
        }
    };

    // ── Derived display data ───────────────────────────────────────────────────
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    const _now          = Date.now();

    // Pinned images first, then newest-first within each group
    const sortedImages = [...images].sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return (b.addedAt || 0) - (a.addedAt || 0);
    });

    // ID of the single most-recently-uploaded image within the last 7 days
    const recentImgs    = images.filter(img => img.addedAt && (_now - img.addedAt) < SEVEN_DAYS_MS);
    const newestRecentId = recentImgs.length > 0
        ? recentImgs.reduce((a, b) => a.addedAt > b.addedAt ? a : b).id
        : null;

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen pb-24 relative" data-name="GalleryApp">

            {/* Subtle gallery nebula background */}
            <GalleryCanvasBackground />

            {/* Entry brush-stroke overlay */}
            <TransitionOverlay isVisible={!isLoaded} />

            {/* ── Top Nav Bar ──────────────────────────────────────────────────── */}
            <nav className="sticky top-0 z-40 bg-slate-900/85 backdrop-blur-md border-b border-white/8 px-3 sm:px-6 py-3 flex items-center shadow-lg">
                {/* Back button — top left */}
                <button
                    onClick={navigateHome}
                    className="flex items-center gap-1.5 text-slate-300 hover:text-cyan-400 transition-colors text-sm font-medium shrink-0"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <polyline points="15 18 9 12 15 6"/>
                    </svg>
                    <span className="hidden sm:inline">Back to Main Page</span>
                </button>

                {/* Centred gradient title — same font style as landing page */}
                <GalleryTitle />

                {/* Right side — Install App + My Orders + customer auth (Clerk) + admin controls */}
                <div className="shrink-0 flex justify-end items-center gap-2">
                    {/* Install App Quick Action (PWA) - Removed once app is installed */}
                    {!isAppInstalled && (
                        <button
                            onClick={triggerInstall}
                            className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-cyan-300 hover:text-cyan-200 bg-cyan-950/60 border border-cyan-500/40 hover:border-cyan-400 rounded-lg px-2.5 py-1.5 transition-all shadow-sm"
                            title="Install Line & Layer App"
                        >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            <span>App</span>
                        </button>
                    )}

                    {/* My Orders button — only shown when signed in */}
                    {isSignedIn && (
                        <button
                            onClick={() => setShowOrders(true)}
                            className="text-xs sm:text-sm font-semibold text-slate-200 hover:text-cyan-400 border border-white/15 hover:border-cyan-400/40 rounded-lg px-2.5 py-1.5 transition-all"
                        >
                            <span>My Orders</span>
                        </button>
                    )}

                    {/* Customer authentication (Clerk) */}
                    <ClerkAuthButton compact={true} />

                    {isAdmin && (
                        <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 uppercase">
                            Admin Active
                        </span>
                    )}
                </div>
            </nav>

            {/* ── Gallery Content ───────────────────────────────────────────────── */}
            <main className="relative z-10 container mx-auto px-3 sm:px-4 mt-8">

                {/* Admin: Upload & Bulk Management Controls */}
                {isAdmin && (
                    <motion.div
                        className="mb-8"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        {/* Admin Action Bar */}
                        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-900/80 border border-white/10 rounded-2xl mb-4 backdrop-blur-md shadow-xl">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 border border-cyan-400/20 px-3 py-1.5 rounded-xl">
                                    Admin Toolbar ({images.length} Artworks)
                                </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                {/* Bulk Edit Price Button */}
                                <button
                                    onClick={() => setShowBulkPriceModal(true)}
                                    disabled={images.length === 0}
                                    className="flex items-center gap-1.5 font-bold py-2 px-3.5 sm:px-4 rounded-xl text-xs sm:text-sm text-yellow-300 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-400/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                    title="Set base price for all artworks in the gallery"
                                >
                                    <span>₹</span>
                                    <span>Set All Prices</span>
                                </button>

                                {/* Delete All Artworks Button */}
                                <button
                                    onClick={handleDeleteAll}
                                    disabled={isDeletingAll || images.length === 0}
                                    className="flex items-center gap-1.5 font-bold py-2 px-3.5 sm:px-4 rounded-xl text-xs sm:text-sm text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-400/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                    title="Delete all artworks from the gallery"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                        <polyline points="3 6 5 6 21 6"></polyline>
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                    </svg>
                                    <span>{isDeletingAll ? 'Deleting All…' : 'Delete All'}</span>
                                </button>

                                {/* Toggle Upload button */}
                                <button
                                    onClick={() => setShowUpload(v => !v)}
                                    className="flex items-center gap-1.5 font-bold py-2 px-4 sm:px-5 rounded-xl text-xs sm:text-sm text-white transition-all hover:scale-105 active:scale-95 cursor-pointer"
                                    style={{
                                        background: showUpload
                                            ? 'rgba(255,255,255,0.08)'
                                            : 'linear-gradient(135deg,#ec4899,#a855f7)',
                                        boxShadow: showUpload ? 'none' : '0 0 15px rgba(168,85,247,0.4)'
                                    }}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                        {showUpload
                                            ? <line x1="18" y1="6" x2="6" y2="18"/>
                                            : <><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></>}
                                    </svg>
                                    <span>{showUpload ? 'Cancel' : 'Upload Artwork'}</span>
                                </button>
                            </div>
                        </div>

                        {/* Inline FileUploadZone — direct Cloudinary REST upload */}
                        {showUpload && (
                            <FileUploadZone
                                cloudName={CLOUD_NAME}
                                uploadPreset={UPLOAD_PRESET}
                                onUploaded={handleUploaded}
                                onClose={() => setShowUpload(false)}
                            />
                        )}
                    </motion.div>
                )}

                {/* ── Featured (pinned) row — horizontal scroll on mobile ─────── */}
                {sortedImages.filter(img => img.pinned).length > 0 && (
                    <div className="mb-8">
                        <p className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-1.5">
                            <span>★</span> Featured
                        </p>
                        <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollSnapType: 'x mandatory' }}>
                            {sortedImages.filter(img => img.pinned).map(img => (
                                <div key={img.id} className="shrink-0 w-48 sm:w-56" style={{ scrollSnapAlign: 'start' }}>
                                    <GalleryCard
                                        image={img}
                                        isAdmin={isAdmin}
                                        onDelete={handleDelete}
                                        onUpdate={handleUpdate}
                                        onPin={handlePin}
                                        onRename={handleRename}
                                        onUpdatePrice={handleUpdatePrice}
                                        onUpdatePrintUrl={handleUpdatePrintUrl}
                                        isNewestRecent={img.id === newestRecentId}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── All artworks masonry grid ────────────────────────────────── */}
                {images.length > 0 ? (
                    <div className="columns-2 sm:columns-3 lg:columns-4 gap-3">
                        {sortedImages.filter(img => !img.pinned).map(img => (
                            <div key={img.id} style={{ breakInside: 'avoid', marginBottom: '12px' }}>
                                <GalleryCard
                                    image={img}
                                    isAdmin={isAdmin}
                                    onDelete={handleDelete}
                                    onUpdate={handleUpdate}
                                    onPin={handlePin}
                                    onRename={handleRename}
                                    onUpdatePrice={handleUpdatePrice}
                                    onUpdatePrintUrl={handleUpdatePrintUrl}
                                    isNewestRecent={img.id === newestRecentId}
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    /* Empty state */
                    <div className="flex flex-col items-center justify-center mt-32 text-center space-y-4">
                        <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="rgba(100,116,139,0.5)" strokeWidth="1.2" className="mx-auto">
                            <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                            <polyline points="21 15 16 10 5 21"/>
                        </svg>
                        <p className="text-slate-500 text-lg">No artworks yet</p>
                        {isAdmin
                            ? <p className="text-slate-600 text-sm">Use the "Upload New Artwork" button above to add your first piece.</p>
                            : <p className="text-slate-600 text-sm">Check back soon — the artist is preparing the collection.</p>
                        }
                    </div>
                )}
            </main>

            {/* Bulk Price Edit Modal (Admin) */}
            {showBulkPriceModal && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                    onClick={() => setShowBulkPriceModal(false)}
                >
                    <div 
                        className="bg-slate-900 border border-white/15 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative"
                        onClick={e => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setShowBulkPriceModal(false)}
                            className="absolute top-5 right-5 text-slate-400 hover:text-white text-lg font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
                        >
                            ✕
                        </button>

                        <h3 className="text-xl font-bold text-white mb-2">Set Price for All Artworks</h3>
                        <p className="text-xs sm:text-sm text-slate-400 mb-5 leading-relaxed">
                            This will update the base price of all <strong className="text-cyan-300">{images.length} artworks</strong> in the gallery. (Color variants like Navy Blue will add their standard offset).
                        </p>

                        <form onSubmit={handleBulkUpdatePrice} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                                    Base Price (White & Black) — INR ₹
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">₹</span>
                                    <input
                                        type="number"
                                        min="1"
                                        value={bulkPriceVal}
                                        onChange={e => setBulkPriceVal(e.target.value)}
                                        className="w-full bg-slate-800 border border-white/20 rounded-xl pl-10 pr-4 py-3 text-white font-bold text-lg focus:outline-none focus:border-cyan-400"
                                        placeholder="900"
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                                    Navy Blue Extra Offset (+INR ₹)
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400 font-bold text-lg">+₹</span>
                                    <input
                                        type="number"
                                        min="0"
                                        value={bulkOffsetVal}
                                        onChange={e => setBulkOffsetVal(e.target.value)}
                                        className="w-full bg-slate-800 border border-white/20 rounded-xl pl-12 pr-4 py-3 text-white font-bold text-lg focus:outline-none focus:border-cyan-400"
                                        placeholder="50"
                                    />
                                </div>
                                <p className="text-[11px] text-slate-400 mt-1">
                                    Navy Blue T-shirts will cost <strong className="text-cyan-300">₹{(Number(bulkPriceVal) || 0) + (Number(bulkOffsetVal) || 0)}</strong>.
                                </p>
                            </div>

                            <div className="bg-slate-800/80 rounded-2xl p-3.5 border border-white/10 space-y-1 text-xs">
                                <div className="flex justify-between text-slate-300">
                                    <span>Classic White / Black:</span>
                                    <span className="font-bold text-white">₹{Number(bulkPriceVal) || 0}</span>
                                </div>
                                <div className="flex justify-between text-cyan-300">
                                    <span>Navy Blue:</span>
                                    <span className="font-bold">₹{(Number(bulkPriceVal) || 0) + (Number(bulkOffsetVal) || 0)}</span>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                                <button
                                    type="button"
                                    onClick={() => setShowBulkPriceModal(false)}
                                    className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isProcessingBulk}
                                    className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-all shadow-lg disabled:opacity-50 cursor-pointer"
                                >
                                    {isProcessingBulk ? 'Updating All…' : 'Apply to All Artworks'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Order History Drawer */}
            {window.OrderHistoryDrawer && (
                <window.OrderHistoryDrawer
                    isOpen={showOrders}
                    onClose={() => setShowOrders(false)}
                />
            )}

            {/* Bottom PWA Install Prompt Banner */}
            {typeof PWAInstallBanner !== 'undefined' && <PWAInstallBanner />}
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<GalleryApp />);