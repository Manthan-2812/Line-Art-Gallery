// ─────────────────────────────────────────────────────────────────────────────
// components/ProductMockupModal.js
// High-Definition Interactive T-Shirt Preview (Front & Back) with Artwork Overlay
// ─────────────────────────────────────────────────────────────────────────────

function ProductMockupModal({ isOpen, onClose, onProceed, artwork, selectedColor, selectedSize, printSide = 'front', quantity = 1, price = 900 }) {
    const { useState } = React;
    const [viewSide, setViewSide] = useState('front'); // 'front' | 'back'

    if (!isOpen || !artwork) return null;

    // High-contrast color definitions for the mockup
    const colorConfigs = {
        Wh: {
            name: 'Classic White',
            shirtBg: '#ffffff',
            shirtBorder: '#cbd5e1',
            collarColor: '#f1f5f9',
            collarBorder: '#94a3b8',
            textColor: '#0f172a',
            tagColor: '#64748b'
        },
        Bk: {
            name: 'Bold Black',
            shirtBg: '#18181b',
            shirtBorder: '#3f3f46',
            collarColor: '#27272a',
            collarBorder: '#52525b',
            textColor: '#f8fafc',
            tagColor: '#a1a1aa'
        },
        Nb: {
            name: 'Navy Blue',
            shirtBg: '#1e3a8a',
            shirtBorder: '#3b82f6',
            collarColor: '#1d4ed8',
            collarBorder: '#60a5fa',
            textColor: '#f8fafc',
            tagColor: '#93c5fd'
        }
    };

    const config = colorConfigs[selectedColor] || colorConfigs.Wh;
    const isDoubleSided = printSide === 'both';

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md transition-all duration-300"
            onClick={onClose}
        >
            <div 
                className="bg-slate-900 border border-white/15 rounded-3xl p-5 sm:p-7 max-w-xl w-full shadow-2xl relative max-h-[92vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
                style={{ boxShadow: '0 25px 60px -15px rgba(0,0,0,0.9)' }}
            >
                {/* Close Cross Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors z-10 text-lg"
                    title="Close"
                >
                    ✕
                </button>

                <div className="mb-4">
                    <span className="inline-block bg-cyan-500/20 text-cyan-300 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-1.5">
                        Realistic Product Preview
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-white truncate leading-tight">
                        {artwork.name || 'Custom Artwork Print'}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-300 mt-1">
                        Color: <strong className="text-white">{config.name}</strong> • Size: <strong className="text-white">{selectedSize}</strong> • Print: <strong className="text-cyan-300">{isDoubleSided ? 'Front & Back (Dual)' : 'Front Only'}</strong> • Qty: <strong className="text-cyan-300">{quantity}</strong>
                    </p>
                </div>

                {/* Front / Back View Switcher Toggle */}
                <div className="flex justify-center mb-4">
                    <div className="bg-slate-800 p-1.5 rounded-2xl border border-white/10 inline-flex gap-1.5 shadow-md">
                        <button
                            type="button"
                            onClick={() => setViewSide('front')}
                            className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center gap-2 ${
                                viewSide === 'front'
                                    ? 'bg-cyan-400 text-slate-950 shadow-lg scale-102'
                                    : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            <span>Front View</span>
                            <span className="text-[10px] opacity-80">(DTG Print)</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewSide('back')}
                            className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center gap-2 ${
                                viewSide === 'back'
                                    ? 'bg-cyan-400 text-slate-950 shadow-lg scale-102'
                                    : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            <span>Back View</span>
                            <span className="text-[10px] opacity-80">{isDoubleSided ? '(DTG Print)' : '(Clean Back)'}</span>
                        </button>
                    </div>
                </div>

                {/* High-Contrast Studio Mockup Stage */}
                <div className="relative w-full aspect-square max-w-[340px] sm:max-w-[380px] mx-auto mb-5 rounded-3xl bg-gradient-to-b from-slate-800 via-slate-800/80 to-slate-900 border border-cyan-400/20 p-4 flex items-center justify-center overflow-hidden shadow-[inset_0_0_40px_rgba(0,0,0,0.5)]">
                    
                    {/* Studio Ambient Radial Spotlight */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.15),transparent_70%)] pointer-events-none" />

                    {/* SVG Vector T-Shirt Silhouette with Realistic Shading */}
                    <svg 
                        viewBox="0 0 500 500" 
                        className="w-full h-full drop-shadow-[0_15px_30px_rgba(0,0,0,0.6)] transition-all duration-300"
                    >
                        <defs>
                            <linearGradient id="shirtHighlight" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="rgba(255,255,255,0.18)" />
                                <stop offset="45%" stopColor="rgba(255,255,255,0.02)" />
                                <stop offset="100%" stopColor="rgba(0,0,0,0.35)" />
                            </linearGradient>
                            <filter id="shadowFilter">
                                <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#000000" floodOpacity="0.5"/>
                            </filter>
                        </defs>

                        {/* T-Shirt Body + Sleeves Base */}
                        <path 
                            d="M 160 55 L 80 128 C 68 138, 58 175, 95 195 L 135 160 L 135 440 C 135 455, 150 465, 170 465 L 330 465 C 350 465, 365 455, 365 440 L 365 160 L 405 195 C 442 175, 432 138, 420 128 L 340 55 C 320 70, 300 75, 250 75 C 200 75, 180 70, 160 55 Z" 
                            fill={config.shirtBg}
                            stroke={config.shirtBorder}
                            strokeWidth="3"
                            filter="url(#shadowFilter)"
                        />

                        {/* Realistic Fabric Gradient Overlay */}
                        <path 
                            d="M 160 55 L 80 128 C 68 138, 58 175, 95 195 L 135 160 L 135 440 C 135 455, 150 465, 170 465 L 330 465 C 350 465, 365 455, 365 440 L 365 160 L 405 195 C 442 175, 432 138, 420 128 L 340 55 C 320 70, 300 75, 250 75 C 200 75, 180 70, 160 55 Z" 
                            fill="url(#shirtHighlight)"
                        />

                        {/* Neck Rib Collar */}
                        {viewSide === 'front' ? (
                            <path 
                                d="M 170 58 Q 250 120 330 58 Q 250 76 170 58 Z" 
                                fill={config.collarColor}
                                stroke={config.collarBorder}
                                strokeWidth="2.5"
                            />
                        ) : (
                            <path 
                                d="M 170 58 Q 250 82 330 58 Q 250 68 170 58 Z" 
                                fill={config.collarColor}
                                stroke={config.collarBorder}
                                strokeWidth="2.5"
                            />
                        )}

                        {/* Sleeve Hem Stitches */}
                        <line x1="86" y1="175" x2="120" y2="152" stroke="rgba(0,0,0,0.3)" strokeWidth="1.5" strokeDasharray="3 2" />
                        <line x1="414" y1="175" x2="380" y2="152" stroke="rgba(0,0,0,0.3)" strokeWidth="1.5" strokeDasharray="3 2" />

                        {/* Bottom Hem Stitch */}
                        <line x1="145" y1="450" x2="355" y2="450" stroke="rgba(0,0,0,0.3)" strokeWidth="1.5" strokeDasharray="4 2" />
                    </svg>

                    {/* Content on T-Shirt (Front DTG Artwork vs Back View) */}
                    {viewSide === 'front' ? (
                        <div 
                            className="absolute top-[28%] left-1/2 -translate-x-1/2 w-[36%] aspect-[3/4] max-h-[46%] rounded-md flex items-center justify-center p-1 pointer-events-none transition-all duration-300"
                            style={{
                                filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.25))',
                                mixBlendMode: selectedColor === 'Wh' ? 'multiply' : 'normal'
                            }}
                        >
                            <img 
                                src={artwork.url} 
                                alt="Front Artwork Print"
                                className="w-full h-full object-contain rounded filter contrast-105"
                            />
                        </div>
                    ) : (
                        isDoubleSided ? (
                            /* Double Sided Back Print */
                            <div 
                                className="absolute top-[28%] left-1/2 -translate-x-1/2 w-[36%] aspect-[3/4] max-h-[46%] rounded-md flex items-center justify-center p-1 pointer-events-none transition-all duration-300"
                                style={{
                                    filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.25))',
                                    mixBlendMode: selectedColor === 'Wh' ? 'multiply' : 'normal'
                                }}
                            >
                                <img 
                                    src={artwork.url} 
                                    alt="Back Artwork Print"
                                    className="w-full h-full object-contain rounded filter contrast-105"
                                />
                            </div>
                        ) : (
                            /* Clean Back View */
                            <div className="absolute top-[28%] left-1/2 -translate-x-1/2 text-center pointer-events-none px-4 py-3 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-sm">
                                <div className="inline-block px-3 py-1 rounded border border-white/15 bg-white/5 text-xs font-mono tracking-widest uppercase text-cyan-300 font-bold">
                                    Line & Layer
                                </div>
                                <p className="text-[11px] text-slate-300 mt-2 font-bold uppercase tracking-wider">
                                    100% Combed Cotton
                                </p>
                                <p className="text-[10px] text-slate-400 mt-0.5">
                                    (Clean Minimalist Back)
                                </p>
                            </div>
                        )
                    )}
                </div>

                {/* Print & Quality Specs Pills */}
                <div className="grid grid-cols-3 gap-2.5 mb-5 text-center text-xs sm:text-sm">
                    <div className="bg-slate-800/80 border border-white/10 rounded-2xl p-3 text-slate-300">
                        <span className="block text-slate-400 text-[11px] uppercase tracking-wider font-semibold">Fabric</span>
                        <span className="font-extrabold text-white text-xs sm:text-sm">180 GSM Cotton</span>
                    </div>
                    <div className="bg-slate-800/80 border border-white/10 rounded-2xl p-3 text-slate-300">
                        <span className="block text-slate-400 text-[11px] uppercase tracking-wider font-semibold">Print Placement</span>
                        <span className="font-extrabold text-cyan-300 text-xs sm:text-sm">{isDoubleSided ? 'Front & Back (+₹200)' : 'Front Only'}</span>
                    </div>
                    <div className="bg-slate-800/80 border border-white/10 rounded-2xl p-3 text-slate-300">
                        <span className="block text-slate-400 text-[11px] uppercase tracking-wider font-semibold">Total Price</span>
                        <span className="font-extrabold text-cyan-400 text-sm sm:text-base">₹{price}</span>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-1/3 py-3.5 sm:py-4 bg-slate-800 hover:bg-slate-700 text-xs sm:text-sm font-bold text-slate-300 hover:text-white rounded-2xl transition-colors"
                    >
                        &larr; Back
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            onClose();
                            if (onProceed) onProceed();
                        }}
                        className="w-2/3 py-3.5 sm:py-4 bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs sm:text-sm font-extrabold rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                    >
                        <span>Confirm & Continue &rarr;</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

window.ProductMockupModal = ProductMockupModal;
