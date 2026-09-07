function TAC({ isOpen, onClose }) {
    if (!isOpen) return null;
    return (
        <div className="min-h-screen bg-white text-black py-16 px-6 sm:px-12 lg:px-24">
    <div className="max-w-4xl mx-auto space-y-10">
        <div className="tac-modal-backdrop" onClick={onClose}>
            <div className="tac-modal-card relative" onClick={e => e.stopPropagation()}>
                <button 
                    onClick={onClose} 
                    className="absolute top-6 right-6 text-2xl font-bold text-neutral-500 hover:text-black"
                >
                    ✕
                </button>
            
        
        
        <div className="border-b-2 border-black pb-6">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-black tracking-tight">
                Terms & Conditions
            </h1>
            <p className="text-sm text-neutral-600 mt-2">
                Last updated: September 7, 2026 • Line and Layer Gallery
            </p>
        </div>

        
        <section className="space-y-3">
            <h2 className="text-xl font-bold text-black">1. Introduction &​ Acceptance</h2>
            <p className="text-base text-black leading-relaxed">
                Welcome to <strong>Line and Layer Gallery</strong> (accessible via <code>line-art-gallery.netlify.app</code>). By browsing our gallery, registering an account, or purchasing our wearable art products, you agree to comply with and be bound by these Terms and Conditions, our Privacy Policy, and all applicable laws and regulations in India.
            </p>
        </section>

       
        <section className="space-y-3">
            <h2 className="text-xl font-bold text-black">2. Products & Print-on-Demand Nature</h2>
            <p className="text-base text-black leading-relaxed">
                All apparel and t-shirts offered in our gallery feature proprietary, original line artwork. Each product is custom-printed on demand (100% Combed Cotton, 180 GSM, Direct-to-Garment print) upon order confirmation. Slight color and placement variations between your digital screen preview and physical fabric print may naturally occur due to monitor display variations and fabric texture.
            </p>
        </section>

        
        <section className="space-y-3">
            <h2 className="text-xl font-bold text-black">3. Pricing &​ Payment Processing</h2>
            <p className="text-base text-black leading-relaxed">
                All prices are listed in Indian Rupees (INR ₹) and are inclusive of standard applicable taxes. Payments are securely processed through our certified payment partner, <strong>Razorpay</strong> (supporting UPI, Debit/Credit Cards, and Net Banking). Line and Layer Gallery does not store or process sensitive credit/debit card numbers directly on its servers.
            </p>
        </section>

        
        <section className="space-y-3">
            <h2 className="text-xl font-bold text-black">4. Shipping &​ Delivery Timeline</h2>
            <p className="text-base text-black leading-relaxed">
                Because each item is custom printed on demand, production and quality checking typically take <strong>2 to 3 business days</strong>. Standard doorstep delivery across India typically takes <strong>5 to 7 business days</strong> post-dispatch via verified courier partners (Blue Dart, Delhivery, etc.). Tracking details are generated upon courier manifestation and visible in your customer dashboard.
            </p>
        </section>

        
        <section className="space-y-3">
            <h2 className="text-xl font-bold text-black">5. Cancellation &​ Replacement Policy</h2>
            <ul className="list-disc pl-6 space-y-2 text-base text-black leading-relaxed">
                <li>
                    <strong>Order Modification / Cancellation:</strong> Since orders are immediately queued for print manufacturing, cancellations or size changes can only be requested before the order goes into live production.
                </li>
                <li>
                    <strong>Damaged or Defective Items:</strong> If you receive a damaged package, misprinted artwork, or defective garment, please contact us within <strong>48 hours</strong> of delivery with clear unboxing photos/videos. We will arrange a free replacement.
                </li>
                <li>
                    <strong>Sizing:</strong> Please refer to the size chart (XS–XXL) carefully before ordering. Custom-printed garments cannot be exchanged for incorrect size choices once delivered.
                </li>
            </ul>
        </section>

        
        <section className="space-y-3">
            <h2 className="text-xl font-bold text-black">6. Intellectual Property Rights</h2>
            <p className="text-base text-black leading-relaxed">
                All artwork, line drawings, visual designs, logos, and digital assets on this website are the exclusive intellectual property of <strong>Manthan Parekh / Line and Layer Gallery</strong>. Unauthorized reproduction, resale, digital copying, or commercial exploitation without prior written consent is strictly prohibited.
            </p>
        </section>

        
        <section className="space-y-3">
            <h2 className="text-xl font-bold text-black">7. User Accounts &​ Security</h2>
            <p className="text-base text-black leading-relaxed">
                When you create an account via Google or Email (powered by Clerk Authentication), you are responsible for maintaining the confidentiality of your credentials. You agree to provide accurate shipping addresses and contact details to ensure successful delivery.
            </p>
        </section>

        
        <section className="space-y-3 border-t-2 border-black pt-6">
            <h2 className="text-xl font-bold text-black">8. Contact Information &​ Support</h2>
            <p className="text-base text-black leading-relaxed">
                If you have any questions or concerns regarding these Terms and Conditions or your order, please reach out to:
            </p>
            <div className="bg-neutral-100 p-5 rounded-lg border border-neutral-300 text-sm space-y-1 text-black font-medium">
                <p><strong>Gallery:</strong> Line and Layer Gallery</p>
                <p><strong>Artist &​ Founder:</strong> Manthan Parekh</p>
                <p><strong>Email:</strong> manthanparekh9d@gmail.com</p>
                <p><strong>Location:</strong> Mumbai, Maharashtra, India</p>
            </div>
        </section>
        </div>
        </div>

    </div>
</div>
    );
}

window.TAC = TAC;