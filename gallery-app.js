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
        <h1 className="text-xl sm:text-3xl font-extrabold tracking-wider text-center flex-1 mx-2 sm:mx-4 leading-none">
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

    const [isAdmin,     setIsAdmin]     = useState(false);
    const [images,      setImages]      = useState([]);
    const [isLoaded,    setIsLoaded]    = useState(false);
    const [showUpload,  setShowUpload]  = useState(false);
    const [showOrders,  setShowOrders]  = useState(false);
    const [userLikes,   setUserLikes]   = useState(new Set());

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

    // Update artwork price — admin only; persists custom price to Firestore
    const handleUpdatePrice = (id, newPrice) => {
        updateImageInFirebase(id, { price: Number(newPrice) })
            .catch(err => console.error('[Firebase] update price failed:', err));
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

                {/* Right side — My Orders + customer auth (Clerk) + admin controls */}
                <div className="shrink-0 flex justify-end items-center gap-2">
                    {/* My Orders button — only shown when signed in */}
                    {isSignedIn && (
                        <button
                            onClick={() => setShowOrders(true)}
                            className="text-xs sm:text-sm font-semibold text-slate-200 hover:text-cyan-400 border border-white/15 hover:border-cyan-400/40 rounded-lg px-2.5 py-1.5 transition-all flex items-center gap-1.5"
                        >
                            <span>📦</span>
                            <span className="hidden sm:inline">My Orders</span>
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

                {/* Admin: Upload zone — toggled by the + button */}
                {isAdmin && (
                    <motion.div
                        className="mb-8"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        {/* Toggle button */}
                        <div className="flex justify-end mb-4">
                            <button
                                onClick={() => setShowUpload(v => !v)}
                                className="flex items-center gap-2 font-bold py-2.5 px-6 rounded-xl text-sm text-white transition-all hover:scale-105 active:scale-95"
                                style={{
                                    background: showUpload
                                        ? 'rgba(255,255,255,0.08)'
                                        : 'linear-gradient(135deg,#ec4899,#a855f7)',
                                    boxShadow: showUpload ? 'none' : '0 0 20px rgba(168,85,247,0.45)'
                                }}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                    {showUpload
                                        ? <line x1="18" y1="6" x2="6" y2="18"/>
                                        : <><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></>}
                                    {showUpload && <line x1="6" y1="6" x2="18" y2="18"/>}
                                </svg>
                                {showUpload ? 'Cancel' : 'Upload New Artwork'}
                            </button>
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

            {/* Order History Drawer */}
            {window.OrderHistoryDrawer && (
                <window.OrderHistoryDrawer
                    isOpen={showOrders}
                    onClose={() => setShowOrders(false)}
                />
            )}
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<GalleryApp />);