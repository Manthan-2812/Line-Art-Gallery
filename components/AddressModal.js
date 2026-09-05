// ─────────────────────────────────────────────────────────────────────────────
// components/AddressModal.js
//
// Modal for users to view/edit their shipping address.
// ─────────────────────────────────────────────────────────────────────────────

function AddressModal({ onClose, address, onSaved }) {
    const { useState } = React;

    const [form, setForm] = useState(address || {
        fullName: '', phone: '', address1: '', address2: '', city: '', state: '', pincode: ''
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        try {
            const token = await window.Clerk.session.getToken();
            const res = await fetch('/api/save-address', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(form)
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to save');
            }

            if (onSaved) onSaved(form);
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <div className="bg-slate-900 border border-white/15 p-6 sm:p-8 rounded-2xl w-full max-w-lg shadow-2xl relative max-h-[90vh] overflow-y-auto">
                <button
                    onClick={onClose}
                    className="absolute top-5 right-5 text-slate-400 hover:text-white transition-colors p-1"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white mb-1">Shipping Address</h2>
                <p className="text-xs text-slate-400 mb-5">Saved to your account for fast, secure delivery.</p>
                
                {error && <div className="text-red-400 text-xs bg-red-500/10 border border-red-500/30 px-3 py-2 rounded-lg mb-4">{error}</div>}

                <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
                    <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                        <input name="fullName" value={form.fullName} onChange={handleChange} required placeholder="Recipient name"
                            className="w-full bg-slate-800/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number</label>
                        <input name="phone" value={form.phone} onChange={handleChange} required placeholder="10-digit mobile number"
                            className="w-full bg-slate-800/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Address Line 1</label>
                        <input name="address1" value={form.address1} onChange={handleChange} required placeholder="House / Flat / Building / Street"
                            className="w-full bg-slate-800/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Address Line 2 (Optional)</label>
                        <input name="address2" value={form.address2} onChange={handleChange} placeholder="Landmark / Area"
                            className="w-full bg-slate-800/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1">City</label>
                            <input name="city" value={form.city} onChange={handleChange} required placeholder="City"
                                className="w-full bg-slate-800/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1">State</label>
                            <input name="state" value={form.state} onChange={handleChange} required placeholder="State"
                                className="w-full bg-slate-800/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors" />
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">PIN Code</label>
                        <input name="pincode" value={form.pincode} onChange={handleChange} required placeholder="6-digit PIN code"
                            className="w-full bg-slate-800/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors" />
                    </div>

                    <button type="submit" disabled={saving}
                        className="mt-3 w-full text-white font-bold py-3 rounded-xl shadow-lg transition-all hover:opacity-90 disabled:opacity-50"
                        style={{ background: 'linear-gradient(135deg,#06b6d4,#6366f1)' }}>
                        {saving ? 'Saving…' : 'Save Address'}
                    </button>
                </form>
            </div>
        </div>
    );
}

window.AddressModal = AddressModal;
