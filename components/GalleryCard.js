// ─────────────────────────────────────────────────────────────────────────────
// components/GalleryCard.js
//
// Gallery Card Component:
//   • Liked state (synced with user account / localStorage)
//   • T-Shirt buy modal with Color & Size selection
//   • Admin controls (Pin, Rename, Delete)
//   • Responsive image loading with Cloudinary auto-format & lazy loading
// ─────────────────────────────────────────────────────────────────────────────

function GalleryCard({ image, isAdmin, onDelete, onUpdate, onPin, onRename, onUpdatePrice, isNewestRecent }) {
    const { useState, useEffect, useRef } = React;
    const [showDeliveryModal, setShowDeliveryModal] = useState(false);

    // Initialise liked state from user-specific Set or local Set
    const isArtLiked = () => {
        if (window.__userLikedIds && window.__userLikedIds instanceof Set) {
            return window.__userLikedIds.has(image.id);
        }
        return getLikedSet().has(image.id);
    };

    const currentPrice = (image.price !== undefined && image.price !== null && !isNaN(Number(image.price))) 
        ? Number(image.price) 
        : 900;

    const currentBlueOffset = (image.blueOffset !== undefined && image.blueOffset !== null && !isNaN(Number(image.blueOffset))) 
        ? Number(image.blueOffset) 
        : 50;

    const [liked, setLiked]                 = useState(isArtLiked);
    const [imgLoaded, setImgLoaded]         = useState(false);
    const [editingName, setEditingName]     = useState(false);
    const [nameDraft, setNameDraft]         = useState('');
    const [editingPriceModal, setEditingPriceModal] = useState(false);
    const [priceDraft, setPriceDraft]       = useState(currentPrice);
    const [blueOffsetDraft, setBlueOffsetDraft] = useState(currentBlueOffset);
    const titleInputRef                     = useRef(null);
    
    // Purchase modal state: selected Color, Size, Print Placement & Quantity (Bulk Order)
    const [showBuy, setShowBuy]             = useState(false);
    const [showMockupModal, setShowMockupModal] = useState(false);
    const [showDualPrintWarning, setShowDualPrintWarning] = useState(false);
    const [selectedColor, setSelectedColor] = useState('Wh');
    const [selectedSize, setSelectedSize]   = useState('M');
    const [printSide, setPrintSide]         = useState('front'); // 'front' | 'both'
    const [quantity, setQuantity]           = useState(1);

    // Dynamic price based on color selection & custom blue offset & dual print offset (+₹200)
    const colorOffset = selectedColor === 'Nb' ? currentBlueOffset : 0;
    const printOffset = printSide === 'both' ? 200 : 0;
    const unitPrice   = currentPrice + colorOffset + printOffset;
    const totalPrice  = unitPrice * Math.max(1, quantity);

    // Re-sync if a parent re-renders this card with a different image.id or likes change
    useEffect(() => {
        setLiked(isArtLiked());
    }, [image.id, window.__userLikedIds]);

    useEffect(() => {
        setPriceDraft(currentPrice);
        setBlueOffsetDraft(currentBlueOffset);
    }, [image.price, image.blueOffset]);

    // Auto-select title text when entering rename mode (admin)
    useEffect(() => {
        if (editingName && titleInputRef.current) {
            setTimeout(() => titleInputRef.current && titleInputRef.current.select(), 50);
        }
    }, [editingName]);

    const artworkName = image.name || 'Untitled Artwork';

    // Admin rename: enter edit mode, persist on save
    const startEditName = () => { setNameDraft(image.name || ''); setEditingName(true); };
    const saveName = () => {
        const trimmed = nameDraft.trim();
        setEditingName(false);
        if (onRename && trimmed !== (image.name || '')) {
            onRename(image.id, trimmed || 'Untitled Artwork');
        }
    };

    // Admin price edit
    const savePriceAndOffset = (e) => {
        if (e && e.preventDefault) e.preventDefault();
        setEditingPriceModal(false);
        const parsedP = Number(priceDraft);
        const parsedO = Number(blueOffsetDraft);
        if (!isNaN(parsedP) && parsedP > 0 && !isNaN(parsedO) && parsedO >= 0) {
            if (onUpdatePrice) onUpdatePrice(image.id, parsedP, parsedO);
        }
    };

    // Navigate to checkout with chosen SKU, artwork price and quantity
    const proceedToCheckout = () => {
        const sku = `MVnHs-${selectedColor}-${selectedSize}`;
        const colorObj = (window.PRODUCT_COLORS || []).find(c => c.id === selectedColor);
        const colorName = colorObj ? colorObj.name : 'Classic White';
        const finalQty = Math.max(1, parseInt(quantity, 10) || 1);
        
        const params = new URLSearchParams({
            art:       image.id,
            name:      artworkName,
            img:       image.url,
            sku:       sku,
            price:     String(totalPrice),
            unitPrice: String(unitPrice),
            quantity:  String(finalQty),
            color:     colorName,
            size:      selectedSize,
            printSide: printSide
        });
        window.location.href = `checkout.html?${params.toString()}`;
    };

    // Toggle like: account-based if signed in with Clerk, or fallback to local
    const handleLike = async () => {
        if (window.Clerk && window.Clerk.user) {
            try {
                const token = await window.Clerk.session.getToken();
                const res = await fetch('/api/toggle-like', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ artId: image.id })
                });
                const data = await res.json();
                if (data.ok) {
                    const nowLiked = data.liked;
                    setLiked(nowLiked);
                    if (!window.__userLikedIds) window.__userLikedIds = new Set();
                    nowLiked ? window.__userLikedIds.add(image.id) : window.__userLikedIds.delete(image.id);
                }
            } catch (err) {
                console.error('Failed to toggle like:', err);
            }
        } else {
            if (window.Clerk) {
                window.Clerk.openSignIn({ appearance: window.CLERK_APPEARANCE });
            } else {
                const set   = getLikedSet();
                const delta = set.has(image.id) ? -1 : 1;
                delta === -1 ? set.delete(image.id) : set.add(image.id);
                saveLikedSet(set);
                setLiked(delta === 1);
                onUpdate(image.id, { ...image, likes: Math.max(0, image.likes + delta) });
            }
        }
    };

    // Heart Icon
    const HeartIcon = ({ filled }) => (
        <svg
            width="18" height="18"
            viewBox="0 0 24 24"
            fill={filled ? '#f472b6' : 'none'}
            stroke={filled ? '#f472b6' : 'currentColor'}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ transition: 'all 0.2s ease', filter: filled ? 'drop-shadow(0 0 6px #f472b6aa)' : 'none' }}
        >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
    );

    // Optimized Cloudinary thumbnail URL (auto-format WebP/AVIF, auto-quality, scaled width)
    const optimizedImageUrl = (typeof getPrintMasterUrl === 'function') 
        ? image.url.replace('/upload/', '/upload/f_auto,q_auto,w_800/') 
        : image.url;

    return (
        <div
            className="relative group bg-slate-800/80 rounded-xl overflow-hidden border border-slate-700/50 flex flex-col transition-all duration-300"
            data-name="GalleryCard"
        >
            {/* Admin: pin button — top-left */}
            {isAdmin && (
                <button
                    onClick={() => onPin(image.id, !!image.pinned)}
                    className={`absolute top-2 left-2 z-20 p-1.5 rounded-full transition-all duration-200 hover:scale-110 ${image.pinned ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} ${
                        image.pinned
                            ? 'bg-amber-400 text-slate-900'
                            : 'bg-slate-700/80 hover:bg-amber-400 text-white hover:text-slate-900'
                    }`}
                    title={image.pinned ? 'Unpin' : 'Pin to top'}
                >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill={image.pinned ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="17" x2="12" y2="22"/>
                        <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a1 1 0 0 0 0-2H8a1 1 0 0 0 0 2h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/>
                    </svg>
                </button>
            )}

            {/* Admin: delete button — top-right */}
            {isAdmin && (
                <button
                    onClick={() => onDelete(image.id)}
                    className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 bg-red-600 hover:bg-red-500 text-white p-1.5 rounded-full transition-all duration-200 hover:scale-110"
                    title="Delete artwork"
                >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                </button>
            )}

            {/* Image container — natural aspect ratio without cropping (Pinterest masonry) */}
            <div className="relative overflow-hidden bg-slate-900 min-h-[120px]">
                {!imgLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-800/80 min-h-[140px]">
                        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                )}
                <img
                    src={optimizedImageUrl}
                    alt={artworkName}
                    loading="lazy"
                    decoding="async"
                    onLoad={() => setImgLoaded(true)}
                    className={`w-full h-auto block group-hover:scale-[1.02] transition-transform duration-300 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
                />
            </div>

            {/* Artwork title & Rename control */}
            <div className="bg-slate-900/90 px-3 py-2 flex items-center justify-between border-t border-white/5 z-10 shrink-0 min-h-[36px]">
                {isAdmin && editingName ? (
                    <form
                        onSubmit={(e) => { e.preventDefault(); saveName(); }}
                        className="flex-1 flex items-center gap-1 min-w-0"
                    >
                        <input
                            ref={titleInputRef}
                            type="text"
                            value={nameDraft}
                            onChange={(e) => setNameDraft(e.target.value)}
                            onBlur={saveName}
                            onKeyDown={(e) => { if (e.key === 'Escape') setEditingName(false); }}
                            className="w-full bg-slate-800 border border-cyan-400 rounded px-2 py-0.5 text-xs text-white focus:outline-none"
                            autoFocus
                        />
                    </form>
                ) : (
                    <span className="flex-1 text-sm font-semibold text-slate-100 truncate" title={artworkName}>
                        {artworkName}
                    </span>
                )}
                {isAdmin && !editingName && (
                    <button
                        onClick={startEditName}
                        className="shrink-0 text-slate-400 hover:text-cyan-400 transition-colors p-1"
                        title="Rename artwork"
                    >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>
                        </svg>
                    </button>
                )}
            </div>

            {/* Action bar: Likes & Price / Admin Price Editor */}
            <div className="bg-slate-900/95 px-3 py-2 flex justify-between items-center z-10 shrink-0 border-t border-white/5 relative">
                {image.pinned && !isAdmin && (
                    <span className="bg-amber-400 text-slate-900 text-[9px] font-bold px-2 py-0.5 rounded-full pointer-events-none">
                        ★ Featured
                    </span>
                )}
                <button
                    onClick={handleLike}
                    className={`flex items-center gap-1.5 transition-transform duration-150 hover:scale-110 ${liked ? 'text-pink-400' : 'text-slate-400 hover:text-pink-300'}`}
                    title={liked ? 'Unlike' : 'Like'}
                >
                    <HeartIcon filled={liked} />
                    <span className="text-xs font-semibold tabular-nums">{image.likes}</span>
                </button>

                <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-slate-300">₹{currentPrice}</span>
                    {isAdmin && (
                        <button
                            onClick={() => setEditingPriceModal(true)}
                            className="text-slate-400 hover:text-cyan-400 p-0.5 transition-colors"
                            title="Edit artwork price & Navy Blue offset"
                        >
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                <path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            {/* Individual Card Price & Offset Edit Modal (Admin) */}
            {isAdmin && editingPriceModal && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                    onClick={() => setEditingPriceModal(false)}
                >
                    <div 
                        className="bg-slate-900 border border-white/15 rounded-3xl p-6 max-w-sm w-full shadow-2xl relative"
                        onClick={e => e.stopPropagation()}
                    >
                        <h4 className="text-base font-bold text-white mb-1">Edit Artwork Price</h4>
                        <p className="text-xs text-slate-400 mb-4">{artworkName}</p>

                        <form onSubmit={savePriceAndOffset} className="space-y-3">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                                    Base Price (INR ₹)
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={priceDraft}
                                    onChange={e => setPriceDraft(e.target.value)}
                                    className="w-full bg-slate-800 border border-white/20 rounded-xl px-3 py-2 text-white font-bold text-sm focus:outline-none focus:border-cyan-400"
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                                    Navy Blue Extra Offset (+INR ₹)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={blueOffsetDraft}
                                    onChange={e => setBlueOffsetDraft(e.target.value)}
                                    className="w-full bg-slate-800 border border-white/20 rounded-xl px-3 py-2 text-white font-bold text-sm focus:outline-none focus:border-cyan-400"
                                />
                                <p className="text-[10px] text-cyan-300 mt-1">
                                    Navy Blue will cost: ₹{(Number(priceDraft) || 0) + (Number(blueOffsetDraft) || 0)}
                                </p>
                            </div>

                            <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                                <button
                                    type="button"
                                    onClick={() => setEditingPriceModal(false)}
                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-1.5 rounded-lg text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-all"
                                >
                                    Save Price
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Buy button */}
            <button
                onClick={() => setShowBuy(true)}
                className="w-full text-white text-xs font-bold py-2.5 hover:opacity-90 transition-opacity z-10 shrink-0 flex items-center justify-center gap-1.5 shadow-md"
                style={{ background: 'linear-gradient(90deg,#06b6d4,#6366f1)' }}
            >
                <span>Buy T-Shirt Print</span>
            </button>

            {/* T-Shirt Color, Size & Quantity selection modal */}
            {showBuy && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                    onClick={() => setShowBuy(false)}
                >
                    <div
                        className="relative w-full max-w-lg rounded-3xl border border-white/15 p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
                        style={{ background: 'rgba(15,23,42,0.98)', boxShadow: '0 25px 60px -15px rgba(0,0,0,0.8)' }}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Top-Right Close Cross Button */}
                        <button
                            type="button"
                            onClick={() => setShowBuy(false)}
                            className="absolute top-5 right-5 text-slate-400 hover:text-white w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-lg z-10"
                            title="Close"
                        >
                            ✕
                        </button>

                        <div className="flex items-center gap-4 sm:gap-5 mb-6 pb-5 border-b border-white/10 pr-6">
                            <img src={image.url} alt="" className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-2xl border border-white/15 shadow-xl shrink-0" />
                            <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-1">Premium Wearable Art</p>
                                <p className="text-lg sm:text-2xl font-bold text-white truncate">{artworkName}</p>
                                <p className="text-xs sm:text-sm text-slate-400 mt-1">100% Combed Cotton • 180 GSM • Front DTG Print</p>
                            </div>
                        </div>

                        {/* 1. Color Selector */}
                        <div className="mb-6">
                            <label className="block text-xs sm:text-sm font-bold text-slate-200 uppercase tracking-wider mb-3">
                                1. Select T-Shirt Color
                            </label>
                            <div className="grid grid-cols-3 gap-3">
                                {(window.PRODUCT_COLORS || []).map(c => {
                                    const active = selectedColor === c.id;
                                    const cOffset = c.id === 'Nb' ? currentBlueOffset : 0;
                                    const colorPrice = currentPrice + cOffset;
                                    return (
                                        <button
                                            key={c.id}
                                            type="button"
                                            onClick={() => setSelectedColor(c.id)}
                                            className={`relative flex flex-col items-center gap-2 p-3 sm:p-4 rounded-2xl border transition-all ${
                                                active ? 'border-cyan-400 bg-cyan-500/20 shadow-md ring-1 ring-cyan-400' : 'border-white/10 bg-slate-800/60 hover:border-white/30'
                                            }`}
                                        >
                                            <span
                                                className="w-6 h-6 sm:w-7 sm:h-7 rounded-full border shadow-md"
                                                style={{ backgroundColor: c.hex, borderColor: c.border }}
                                            />
                                            <div className="text-center">
                                                <span className={`block text-xs sm:text-sm font-semibold ${active ? 'text-cyan-300 font-bold' : 'text-slate-300'}`}>
                                                    {c.name.split(' ')[1] || c.name}
                                                </span>
                                                <span className="block text-[10px] text-slate-400 mt-0.5">
                                                    ₹{colorPrice}
                                                </span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 2. Size Selector */}
                        <div className="mb-6">
                            <label className="block text-xs sm:text-sm font-bold text-slate-200 uppercase tracking-wider mb-3">
                                2. Select Size
                            </label>
                            <div className="grid grid-cols-5 gap-2.5">
                                {(window.PRODUCT_SIZES || []).map(s => {
                                    const active = selectedSize === s.size;
                                    return (
                                        <button
                                            key={s.size}
                                            type="button"
                                            onClick={() => setSelectedSize(s.size)}
                                            className={`py-3 sm:py-3.5 rounded-2xl border font-bold text-sm sm:text-base transition-all ${
                                                active
                                                    ? 'bg-cyan-400 text-slate-950 border-cyan-400 shadow-lg scale-105'
                                                    : 'bg-slate-800 border-white/10 text-slate-200 hover:border-cyan-400/50'
                                            }`}
                                        >
                                            {s.size}
                                        </button>
                                    );
                                })}
                            </div>
                            <p className="text-xs sm:text-sm text-slate-400 text-center mt-3">
                                Selected: <span className="text-white font-bold">{
                                    ((window.PRODUCT_SIZES || []).find(s => s.size === selectedSize) || {}).label
                                }</span>
                            </p>
                        </div>

                        {/* 3. Mandatory Print Placement Selector */}
                        <div className="mb-6">
                            <div className="flex justify-between items-center mb-3">
                                <label className="block text-xs sm:text-sm font-bold text-slate-200 uppercase tracking-wider">
                                    3. Print Placement <span className="text-cyan-400">*</span>
                                </label>
                                <span className="text-[11px] font-bold text-cyan-300">Mandatory Selection</span>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setPrintSide('front')}
                                    className={`p-3.5 rounded-2xl border text-left transition-all relative ${
                                        printSide === 'front'
                                            ? 'border-cyan-400 bg-cyan-500/20 ring-1 ring-cyan-400 shadow-md'
                                            : 'border-white/10 bg-slate-800/60 hover:border-white/30 text-slate-300'
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-extrabold text-sm text-white">Front Only</span>
                                        {printSide === 'front' && <span className="text-cyan-400 text-xs font-bold">✓</span>}
                                    </div>
                                    <p className="text-[11px] text-slate-400">Standard single side print (+₹0)</p>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        if (printSide !== 'both') {
                                            setShowDualPrintWarning(true);
                                        }
                                    }}
                                    className={`p-3.5 rounded-2xl border text-left transition-all relative ${
                                        printSide === 'both'
                                            ? 'border-cyan-400 bg-cyan-500/20 ring-1 ring-cyan-400 shadow-md'
                                            : 'border-white/10 bg-slate-800/60 hover:border-white/30 text-slate-300'
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-extrabold text-sm text-white">Front & Back</span>
                                        <span className="text-[10px] font-bold bg-cyan-400 text-slate-950 px-1.5 py-0.5 rounded-full">+₹200</span>
                                    </div>
                                    <p className="text-[11px] text-slate-400">Double-sided premium print</p>
                                </button>
                            </div>
                        </div>

                        {/* 4. Quantity / Bulk Order Selector */}
                        <div className="mb-6">
                            <div className="flex justify-between items-center mb-3">
                                <label className="block text-xs sm:text-sm font-bold text-slate-200 uppercase tracking-wider">
                                    4. Quantity (Bulk Order)
                                </label>
                                <span className="text-[11px] text-slate-400">Default: 1 Item</span>
                            </div>
                            <div className="flex items-center gap-3 bg-slate-800/80 border border-white/10 p-2.5 rounded-2xl">
                                <button
                                    type="button"
                                    onClick={() => setQuantity(q => Math.max(1, (parseInt(q, 10) || 1) - 1))}
                                    className="w-10 h-10 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-extrabold text-lg flex items-center justify-center transition-colors disabled:opacity-40"
                                    disabled={quantity <= 1}
                                >
                                    −
                                </button>
                                <input
                                    type="number"
                                    min="1"
                                    step="1"
                                    value={quantity}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/[^0-9]/g, '');
                                        setQuantity(val === '' ? '' : Math.max(1, parseInt(val, 10)));
                                    }}
                                    onBlur={() => {
                                        if (!quantity || isNaN(Number(quantity)) || Number(quantity) < 1) {
                                            setQuantity(1);
                                        }
                                    }}
                                    className="flex-1 bg-slate-900 border border-white/15 rounded-xl py-2 px-3 text-center text-white font-bold text-lg focus:outline-none focus:border-cyan-400"
                                    placeholder="1"
                                />
                                <button
                                    type="button"
                                    onClick={() => setQuantity(q => (parseInt(q, 10) || 1) + 1)}
                                    className="w-10 h-10 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-extrabold text-lg flex items-center justify-center transition-colors"
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        {/* Summary & Price */}
                        <div className="bg-slate-800/60 border border-white/10 rounded-2xl p-4 sm:p-5 mb-6 flex justify-between items-center">
                            <div>
                                <span className="text-xs sm:text-sm text-slate-400 uppercase tracking-wider font-semibold">Total Price</span>
                                <div className="text-[11px] text-slate-400 mt-0.5">
                                    {quantity > 1 ? (
                                        <span className="text-cyan-300 font-medium">₹{unitPrice} × {quantity} items</span>
                                    ) : (
                                        <span>₹{unitPrice} ({printSide === 'both' ? 'Double Sided' : 'Single Sided'}{colorOffset > 0 ? ' • Navy Blue' : ''})</span>
                                    )}
                                </div>
                            </div>
                            <span className="text-2xl sm:text-3xl font-extrabold text-cyan-400">₹{totalPrice}</span>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowBuy(false)}
                                className="w-1/3 text-xs sm:text-sm font-semibold text-slate-400 hover:text-white py-3.5 sm:py-4 bg-slate-800/70 hover:bg-slate-800 rounded-2xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    setShowBuy(false);
                                    setShowMockupModal(true);
                                }}
                                className="w-2/3 text-xs sm:text-sm font-bold text-slate-950 py-3.5 sm:py-4 bg-cyan-400 hover:bg-cyan-300 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-1.5"
                            >
                                <span>Preview Product &rarr;</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Realistic T-Shirt Product Preview Modal (Front & Back) */}
            {typeof ProductMockupModal !== 'undefined' && (
                <ProductMockupModal
                    isOpen={showMockupModal}
                    onClose={() => {
                        setShowMockupModal(false);
                        setShowBuy(true);
                    }}
                    onProceed={() => {
                        setShowMockupModal(false);
                        setShowDeliveryModal(true);
                    }}
                    artwork={image}
                    selectedColor={selectedColor}
                    selectedSize={selectedSize}
                    printSide={printSide}
                    quantity={Math.max(1, parseInt(quantity, 10) || 1)}
                    price={totalPrice}
                />
            )}

            {/* Delivery Instructions Gate Modal */}
            {typeof DeliveryInstructions !== 'undefined' && (
                <DeliveryInstructions
                    isOpen={showDeliveryModal}
                    onClose={() => setShowDeliveryModal(false)}
                    onProceed={proceedToCheckout}
                />
            )}

            {/* Double-Sided Print (+₹200) Notice & Warning Card Modal */}
            {showDualPrintWarning && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-all"
                    onClick={() => setShowDualPrintWarning(false)}
                >
                    <div 
                        className="bg-slate-900 border border-amber-400/40 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl relative"
                        onClick={e => e.stopPropagation()}
                        style={{ boxShadow: '0 25px 60px -15px rgba(245,158,11,0.25)' }}
                    >
                        {/* Cross Button */}
                        <button
                            type="button"
                            onClick={() => setShowDualPrintWarning(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-white w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-lg"
                            title="Close"
                        >
                            ✕
                        </button>

                        <div className="flex items-start gap-3.5 mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center shrink-0 text-2xl">
                                ⚠️
                            </div>
                            <div>
                                <span className="inline-block bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-1">
                                    Print Placement Notice
                                </span>
                                <h3 className="text-xl font-extrabold text-white leading-tight">
                                    Double-Sided Print Fee (+₹200)
                                </h3>
                            </div>
                        </div>

                        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4">
                            Selecting <strong className="text-white">Front & Back</strong> printing adds an extra <strong className="text-amber-300 font-bold">₹200</strong> per T-shirt for the second high-definition DTG print run on the back.
                        </p>

                        <div className="bg-slate-800/80 rounded-2xl p-3.5 border border-white/10 mb-5 text-xs text-slate-300 space-y-1">
                            <div className="flex justify-between">
                                <span>Single Side Unit Price:</span>
                                <span className="font-semibold text-white">₹{currentPrice + colorOffset}</span>
                            </div>
                            <div className="flex justify-between text-amber-300 font-bold">
                                <span>Back Print Fee:</span>
                                <span>+₹200</span>
                            </div>
                            <div className="border-t border-white/10 pt-1.5 flex justify-between text-white font-extrabold text-sm">
                                <span>New Unit Price:</span>
                                <span className="text-cyan-400">₹{currentPrice + colorOffset + 200}</span>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setShowDualPrintWarning(false)}
                                className="w-1/3 py-3 bg-slate-800 hover:bg-slate-700 text-xs sm:text-sm font-bold text-slate-300 hover:text-white rounded-2xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setPrintSide('both');
                                    setShowDualPrintWarning(false);
                                }}
                                className="w-2/3 py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 text-xs sm:text-sm font-extrabold rounded-2xl transition-all shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                                <span>✓ OK, I Agree (+₹200)</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

window.GalleryCard = GalleryCard;