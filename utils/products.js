// ─────────────────────────────────────────────────────────────────────────────
// utils/products.js
//
// T-Shirt catalog with Color & Size options matching Qikink inventory.
// Colors: White, Black, Navy Blue, Grey Melange, Royal Blue, Red.
// ─────────────────────────────────────────────────────────────────────────────

window.PRODUCT_COLORS = [
    { id: 'Wh', name: 'Classic White',  shortName: 'White',        hex: '#f8fafc', border: '#cbd5e1', priceOffset: 0,  primary: true },
    { id: 'Bk', name: 'Midnight Black', shortName: 'Black',        hex: '#090d16', border: '#334155', priceOffset: 0,  primary: true },
    { id: 'Nb', name: 'Navy Blue',      shortName: 'Navy Blue',    hex: '#172554', border: '#3b82f6', priceOffset: 50, primary: true },
    { id: 'Gm', name: 'Grey Melange',   shortName: 'Grey Melange', hex: '#94a3b8', border: '#64748b', priceOffset: 0,  primary: false },
    { id: 'Rb', name: 'Royal Blue',     shortName: 'Royal Blue',   hex: '#2563eb', border: '#60a5fa', priceOffset: 50, primary: false },
    { id: 'Rd', name: 'Crimson Red',    shortName: 'Red',          hex: '#dc2626', border: '#ef4444', priceOffset: 50, primary: false }
];

window.PRODUCT_SIZES = [
    { size: 'S',   label: 'Small (38" Chest)' },
    { size: 'M',   label: 'Medium (40" Chest)' },
    { size: 'L',   label: 'Large (42" Chest)' },
    { size: 'XL',  label: 'X-Large (44" Chest)' },
    { size: 'XXL', label: 'XX-Large (46" Chest)' }
];

// Stock availability checker per Qikink catalog rules
window.isVariantAvailable = function(colorId, size) {
    // All sizes (S, M, L, XL, XXL) are available for all 6 active colors
    return true;
};

// Helper to generate SKU: MVnHs-[Color]-[Size]
window.getTshirtSku = function(colorId, size) {
    return `MVnHs-${colorId}-${size}`;
};

window.PRODUCT_VARIANTS = [];
window.PRODUCT_COLORS.forEach(c => {
    window.PRODUCT_SIZES.forEach(s => {
        const offset = c.priceOffset || 0;
        window.PRODUCT_VARIANTS.push({
            sku:       `MVnHs-${c.id}-${s.size}`,
            colorId:   c.id,
            colorName: c.name,
            size:      s.size,
            label:     `${c.name} — Size ${s.size}`,
            spec:      '100% Combed Cotton • 180 GSM • Front DTG Print',
            price:     900 + offset,
            available: true
        });
    });
});
