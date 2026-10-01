// ─────────────────────────────────────────────────────────────────────────────
// gallery-app.js  –  Gallery Page  (gallery.html)
// ─────────────────────────────────────────────────────────────────────────────

// ── GalleryCanvasBackground ───────────────────────────────────────────────────
function GalleryCanvasBackground() {
    const { useRef, useEffect } = React;
    const ref = useRef(null);

    useEffect(() => {
        const canvas = ref.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let animId;

        const GALLERY_ALPHA = 0.06;
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

// ── Cloudinary config ────────────────────────────────────────────────────────
const CLOUD_NAME    = 'dd6s1dgx3';
const UPLOAD_PRESET = 'vfxnz7wq';

// Gallery title letter colors
const GALLERY_LETTER_COLORS = [
    '#f472b6','#fb923c','#facc15','#4ade80',
    '#22d3ee','#60a5fa','#a78bfa','#f472b6',
    '#fb923c','#facc15'
];

function GalleryTitle() {
    return (
        <h1 className="text-base sm:text-2xl md:text-3xl font-extrabold tracking-wider text-center flex-1 mx-2 sm:mx-4 leading-none flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap">
            <img src="icons/icon.svg" alt="Logo" className="w-5 h-5 sm:w-7 sm:h-7 rounded-lg border border-cyan-400/30 shadow-md inline-block shrink-0" />
            <span className="whitespace-nowrap">
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
    'manthanparekh9d@gmail.com'
];

function GalleryApp() {
    const { useState, useEffect, useRef } = React;
    const { motion } = window.Motion;
    const userState = window.useClerkUser ? window.useClerkUser() : { isSignedIn: false, user: null };
    const isSignedIn = userState.isSignedIn;

    const [isAdmin,                  setIsAdmin]                  = useState(false);
    const [images,                   setImages]                   = useState([]);
    const [isLoaded,                 setIsLoaded]                 = useState(false);
    const [showUpload,               setShowUpload]               = useState(false);
    const [showOrders,               setShowOrders]               = useState(false);
    const [userLikes,                setUserLikes]                = useState(new Set());
    
    // Bulk Price Modal State
    const [showBulkPriceModal,       setShowBulkPriceModal]       = useState(false);
    const [bulkPriceVal,             setBulkPriceVal]             = useState('900');
    const [bulkBlackOffsetVal,        setBulkBlackOffsetVal]        = useState('0');
    const [bulkGreyOffsetVal,         setBulkGreyOffsetVal]         = useState('0');
    const [bulkNavyOffsetVal,        setBulkNavyOffsetVal]        = useState('50');
    const [bulkRoyalBlueOffsetVal,   setBulkRoyalBlueOffsetVal]   = useState('50');
    const [bulkRedOffsetVal,         setBulkRedOffsetVal]         = useState('50');
    const [isProcessingBulk,         setIsProcessingBulk]         = useState(false);

    // Global Discounts State
    const [activeDiscount,           setActiveDiscount]           = useState(null);
    const [showDiscountModal,        setShowDiscountModal]        = useState(false);
    const [discountPercentVal,       setDiscountPercentVal]       = useState('15');
    const [discountDaysVal,          setDiscountDaysVal]          = useState('7');
    const [discountProductVal,       setDiscountProductVal]       = useState('ALL');
    const [isProcessingDiscount,     setIsProcessingDiscount]     = useState(false);

    // Product Catalog State
    const [customCatalog,            setCustomCatalog]            = useState(null);
    const [showCatalogModal,         setShowCatalogModal]         = useState(false);
    const [newProductName,           setNewProductName]           = useState('');
    const [newProductSkuPrefix,      setNewProductSkuPrefix]      = useState('');
    const [newProductBasePrice,      setNewProductBasePrice]      = useState('950');
    const [newProductSpec,           setNewProductSpec]           = useState('100% Combed Cotton • 240 GSM Heavyweight');
    const [newProductColors,         setNewProductColors]         = useState(['Wh', 'Bk', 'Nb', 'Gm', 'Rb', 'Rd']);
    const [newProductSizes,          setNewProductSizes]          = useState(['S', 'M', 'L', 'XL', 'XXL']);
    const [isProcessingCatalog,      setIsProcessingCatalog]      = useState(false);

    // Customer Support & Policy Modals
    const [showContact,              setShowContact]              = useState(false);
    const [showTAC,                  setShowTAC]                  = useState(false);
    const [showDelivery,             setShowDelivery]             = useState(false);
    const [mobileMenuOpen,           setMobileMenuOpen]           = useState(false);
    const [isDeletingAll,            setIsDeletingAll]            = useState(false);
    const [installPrompt,            setInstallPrompt]            = useState(null);
    const mobileMenuRef = useRef(null);

    const [isAppInstalled, setIsAppInstalled] = useState(() => {
        return (
            (typeof window !== 'undefined' && (
                window.matchMedia('(display-mode: standalone)').matches || 
                window.navigator.standalone === true ||
                localStorage.getItem('pwa_app_installed') === 'true'
            ))
        );
    });

    // Close mobile dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target)) {
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

    // Sync admin status and user-specific likes from Clerk
    useEffect(() => {
        if (!window.__clerkReady) return;
        let unsubClerk;
        window.__clerkReady.then((clerk) => {
            const syncUser = async () => {
                if (clerk.user) {
                    const emails = (clerk.user.emailAddresses || [])
                        .filter(e => e.verification && e.verification.status === 'verified')
                        .map(e => (e.emailAddress || '').toLowerCase());
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

    // Subscribe to images, discounts and product catalog in real-time
    useEffect(() => {
        let first = true;
        const unsubImgs = subscribeToImages((imgs) => {
            setImages(imgs);
            if (first) {
                setTimeout(() => setIsLoaded(true), 120);
                first = false;
            }
        });

        const unsubDisc = (typeof subscribeToDiscounts === 'function') ? subscribeToDiscounts((d) => setActiveDiscount(d)) : null;
        const unsubCat  = (typeof subscribeToCatalog === 'function') ? subscribeToCatalog((c) => setCustomCatalog(c)) : null;

        return () => {
            if (typeof unsubImgs === 'function') unsubImgs();
            if (typeof unsubDisc === 'function') unsubDisc();
            if (typeof unsubCat === 'function') unsubCat();
        };
    }, []);

    // ── Helpers ───────────────────────────────────────────────────────────────

    const navigateHome = () => TriggerTransition('index.html');

    const handleUpdate = (id, updatedImage) => {
        updateImageInFirebase(id, {
            likes:    updatedImage.likes,
            comments: updatedImage.comments
        }).catch(err => console.error('[Firebase] update failed:', err));
    };

    const handleDelete = (id) => {
        if (!confirm('Delete this artwork?')) return;
        deleteImageFromFirebase(id)
            .catch(err => console.error('[Firebase] delete failed:', err));
    };

    const handleUploaded = (newImg) => {
        addImageToFirebase({ ...newImg, pinned: false, addedAt: Date.now() })
            .catch(err => console.error('[Firebase] add failed:', err));
    };

    const handlePin = (id, currentPinned) => {
        updateImageInFirebase(id, { pinned: !currentPinned })
            .catch(err => console.error('[Firebase] pin failed:', err));
    };
    
    const handleRename = (id, newName) => {
        updateImageInFirebase(id, { name: newName })
            .catch(err => console.error('[Firebase] rename failed:', err));
    };

    const handleUpdatePrice = (id, newPrice, offsets) => {
        const updateObj = { price: Number(newPrice) };
        if (typeof offsets === 'object' && offsets !== null) {
            if (offsets.blackOffset !== undefined) updateObj.blackOffset = Number(offsets.blackOffset);
            if (offsets.greyOffset !== undefined) updateObj.greyOffset = Number(offsets.greyOffset);
            if (offsets.navyOffset !== undefined) updateObj.navyOffset = Number(offsets.navyOffset);
            if (offsets.royalBlueOffset !== undefined) updateObj.royalBlueOffset = Number(offsets.royalBlueOffset);
            if (offsets.redOffset !== undefined) updateObj.redOffset = Number(offsets.redOffset);
            if (offsets.navyOffset !== undefined) updateObj.blueOffset = Number(offsets.navyOffset);
        } else if (offsets !== undefined && !isNaN(Number(offsets))) {
            updateObj.blueOffset = Number(offsets);
            updateObj.navyOffset = Number(offsets);
            updateObj.royalBlueOffset = Number(offsets);
            updateObj.redOffset = Number(offsets);
        }
        updateImageInFirebase(id, updateObj)
            .catch(err => console.error('[Firebase] update price failed:', err));
    };

    const handleUpdatePrintUrl = (id, newPrintUrl) => {
        const cleanUrl = (newPrintUrl && typeof newPrintUrl === 'string') ? newPrintUrl.trim() : null;
        updateImageInFirebase(id, { printUrl: cleanUrl || null })
            .catch(err => console.error('[Firebase] update printUrl failed:', err));
    };

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
        const parsedBlack = Number(bulkBlackOffsetVal);
        const parsedGrey = Number(bulkGreyOffsetVal);
        const parsedNavy = Number(bulkNavyOffsetVal);
        const parsedRoyalBlue = Number(bulkRoyalBlueOffsetVal);
        const parsedRed = Number(bulkRedOffsetVal);

        if (isNaN(parsedPrice) || parsedPrice <= 0) {
            alert('Please enter a valid positive base price (e.g. 900)');
            return;
        }
        if (isNaN(parsedBlack) || parsedBlack < 0 || isNaN(parsedGrey) || parsedGrey < 0 || isNaN(parsedNavy) || parsedNavy < 0 || isNaN(parsedRoyalBlue) || parsedRoyalBlue < 0 || isNaN(parsedRed) || parsedRed < 0) {
            alert('Please enter valid positive offsets (e.g. 50, 0) for colors');
            return;
        }
        if (images.length === 0) {
            alert('No artworks found to update.');
            return;
        }
        const confirmed = confirm(
            `Update ALL ${images.length} artworks to:\n• Base Price (White): ₹${parsedPrice}\n• Black: ₹${parsedPrice + parsedBlack} (+₹${parsedBlack})\n• Grey Melange: ₹${parsedPrice + parsedGrey} (+₹${parsedGrey})\n• Navy Blue: ₹${parsedPrice + parsedNavy} (+₹${parsedNavy})\n• Royal Blue: ₹${parsedPrice + parsedRoyalBlue} (+₹${parsedRoyalBlue})\n• Crimson Red: ₹${parsedPrice + parsedRed} (+₹${parsedRed})?`
        );
        if (!confirmed) return;

        setIsProcessingBulk(true);
        try {
            const updatePromises = images.map(img => updateImageInFirebase(img.id, { 
                price: parsedPrice,
                blackOffset: parsedBlack,
                greyOffset: parsedGrey,
                navyOffset: parsedNavy,
                royalBlueOffset: parsedRoyalBlue,
                redOffset: parsedRed,
                blueOffset: parsedNavy
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

    // Apply Global Store Discount
    const handleApplyDiscount = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        const pct = Number(discountPercentVal);
        const days = Number(discountDaysVal);

        if (isNaN(pct) || pct < 1 || pct > 90) {
            alert('Discount percentage must be between 1% and 90%.');
            return;
        }
        if (isNaN(days) || days < 1) {
            alert('Please specify a duration of at least 1 day.');
            return;
        }

        const expiresAt = Date.now() + (days * 24 * 60 * 60 * 1000);
        setIsProcessingDiscount(true);
        try {
            if (typeof saveDiscountToFirebase === 'function') {
                await saveDiscountToFirebase({
                    discountPercent: pct,
                    durationDays: days,
                    appliesToProduct: discountProductVal || 'ALL',
                    expiresAt: expiresAt,
                    createdAt: Date.now()
                });
            }
            setShowDiscountModal(false);
        } catch (err) {
            console.error('[Firebase] Failed to apply discount:', err);
            alert('Error applying discount: ' + (err.message || err));
        } finally {
            setIsProcessingDiscount(false);
        }
    };

    // Remove Global Store Discount
    const handleRemoveDiscount = async () => {
        if (!confirm('Remove and cancel the active store discount? Prices will revert to original immediately.')) return;
        setIsProcessingDiscount(true);
        try {
            if (typeof removeDiscountFromFirebase === 'function') {
                await removeDiscountFromFirebase();
            }
            setShowDiscountModal(false);
        } catch (err) {
            console.error('[Firebase] Failed to remove discount:', err);
            alert('Error removing discount: ' + (err.message || err));
        } finally {
            setIsProcessingDiscount(false);
        }
    };

    // Add New Product to Store Catalog
    const handleAddProduct = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        const cleanName = newProductName.trim();
        const cleanSku = newProductSkuPrefix.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '');
        const basePrice = Number(newProductBasePrice);

        if (!cleanName) {
            alert('Please enter a product name (e.g. Classic Crew Neck T-Shirt).');
            return;
        }
        if (!cleanSku || cleanSku.length < 2 || cleanSku.length > 10) {
            alert('Qikink SKU Prefix must be 2 to 10 alphanumeric characters (e.g. US21, UC22, UH32).');
            return;
        }
        if (isNaN(basePrice) || basePrice <= 0) {
            alert('Please enter a valid positive base price.');
            return;
        }
        if (newProductColors.length === 0) {
            alert('Please select at least one available color.');
            return;
        }
        if (newProductSizes.length === 0) {
            alert('Please select at least one available size.');
            return;
        }

        const newProdObj = {
            id: 'prod_' + Date.now().toString().slice(-6),
            name: cleanName,
            skuPrefix: cleanSku,
            basePrice: basePrice,
            spec: newProductSpec.trim() || '100% Combed Cotton • Premium DTG Print',
            printTypeId: 1,
            colors: newProductColors,
            sizes: newProductSizes,
            active: true
        };

        setIsProcessingCatalog(true);
        try {
            const currentList = customCatalog || window.DEFAULT_PRODUCTS || [];
            const updatedList = [...currentList, newProdObj];
            if (typeof saveCatalogToFirebase === 'function') {
                await saveCatalogToFirebase(updatedList);
            }
            setNewProductName('');
            setNewProductSkuPrefix('');
            setShowCatalogModal(false);
        } catch (err) {
            console.error('[Firebase] Failed to save product:', err);
            alert('Error saving product: ' + (err.message || err));
        } finally {
            setIsProcessingCatalog(false);
        }
    };

    // Toggle Product active status
    const handleToggleProduct = async (prodId, currentActive) => {
        const currentList = customCatalog || window.DEFAULT_PRODUCTS || [];
        const updatedList = currentList.map(p => p.id === prodId ? { ...p, active: !currentActive } : p);
        if (typeof saveCatalogToFirebase === 'function') {
            await saveCatalogToFirebase(updatedList);
        }
    };

    // ── Derived display data ───────────────────────────────────────────────────
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    const _now          = Date.now();

    const sortedImages = [...images].sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return (b.addedAt || 0) - (a.addedAt || 0);
    });

    const recentImgs    = images.filter(img => img.addedAt && (_now - img.addedAt) < SEVEN_DAYS_MS);
    const newestRecentId = recentImgs.length > 0
        ? recentImgs.reduce((a, b) => a.addedAt > b.addedAt ? a : b).id
        : null;

    const isDiscountActive = activeDiscount && activeDiscount.active && activeDiscount.expiresAt && Date.now() < activeDiscount.expiresAt;
    const discountDaysLeft = isDiscountActive ? Math.ceil((activeDiscount.expiresAt - Date.now()) / (24 * 60 * 60 * 1000)) : 0;

    return (
        <div className="min-h-screen pb-24 relative" data-name="GalleryApp">

            {/* Subtle gallery nebula background */}
            <GalleryCanvasBackground />

            {/* Entry brush-stroke overlay */}
            <TransitionOverlay isVisible={!isLoaded} />

            {/* ── Top Nav Bar ──────────────────────────────────────────────────── */}
            <nav className="sticky top-0 z-40 bg-slate-900/85 backdrop-blur-md border-b border-white/8 px-3 sm:px-6 py-3 flex justify-between items-center shadow-lg">
                {/* Back button — top left */}
                <button
                    onClick={navigateHome}
                    className="flex items-center gap-1.5 text-slate-300 hover:text-cyan-400 transition-colors text-xs sm:text-sm font-medium shrink-0 cursor-pointer"
                    title="Back to Landing Page"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <polyline points="15 18 9 12 15 6"/>
                    </svg>
                    <span className="hidden sm:inline">Back</span>
                </button>

                {/* Centred gradient title */}
                <GalleryTitle />

                {/* Desktop controls (>= 768px) */}
                <div className="hidden md:flex items-center gap-2.5 shrink-0">
                    {!isAppInstalled && (
                        <button
                            onClick={triggerInstall}
                            className="flex items-center gap-1.5 text-xs font-bold text-cyan-300 hover:text-cyan-200 bg-cyan-950/60 border border-cyan-500/40 hover:border-cyan-400 rounded-lg px-2.5 py-1.5 transition-all shadow-sm cursor-pointer"
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

                    {isSignedIn && (
                        <button
                            onClick={() => setShowContact(true)}
                            className="text-xs sm:text-sm font-semibold text-cyan-300 hover:text-cyan-200 border border-cyan-500/40 hover:border-cyan-400 bg-cyan-950/40 rounded-lg px-2.5 py-1.5 transition-all cursor-pointer flex items-center gap-1"
                        >
                            <span>Support</span>
                        </button>
                    )}

                    {isSignedIn && (
                        <button
                            onClick={() => setShowOrders(true)}
                            className="text-xs sm:text-sm font-semibold text-slate-200 hover:text-cyan-400 border border-white/15 hover:border-cyan-400/40 rounded-lg px-2.5 py-1.5 transition-all cursor-pointer"
                        >
                            <span>My Orders</span>
                        </button>
                    )}

                    <ClerkAuthButton compact={true} />

                    {isAdmin && (
                        <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 uppercase">
                            Admin Active
                        </span>
                    )}
                </div>

                {/* Mobile controls (< 768px) */}
                <div className="flex md:hidden items-center gap-1.5 shrink-0" ref={mobileMenuRef}>
                    <ClerkAuthButton compact={true} />

                    {isSignedIn && (
                        <button
                            type="button"
                            onClick={() => setMobileMenuOpen(v => !v)}
                            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center border transition-all cursor-pointer ${
                                mobileMenuOpen 
                                    ? 'bg-cyan-500 text-slate-950 border-cyan-400' 
                                    : 'bg-slate-800/90 text-slate-200 border-white/15 hover:border-cyan-400/50'
                            }`}
                            aria-label="Toggle navigation menu"
                        >
                            {mobileMenuOpen ? (
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <line x1="18" y1="6" x2="6" y2="18"/>
                                    <line x1="6" y1="6" x2="18" y2="18"/>
                                </svg>
                            ) : (
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                    <line x1="4" y1="7" x2="20" y2="7"/>
                                    <line x1="4" y1="12" x2="20" y2="12"/>
                                    <line x1="4" y1="17" x2="20" y2="17"/>
                                </svg>
                            )}
                        </button>
                    )}

                    {isSignedIn && mobileMenuOpen && (
                        <div 
                            className="absolute top-full right-2 mt-2 w-52 bg-slate-900/95 backdrop-blur-xl border border-white/15 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                            style={{ boxShadow: '0 20px 40px -10px rgba(0,0,0,0.85)' }}
                        >
                            <div className="space-y-1">
                                <button
                                    onClick={() => {
                                        setMobileMenuOpen(false);
                                        setShowContact(true);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-cyan-300 hover:bg-cyan-950/40 rounded-xl transition-colors text-left"
                                >
                                    <span>💬</span>
                                    <span>Contact for Query</span>
                                </button>

                                <button
                                    onClick={() => {
                                        setMobileMenuOpen(false);
                                        setShowOrders(true);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-200 hover:text-cyan-300 hover:bg-white/5 rounded-xl transition-colors text-left"
                                >
                                    <span>📦</span>
                                    <span>My Orders</span>
                                </button>

                                {!isAppInstalled && (
                                    <button
                                        onClick={() => {
                                            setMobileMenuOpen(false);
                                            triggerInstall();
                                        }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-pink-300 hover:bg-pink-950/30 rounded-xl transition-colors text-left border-t border-white/5 mt-1 pt-2"
                                    >
                                        <span>📱</span>
                                        <span>Install App</span>
                                    </button>
                                )}

                                {isAdmin && (
                                    <div className="px-3 py-1.5 text-[10px] font-bold text-cyan-300 bg-cyan-950/40 rounded-lg border border-cyan-500/30 text-center uppercase tracking-wider mt-1">
                                        👑 Admin Active
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </nav>

            {/* ── Active Storewide Discount Ribbon ──────────────────────────────── */}
            {isDiscountActive && (
                <div className="relative z-30 bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-600 py-2.5 px-4 text-center text-slate-950 font-extrabold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2">
                    <span className="text-base animate-bounce">🎉</span>
                    <span>
                        SPECIAL PROMOTION: <strong>{activeDiscount.discountPercent}% OFF</strong> on all artwork prints! ({discountDaysLeft} day{discountDaysLeft > 1 ? 's' : ''} left)
                    </span>
                </div>
            )}

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
                        <div className="flex flex-wrap items-center justify-between gap-2.5 p-3.5 bg-slate-900/90 border border-white/10 rounded-2xl mb-4 backdrop-blur-md shadow-xl">
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
                                    className="flex items-center gap-1.5 font-bold py-2 px-3 rounded-xl text-xs sm:text-sm text-yellow-300 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-400/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                    title="Set base prices & color offsets for all artworks"
                                >
                                    <span>₹</span>
                                    <span>Set All Prices</span>
                                </button>

                                {/* Manage Discount Button */}
                                <button
                                    onClick={() => setShowDiscountModal(true)}
                                    className={`flex items-center gap-1.5 font-bold py-2 px-3 rounded-xl text-xs sm:text-sm transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                                        isDiscountActive
                                            ? 'text-emerald-300 bg-emerald-500/20 border border-emerald-400/50 shadow-md ring-1 ring-emerald-400/40'
                                            : 'text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-400/30'
                                    }`}
                                    title="Apply or remove storewide percentage discount"
                                >
                                    <span>🏷️</span>
                                    <span>{isDiscountActive ? `${activeDiscount.discountPercent}% OFF Active` : 'Set Discount'}</span>
                                </button>

                                {/* Manage Products Catalog Button */}
                                <button
                                    onClick={() => setShowCatalogModal(true)}
                                    className="flex items-center gap-1.5 font-bold py-2 px-3 rounded-xl text-xs sm:text-sm text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-400/30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                                    title="Add or manage product formats (V-Neck, Crew Neck, Hoodies, etc.)"
                                >
                                    <span>👕</span>
                                    <span>Products</span>
                                </button>

                                {/* Delete All Artworks Button */}
                                <button
                                    onClick={handleDeleteAll}
                                    disabled={isDeletingAll || images.length === 0}
                                    className="flex items-center gap-1.5 font-bold py-2 px-3 rounded-xl text-xs sm:text-sm text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-400/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                    title="Delete all artworks from the gallery"
                                >
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                        <polyline points="3 6 5 6 21 6"></polyline>
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                    </svg>
                                    <span>{isDeletingAll ? 'Deleting…' : 'Delete All'}</span>
                                </button>

                                {/* Upload button */}
                                <button
                                    onClick={() => setShowUpload(v => !v)}
                                    className="flex items-center gap-1.5 font-bold py-2 px-4 rounded-xl text-xs sm:text-sm text-white transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-md"
                                    style={{
                                        background: showUpload
                                            ? 'rgba(255,255,255,0.08)'
                                            : 'linear-gradient(135deg,#ec4899,#a855f7)',
                                    }}
                                >
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                        {showUpload
                                            ? <line x1="18" y1="6" x2="6" y2="18"/>
                                            : <><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></>}
                                    </svg>
                                    <span>{showUpload ? 'Cancel' : 'Upload'}</span>
                                </button>
                            </div>
                        </div>

                        {/* Inline FileUploadZone */}
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

                {/* ── Featured (pinned) row ────────────────────────────────────── */}
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
                                        activeDiscount={activeDiscount}
                                        customCatalog={customCatalog}
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
                                    activeDiscount={activeDiscount}
                                    customCatalog={customCatalog}
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
                            ? <p className="text-slate-600 text-sm">Use the "Upload" button above to add your first piece.</p>
                            : <p className="text-slate-600 text-sm">Check back soon — the artist is preparing the collection.</p>
                        }
                    </div>
                )}
            </main>

            {/* ── Bulk Price Edit Modal (Admin) ───────────────────────────────── */}
            {showBulkPriceModal && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                    onClick={() => setShowBulkPriceModal(false)}
                >
                    <div 
                        className="bg-slate-900 border border-white/15 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative max-h-[90vh] overflow-y-auto"
                        onClick={e => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setShowBulkPriceModal(false)}
                            className="absolute top-5 right-5 text-slate-400 hover:text-white text-lg font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
                        >
                            ✕
                        </button>

                        <h3 className="text-xl font-bold text-white mb-1">Set Prices for All Artworks</h3>
                        <p className="text-xs text-slate-400 mb-5 leading-relaxed">
                            Configure the base price for White and individual color offsets across all <strong className="text-cyan-300">{images.length} artworks</strong>.
                        </p>

                        <form onSubmit={handleBulkUpdatePrice} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                                    Base Price (White) — INR ₹
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">₹</span>
                                    <input
                                        type="number"
                                        min="1"
                                        value={bulkPriceVal}
                                        onChange={e => setBulkPriceVal(e.target.value)}
                                        className="w-full bg-slate-800 border border-white/20 rounded-xl pl-10 pr-4 py-2.5 text-white font-bold text-base focus:outline-none focus:border-cyan-400"
                                        placeholder="900"
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                                        Black (+₹)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={bulkBlackOffsetVal}
                                        onChange={e => setBulkBlackOffsetVal(e.target.value)}
                                        className="w-full bg-slate-800 border border-white/20 rounded-xl px-3 py-2 text-white font-bold text-sm focus:outline-none focus:border-cyan-400"
                                        placeholder="0"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                                        Grey Melange (+₹)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={bulkGreyOffsetVal}
                                        onChange={e => setBulkGreyOffsetVal(e.target.value)}
                                        className="w-full bg-slate-800 border border-white/20 rounded-xl px-3 py-2 text-white font-bold text-sm focus:outline-none focus:border-cyan-400"
                                        placeholder="0"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-blue-300 uppercase tracking-wider mb-1">
                                        Navy Blue (+₹)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={bulkNavyOffsetVal}
                                        onChange={e => setBulkNavyOffsetVal(e.target.value)}
                                        className="w-full bg-slate-800 border border-blue-400/30 rounded-xl px-3 py-2 text-white font-bold text-sm focus:outline-none focus:border-blue-400"
                                        placeholder="50"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-cyan-300 uppercase tracking-wider mb-1">
                                        Royal Blue (+₹)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={bulkRoyalBlueOffsetVal}
                                        onChange={e => setBulkRoyalBlueOffsetVal(e.target.value)}
                                        className="w-full bg-slate-800 border border-cyan-400/30 rounded-xl px-3 py-2 text-white font-bold text-sm focus:outline-none focus:border-cyan-400"
                                        placeholder="50"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-red-300 uppercase tracking-wider mb-1">
                                        Crimson Red (+₹)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={bulkRedOffsetVal}
                                        onChange={e => setBulkRedOffsetVal(e.target.value)}
                                        className="w-full bg-slate-800 border border-red-400/30 rounded-xl px-3 py-2 text-white font-bold text-sm focus:outline-none focus:border-red-400"
                                        placeholder="50"
                                    />
                                </div>
                            </div>

                            <div className="bg-slate-800/80 rounded-2xl p-3.5 border border-white/10 space-y-1.5 text-xs">
                                <div className="flex justify-between text-slate-300">
                                    <span>White:</span>
                                    <span className="font-bold text-white">₹{Number(bulkPriceVal) || 0}</span>
                                </div>
                                <div className="flex justify-between text-slate-300">
                                    <span>Black:</span>
                                    <span className="font-bold text-white">₹{(Number(bulkPriceVal) || 0) + (Number(bulkBlackOffsetVal) || 0)}</span>
                                </div>
                                <div className="flex justify-between text-slate-300">
                                    <span>Grey Melange:</span>
                                    <span className="font-bold text-white">₹{(Number(bulkPriceVal) || 0) + (Number(bulkGreyOffsetVal) || 0)}</span>
                                </div>
                                <div className="flex justify-between text-blue-300">
                                    <span>Navy Blue:</span>
                                    <span className="font-bold">₹{(Number(bulkPriceVal) || 0) + (Number(bulkNavyOffsetVal) || 0)}</span>
                                </div>
                                <div className="flex justify-between text-cyan-300">
                                    <span>Royal Blue:</span>
                                    <span className="font-bold">₹{(Number(bulkPriceVal) || 0) + (Number(bulkRoyalBlueOffsetVal) || 0)}</span>
                                </div>
                                <div className="flex justify-between text-red-300">
                                    <span>Crimson Red:</span>
                                    <span className="font-bold">₹{(Number(bulkPriceVal) || 0) + (Number(bulkRedOffsetVal) || 0)}</span>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                                <button
                                    type="button"
                                    onClick={() => setShowBulkPriceModal(false)}
                                    className="px-4 py-2 text-sm font-semibold text-slate-400 hover:text-white"
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

            {/* ── Global Store Discount Modal (Admin) ─────────────────────────── */}
            {showDiscountModal && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                    onClick={() => setShowDiscountModal(false)}
                >
                    <div 
                        className="bg-slate-900 border border-purple-500/30 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative"
                        onClick={e => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setShowDiscountModal(false)}
                            className="absolute top-5 right-5 text-slate-400 hover:text-white text-lg font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10"
                        >
                            ✕
                        </button>

                        <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30 uppercase">
                                Global Store Discount
                            </span>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Set Storewide Discount</h3>
                        <p className="text-xs text-slate-400 mb-5 leading-relaxed">
                            Applies a percentage discount across all artworks in the gallery. Shows strikethrough original prices and updates Razorpay checkout automatically.
                        </p>

                        {isDiscountActive && (
                            <div className="mb-5 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl p-4 flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-bold text-emerald-300">Discount Currently Active</p>
                                    <p className="text-sm font-extrabold text-white">{activeDiscount.discountPercent}% OFF • {discountDaysLeft} day(s) left</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleRemoveDiscount}
                                    disabled={isProcessingDiscount}
                                    className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
                                >
                                    Cancel Discount
                                </button>
                            </div>
                        )}

                        <form onSubmit={handleApplyDiscount} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                                    Discount Percentage (1% – 90%)
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="1"
                                        max="90"
                                        value={discountPercentVal}
                                        onChange={e => setDiscountPercentVal(e.target.value)}
                                        className="w-full bg-slate-800 border border-white/20 rounded-xl px-4 py-2.5 text-white font-bold text-base focus:outline-none focus:border-purple-400 pr-10"
                                        placeholder="15"
                                        autoFocus
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-purple-300 font-bold text-lg">%</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                                    Timeframe Duration (in Days)
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="1"
                                        max="365"
                                        value={discountDaysVal}
                                        onChange={e => setDiscountDaysVal(e.target.value)}
                                        className="w-full bg-slate-800 border border-white/20 rounded-xl px-4 py-2.5 text-white font-bold text-base focus:outline-none focus:border-purple-400 pr-16"
                                        placeholder="7"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-xs">Days</span>
                                </div>
                            </div>

                            <div className="bg-slate-800/80 rounded-2xl p-3.5 border border-white/10 text-xs space-y-1 text-slate-300">
                                <p className="font-semibold text-white">Live Sample Preview:</p>
                                <div className="flex justify-between items-center text-xs">
                                    <span>Regular ₹900 T-Shirt:</span>
                                    <span className="font-bold text-emerald-400">
                                        ₹{Math.max(1, Math.round(900 * (1 - (Number(discountPercentVal) || 0) / 100)))}
                                        <span className="text-slate-500 line-through ml-1.5">₹900</span>
                                    </span>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                                <button
                                    type="button"
                                    onClick={() => setShowDiscountModal(false)}
                                    className="px-4 py-2 text-sm font-semibold text-slate-400 hover:text-white"
                                >
                                    Close
                                </button>
                                <button
                                    type="submit"
                                    disabled={isProcessingDiscount}
                                    className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-950 bg-gradient-to-r from-purple-400 to-pink-400 hover:from-purple-300 hover:to-pink-300 transition-all shadow-lg disabled:opacity-50 cursor-pointer"
                                >
                                    {isProcessingDiscount ? 'Saving…' : 'Apply Discount'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Multi-Product Catalog Modal (Admin) ─────────────────────────── */}
            {showCatalogModal && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                    onClick={() => setShowCatalogModal(false)}
                >
                    <div 
                        className="bg-slate-900 border border-cyan-500/30 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto"
                        onClick={e => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setShowCatalogModal(false)}
                            className="absolute top-5 right-5 text-slate-400 hover:text-white text-lg font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10"
                        >
                            ✕
                        </button>

                        <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 uppercase">
                                Store Product Formats
                            </span>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Manage Store Products</h3>
                        <p className="text-xs text-slate-400 mb-5 leading-relaxed">
                            Add or enable product categories for Qikink DTG printing. When 2 or more products are active, customers choose their preferred apparel before customizing!
                        </p>

                        {/* Existing Products List */}
                        <div className="mb-6 space-y-2.5">
                            <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">Active Store Products:</p>
                            {(customCatalog || window.DEFAULT_PRODUCTS || []).map(p => (
                                <div key={p.id} className="bg-slate-800/80 border border-white/10 rounded-2xl p-3.5 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-bold text-white">{p.name}</p>
                                        <p className="text-[11px] text-slate-400">SKU Prefix: <strong className="text-cyan-300 font-mono">{p.skuPrefix}</strong> • Base Price: ₹{p.basePrice || 900}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleToggleProduct(p.id, p.active !== false)}
                                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                                            p.active !== false
                                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 hover:bg-red-500/20 hover:text-red-300 hover:border-red-400/30'
                                                : 'bg-slate-700 text-slate-400 hover:bg-emerald-500/20 hover:text-emerald-300'
                                        }`}
                                    >
                                        {p.active !== false ? 'Active ✓' : 'Disabled'}
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Add New Product Form */}
                        <form onSubmit={handleAddProduct} className="space-y-4 pt-4 border-t border-white/10">
                            <h4 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                                <span>+ Add New Apparel Product</span>
                            </h4>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                                        Product Title
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Classic Crew Neck T-Shirt"
                                        value={newProductName}
                                        onChange={e => setNewProductName(e.target.value)}
                                        className="w-full bg-slate-800 border border-white/20 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-400"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                                        Qikink SKU Prefix (Alphanumeric)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. US21, UC22, UH32"
                                        value={newProductSkuPrefix}
                                        onChange={e => setNewProductSkuPrefix(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ''))}
                                        className="w-full bg-slate-800 border border-white/20 rounded-xl px-3 py-2 text-white text-xs font-mono uppercase focus:outline-none focus:border-cyan-400"
                                    />
                                    <p className="text-[9px] text-slate-400 mt-0.5">Constraint: Max 8 letters/numbers</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                                        Base Price (INR ₹)
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={newProductBasePrice}
                                        onChange={e => setNewProductBasePrice(e.target.value)}
                                        className="w-full bg-slate-800 border border-white/20 rounded-xl px-3 py-2 text-white text-xs font-bold focus:outline-none focus:border-cyan-400"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                                        Product Spec / Fabric
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. 100% Combed Cotton • 180 GSM"
                                        value={newProductSpec}
                                        onChange={e => setNewProductSpec(e.target.value)}
                                        className="w-full bg-slate-800 border border-white/20 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-400"
                                    />
                                </div>
                            </div>

                            {/* Color Selection for New Product */}
                            <div>
                                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                                    Select Available Colors for this Product:
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {(window.PRODUCT_COLORS || []).map(c => {
                                        const isChecked = newProductColors.includes(c.id);
                                        return (
                                            <button
                                                type="button"
                                                key={c.id}
                                                onClick={() => {
                                                    setNewProductColors(prev => 
                                                        prev.includes(c.id) 
                                                            ? (prev.length > 1 ? prev.filter(x => x !== c.id) : prev) 
                                                            : [...prev, c.id]
                                                    );
                                                }}
                                                className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                                                    isChecked 
                                                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-sm' 
                                                        : 'bg-slate-800 text-slate-400 border-white/10'
                                                }`}
                                            >
                                                <span className="w-3 h-3 rounded-full border border-white/30 shrink-0" style={{ backgroundColor: c.hex }} />
                                                <span>{c.shortName || c.name}</span>
                                                <span className="text-[10px]">{isChecked ? '✓' : '+'}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                                <button
                                    type="button"
                                    onClick={() => setShowCatalogModal(false)}
                                    className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isProcessingCatalog}
                                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-all shadow-lg disabled:opacity-50 cursor-pointer"
                                >
                                    {isProcessingCatalog ? 'Adding…' : 'Save Product to Store'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Bottom Gallery Footer */}
            <footer className="relative z-10 border-t border-white/10 py-8 px-6 text-center text-xs text-slate-400 mt-16">
                <div className="flex flex-wrap justify-center items-center gap-6">
                    <span>© 2026 Line and Layer Gallery</span>
                    <button 
                        onClick={() => setShowTAC(true)} 
                        className="text-slate-300 hover:text-cyan-400 underline font-medium transition-colors cursor-pointer"
                    >
                        Terms & Conditions
                    </button>
                    <button 
                        onClick={() => setShowDelivery(true)} 
                        className="text-slate-300 hover:text-cyan-400 underline font-medium transition-colors cursor-pointer"
                    >
                        Delivery Instructions
                    </button>
                    <button 
                        onClick={() => setShowContact(true)} 
                        className="text-slate-300 hover:text-cyan-400 underline font-medium transition-colors cursor-pointer"
                    >
                        Contact for query
                    </button>
                </div>
            </footer>

            {/* Terms & Conditions Modal */}
            {typeof TAC !== 'undefined' && <TAC isOpen={showTAC} onClose={() => setShowTAC(false)} />}

            {/* Delivery Instructions Modal */}
            {typeof DeliveryInstructions !== 'undefined' && <DeliveryInstructions isOpen={showDelivery} onClose={() => setShowDelivery(false)} />}

            {/* Contact for Query Modal */}
            {typeof ContactQueryModal !== 'undefined' && (
                <ContactQueryModal isOpen={showContact} onClose={() => setShowContact(false)} />
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
