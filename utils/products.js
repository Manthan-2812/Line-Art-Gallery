// ─────────────────────────────────────────────────────────────────────────────
// utils/products.js
//
// T-Shirt catalog with Color & Size options.
// ─────────────────────────────────────────────────────────────────────────────

window.PRODUCT_COLORS = [
    { id: 'Wh', name: 'Classic White',  hex: '#f8fafc', border: '#cbd5e1' },
    { id: 'Bk', name: 'Midnight Black', hex: '#090d16', border: '#334155' },
    { id: 'Nb', name: 'Navy Blue',      hex: '#1e293b', border: '#475569' }
];

window.PRODUCT_SIZES = [
    { size: 'S',   label: 'Small (38" Chest)' },
    { size: 'M',   label: 'Medium (40" Chest)' },
    { size: 'L',   label: 'Large (42" Chest)' },
    { size: 'XL',  label: 'X-Large (44" Chest)' },
    { size: 'XXL', label: 'XX-Large (46" Chest)' }
];

// Helper to generate SKU: MVnHs-[Color]-[Size]
window.getTshirtSku = function(colorId, size) {
    return `MVnHs-${colorId}-${size}`;
};

window.PRODUCT_VARIANTS = [];
window.PRODUCT_COLORS.forEach(c => {
    window.PRODUCT_SIZES.forEach(s => {
        window.PRODUCT_VARIANTS.push({
            sku:      `MVnHs-${c.id}-${s.size}`,
            colorId:  c.id,
            colorName: c.name,
            size:     s.size,
            label:    `${c.name} — Size ${s.size}`,
            spec:     '100% Combed Cotton • 180 GSM • Front DTG Print',
            price:    900
        });
    });
});
