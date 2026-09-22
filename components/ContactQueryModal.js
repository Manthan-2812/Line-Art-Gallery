// ─────────────────────────────────────────────────────────────────────────────
// components/ContactQueryModal.js
//
// Contact for Delivery & Product Queries Modal
// Displays direct support contacts for Delhivery, Qikink, and Gallery Owner.
// Available only to logged-in users via Navbar & Footer.
// ─────────────────────────────────────────────────────────────────────────────

function ContactQueryModal({ isOpen, onClose }) {
    if (!isOpen) return null;

    return (
        <div 
            className="tac-modal-backdrop fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md transition-all duration-300"
            onClick={onClose}
        >
            <div 
                className="bg-slate-900 border border-white/15 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto text-slate-200"
                onClick={(e) => e.stopPropagation()}
                style={{ boxShadow: '0 25px 60px -15px rgba(0,0,0,0.9)' }}
            >
                {/* Close Cross Button */}
                <button
                    onClick={onClose}
                    className="absolute top-5 right-5 text-slate-400 hover:text-white w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors z-10 text-lg cursor-pointer"
                    title="Close"
                >
                    ✕
                </button>

                {/* Header */}
                <div className="mb-6 pb-4 border-b border-white/10">
                    <span className="inline-block bg-cyan-500/20 text-cyan-300 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-2">
                        Customer Support
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
                        For delivery or product queries Contact :
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-400 mt-1">
                        We are here to help track your order, answer printing queries, or assist with your purchases.
                    </p>
                </div>

                {/* Options List */}
                <div className="space-y-4">
                    {/* 1. Courier Partner: Delhivery Limited */}
                    <div className="bg-slate-800/80 border border-white/10 rounded-2xl p-4 sm:p-5 hover:border-cyan-400/40 transition-all">
                        <h3 className="text-base sm:text-lg font-bold text-white mb-1.5">Courier Partner :</h3>
                        <p className="text-sm font-semibold text-cyan-400 mb-2">
                            <a 
                                href="https://delhivery.com/" 
                                target="_blank" 
                                rel="noreferrer"
                                className="underline hover:text-cyan-300 transition-colors inline-flex items-center gap-1"
                            >
                                <span>Delhivery Limited (delhivery.com)</span>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                            </a>
                        </p>
                        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                            You can enter your phone number from which you ordered or enter the <strong>Tracking ID / AWB Number</strong> received in your confirmation email from Qikink into the AWB tracking input field on Delhivery.
                        </p>
                    </div>

                    {/* OR Divider */}
                    <div className="flex items-center justify-center gap-3 py-1">
                        <div className="h-px bg-white/10 flex-1" />
                        <span className="text-xs font-bold uppercase tracking-widest text-slate-500 bg-slate-900 px-3 py-0.5 rounded-full border border-white/10">OR</span>
                        <div className="h-px bg-white/10 flex-1" />
                    </div>

                    {/* 2. Printing Partner : QikInk */}
                    <div className="bg-slate-800/80 border border-white/10 rounded-2xl p-4 sm:p-5 hover:border-purple-400/40 transition-all">
                        <h3 className="text-base sm:text-lg font-bold text-white mb-1.5">Printing Partner : QikInk</h3>
                        <p className="text-sm font-semibold text-purple-300 mb-2">
                            Email: <a href="mailto:care@qikink.com" className="underline hover:text-purple-200 transition-colors">care@qikink.com</a>
                        </p>
                        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                            You can email about any specific order query regarding delivery status and production. You simply need to mention the <strong>Order Number</strong> received in your email when your order was dispatched from Qikink.
                        </p>
                    </div>

                    {/* OR Divider */}
                    <div className="flex items-center justify-center gap-3 py-1">
                        <div className="h-px bg-white/10 flex-1" />
                        <span className="text-xs font-bold uppercase tracking-widest text-slate-500 bg-slate-900 px-3 py-0.5 rounded-full border border-white/10">OR</span>
                        <div className="h-px bg-white/10 flex-1" />
                    </div>

                    {/* 3. Mail Me (Gallery Owner) */}
                    <div className="bg-slate-800/80 border border-white/10 rounded-2xl p-4 sm:p-5 hover:border-emerald-400/40 transition-all">
                        <h3 className="text-base sm:text-lg font-bold text-white mb-1.5">Mail Me :</h3>
                        <p className="text-sm font-semibold text-emerald-400 mb-2">
                            Email: <a href="mailto:lineartgallery28@gmail.com" className="underline hover:text-emerald-300 transition-colors">lineartgallery28@gmail.com</a>
                        </p>
                        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                            Just email me your <strong>Order Invoice PDF</strong> and Query.
                        </p>
                    </div>
                </div>

                {/* Footer Action */}
                <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2.5 bg-white hover:bg-slate-200 text-slate-950 font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md cursor-pointer"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

window.ContactQueryModal = ContactQueryModal;
