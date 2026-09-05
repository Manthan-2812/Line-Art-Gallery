// ─────────────────────────────────────────────────────────────────────────────
// components/OrderHistoryDrawer.js
//
// Slide-over side drawer displaying Customer Order History & Invoices.
// ─────────────────────────────────────────────────────────────────────────────

function OrderHistoryDrawer({ isOpen, onClose }) {
    const { useState, useEffect } = React;
    const [orders, setOrders]     = useState([]);
    const [loading, setLoading]   = useState(false);
    const [error, setError]       = useState('');
    const [selectedInvoice, setSelectedInvoice] = useState(null);

    const userState = (window.useClerkUser && window.useClerkUser()) || {};
    const isSignedIn = userState.isSignedIn;

    useEffect(() => {
        if (!isOpen) {
            setSelectedInvoice(null);
            return;
        }

        if (window.Clerk && window.Clerk.user) {
            setLoading(true);
            setError('');
            window.Clerk.session.getToken()
                .then(token => fetch('/api/get-orders', { headers: { 'Authorization': `Bearer ${token}` } }))
                .then(res => res.json())
                .then(data => {
                    if (data.orders) setOrders(data.orders);
                    else setError(data.error || 'Could not load orders');
                })
                .catch(err => setError(err.message))
                .finally(() => setLoading(false));
        }
    }, [isOpen, isSignedIn]);

    if (!isOpen) return null;

    const openSignIn = () => {
        if (window.Clerk) window.Clerk.openSignIn({ appearance: window.CLERK_APPEARANCE });
    };

    return (
        <div className="fixed inset-0 z-[70] flex justify-end">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Side Drawer */}
            <div className="relative w-full max-w-lg sm:max-w-xl bg-slate-900 border-l border-white/10 h-full flex flex-col shadow-2xl z-10 overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex items-center justify-between bg-slate-900/95 shrink-0">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
                            <span>📦</span>
                            <span>My Orders & Invoices</span>
                        </h2>
                        <p className="text-sm text-slate-400 mt-0.5">Track fulfillment & download receipts</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white p-2.5 rounded-xl hover:bg-slate-800 transition-colors text-lg"
                    >
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                    {!isSignedIn ? (
                        <div className="text-center py-16">
                            <div className="w-20 h-20 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 flex items-center justify-center mx-auto mb-5 text-3xl">
                                🔐
                            </div>
                            <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Sign in to view orders</h3>
                            <p className="text-sm text-slate-300 mb-6 max-w-sm mx-auto leading-relaxed">
                                View your purchases, real-time printing status, and official tax invoices.
                            </p>
                            <button
                                onClick={openSignIn}
                                className="px-8 py-3.5 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold rounded-2xl text-sm transition-all shadow-lg hover:scale-105"
                            >
                                Sign In / Sign Up
                            </button>
                        </div>
                    ) : loading ? (
                        <div className="text-center py-20">
                            <div className="w-10 h-10 border-3 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                            <p className="text-sm text-slate-300 font-medium">Loading your purchases…</p>
                        </div>
                    ) : error ? (
                        <div className="p-5 bg-red-500/10 border border-red-500/30 rounded-2xl text-sm text-red-300">
                            {error}
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="w-20 h-20 rounded-2xl bg-slate-800 border border-white/10 flex items-center justify-center mx-auto mb-5 text-3xl">
                                🖼️
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">No orders yet</h3>
                            <p className="text-sm text-slate-300 max-w-xs mx-auto mb-6">Browse the gallery and pick your favorite wearable art piece!</p>
                            <a
                                href="gallery.html"
                                onClick={onClose}
                                className="inline-block px-7 py-3 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/30 font-bold rounded-2xl text-sm transition-all"
                            >
                                Explore Gallery &rarr;
                            </a>
                        </div>
                    ) : (
                        orders.map((ord) => {
                            const dateStr = new Date(ord.createdAt).toLocaleDateString('en-IN', {
                                day: 'numeric', month: 'short', year: 'numeric'
                            });
                            const isSubmitted = ord.fulfillment === 'submitted';

                            return (
                                <div
                                    key={ord.id}
                                    className="bg-slate-800/60 border border-white/10 rounded-2xl p-5 transition-all hover:border-cyan-400/40 shadow-lg"
                                >
                                    <div className="flex gap-4 mb-4">
                                        <img
                                            src={ord.printUrl || 'https://res.cloudinary.com/demo/image/upload/sample.jpg'}
                                            alt=""
                                            className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl border border-white/10 shrink-0 shadow-md"
                                        />
                                        <div className="min-w-0 flex-1">
                                            <div className="flex justify-between items-start">
                                                <h4 className="text-base font-bold text-white truncate">{ord.artName}</h4>
                                                <span className="text-base font-extrabold text-cyan-400">₹{ord.amount}</span>
                                            </div>
                                            <p className="text-xs text-slate-300 mt-1">Format: {ord.sku || 'T-Shirt Print'}</p>
                                            <p className="text-xs text-slate-400 mt-0.5">{dateStr} • Order #{ord.orderId.slice(-8)}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs sm:text-sm">
                                        <span className={`inline-flex items-center gap-2 font-semibold ${
                                            isSubmitted ? 'text-cyan-300' : 'text-amber-300'
                                        }`}>
                                            <span className={`w-2 h-2 rounded-full ${isSubmitted ? 'bg-cyan-400 animate-pulse' : 'bg-amber-400'}`} />
                                            {isSubmitted ? 'Sent for Printing (QikInk)' : 'Payment Verified'}
                                        </span>

                                        <button
                                            onClick={() => setSelectedInvoice(ord)}
                                            className="font-bold text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1.5 py-1 px-2.5 rounded-lg hover:bg-cyan-500/10"
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                                            View Invoice
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Invoice Modal Preview inside Drawer */}
                {selectedInvoice && (
                    <div className="absolute inset-0 bg-slate-950 z-30 flex flex-col p-6 overflow-y-auto">
                        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5 shrink-0">
                            <div>
                                <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                                    <span>🧾</span>
                                    <span>Invoice Details</span>
                                </h3>
                                <p className="text-xs text-slate-400 mt-0.5">Order #{selectedInvoice.orderId.slice(-12)}</p>
                            </div>
                            <button
                                onClick={() => setSelectedInvoice(null)}
                                className="text-xs sm:text-sm font-semibold text-slate-200 hover:text-white px-3.5 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors shrink-0"
                            >
                                &larr; Back to List
                            </button>
                        </div>

                        <div className="bg-slate-900 border border-white/10 rounded-2xl p-5 text-sm text-slate-300 space-y-3.5 mb-6 shadow-xl">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400">Order ID:</span>
                                <span className="font-mono text-white font-semibold text-xs sm:text-sm break-all">{selectedInvoice.orderId}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400">Payment ID:</span>
                                <span className="font-mono text-cyan-400 text-xs sm:text-sm break-all">{selectedInvoice.paymentId}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Artwork:</span>
                                <span className="font-semibold text-white">{selectedInvoice.artName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">SKU / Variant:</span>
                                <span>{selectedInvoice.sku}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Amount Paid:</span>
                                <span className="font-bold text-white text-base">₹{selectedInvoice.amount}</span>
                            </div>
                            <div className="flex justify-between pt-2 border-t border-white/5">
                                <span className="text-slate-400">Shipping To:</span>
                                <span className="text-right text-slate-200">
                                    {(selectedInvoice.shipping && selectedInvoice.shipping.fullName) || 'Customer'}<br/>
                                    {(selectedInvoice.shipping && selectedInvoice.shipping.city) || ''}
                                </span>
                            </div>
                        </div>

                        <button
                            onClick={() => window.print()}
                            className="w-full py-4 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold rounded-2xl text-sm sm:text-base transition-all shadow-lg flex items-center justify-center gap-2"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                            Print / Save PDF Receipt
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

window.OrderHistoryDrawer = OrderHistoryDrawer;
