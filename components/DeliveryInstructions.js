function DeliveryInstructions({ isOpen, onClose, onProceed }) {
    if (!isOpen) return null;

    return (
        <div className="tac-modal-backdrop" onClick={onClose}>
            <div 
                className="tac-modal-card relative space-y-6"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 text-black hover:text-neutral-500 text-2xl font-bold transition-colors w-10 h-10 flex items-center justify-center rounded-full border border-black/10 hover:bg-neutral-100"
                    aria-label="Close modal"
                >
                    ✕
                </button>

                {/* Header */}
                <div className="border-b-2 border-black pb-6">
                    <h1 className="text-3xl font-extrabold text-black tracking-tight">
                        Shipping & Delivery Instructions
                    </h1>
                    <p className="text-sm text-neutral-600 mt-2">
                        Fulfillment Policy & Guidelines • Line and Layer Gallery
                    </p>
                </div>

                {/* Section 1 */}
                <section className="space-y-3">
                    <h2 className="text-xl font-bold text-black">1. Print-on-Demand Fulfillment Process</h2>
                    <p className="text-base text-black leading-relaxed">
                        Every t-shirt and wearable art piece at <strong>Line and Layer Gallery</strong> is freshly printed upon order confirmation. We use high-precision Direct-to-Garment (DTG) printing on 100% combed cotton (180 GSM) to ensure gallery-grade detail and longevity.
                    </p>
                </section>

                {/* Section 2 */}
                <section className="space-y-3">
                    <h2 className="text-xl font-bold text-black">2. Processing & Dispatch Timeline</h2>
                    <ul className="list-disc pl-6 space-y-2 text-base text-black leading-relaxed">
                        <li>
                            <strong>Production Time:</strong> Quality checking and DTG printing take <strong>2 to 3 business days</strong>.
                        </li>
                        <li>
                            <strong>Courier Handover:</strong> Once quality inspection is passed, packages are immediately sealed in tamper-proof packaging and manifested with our courier partners.
                        </li>
                    </ul>
                </section>

                {/* Section 3 */}
                <section className="space-y-3">
                    <h2 className="text-xl font-bold text-black">3. Domestic Shipping & Transit Times</h2>
                    <p className="text-base text-black leading-relaxed">
                        We deliver pan-India to all serviceable pin codes via premier logistics partners (including Blue Dart, Delhivery, DTDC, Ekart, and Xpressbees). Estimated transit times post-dispatch:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 text-base text-black leading-relaxed">
                        <li><strong>Metro Cities (Mumbai, Delhi, Bengaluru, etc.):</strong> 2 to 4 business days.</li>
                        <li><strong>Rest of India (Tier 2/3 Cities & Regional Hubs):</strong> 3 to 6 business days.</li>
                        <li><strong>North-East & Remote Locations:</strong> 5 to 7 business days.</li>
                    </ul>
                </section>

                {/* Section 4 */}
                <section className="space-y-3">
                    <h2 className="text-xl font-bold text-black">4. Weight Slabs & Transparent Pricing</h2>
                    <p className="text-base text-black leading-relaxed">
                        Logistics charges are calculated based on standardized <strong>500-gram weight slabs</strong>. A single t-shirt package comfortably falls under the initial 500g bracket. All displayed prices in our gallery are inclusive of applicable logistics and product taxes.
                    </p>
                </section>

                {/* Section 5 */}
                <section className="space-y-3">
                    <h2 className="text-xl font-bold text-black">5. Applicable Taxes & HSN Codes</h2>
                    <p className="text-base text-black leading-relaxed">
                        In accordance with Indian tax regulations:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 text-base text-black leading-relaxed">
                        <li><strong>Cotton T-Shirts (HSN Code 61091000):</strong> Attract 5% GST (included in product pricing).</li>
                        <li><strong>Logistics / Courier Services:</strong> Attract 18% GST (handled directly through our integrated fulfillment pipeline).</li>
                    </ul>
                </section>

                {/* Section 6 */}
                <section className="space-y-3">
                    <h2 className="text-xl font-bold text-black">6. Live Order Tracking</h2>
                    <p className="text-base text-black leading-relaxed">
                        As soon as your shipment is manifested, an Air Waybill (AWB) number and tracking URL are generated. You can view live tracking milestones (Manifested, In Transit, Out for Delivery) directly inside your <strong>My Orders</strong> drawer on our website.
                    </p>
                </section>

                {/* Section 7 */}
                <section className="space-y-3">
                    <h2 className="text-xl font-bold text-black">7. Delivery Attempts & Address Accuracy</h2>
                    <ul className="list-disc pl-6 space-y-2 text-base text-black leading-relaxed">
                        <li>
                            <strong>Delivery Attempts:</strong> Couriers will make up to <strong>3 delivery attempts</strong> and send SMS/OTP updates to your registered mobile number before marking a delivery as failed.
                        </li>
                        <li>
                            <strong>Address Guidelines:</strong> Please provide a complete address with flat/house number, street name, nearby landmark, valid 6-digit pin code, and an active phone number to prevent delivery delays.
                        </li>
                    </ul>
                </section>

                {/* Section 8 */}
                <section className="space-y-3">
                    <h2 className="text-xl font-bold text-black">8. Return to Origin (RTO) & Re-Shipping</h2>
                    <p className="text-base text-black leading-relaxed">
                        If a parcel cannot be delivered due to incorrect customer details or customer unavailability, it is returned to the fulfillment center and held securely for up to <strong>100 days</strong>. Re-dispatch can be arranged upon address verification by contacting our support team.
                    </p>
                </section>

                {/* Section 9 */}
                <section className="space-y-3 border-t-2 border-black pt-6">
                    <h2 className="text-xl font-bold text-black">9. Support & Inquiries</h2>
                    <p className="text-base text-black leading-relaxed">
                        For any questions regarding your shipment or delivery status, please contact:
                    </p>
                    <div className="bg-neutral-100 p-4 rounded-xl text-sm text-black space-y-1">
                        <p><strong>Gallery:</strong> Line and Layer Gallery</p>
                        <p><strong>Founder & Curator:</strong> Manthan Parekh</p>
                        <p><strong>Email:</strong> manthanparekh9d@gmail.com</p>
                        <p><strong>Location:</strong> Mumbai, Maharashtra, India</p>
                    </div>
                </section>

                {/* Bottom Action if used as checkout gate */}
                {onProceed && (
                    <div className="border-t-2 border-black pt-6 flex flex-col sm:flex-row justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="di-cancel-btn"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => {
                                onClose();
                                onProceed();
                            }}
                            className="di-proceed-btn"
                        >
                            I Understand, Continue to Checkout &rarr;
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

window.DeliveryInstructions = DeliveryInstructions;