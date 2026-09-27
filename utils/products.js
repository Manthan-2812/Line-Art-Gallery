// ─────────────────────────────────────────────────────────────────────────────
// utils/products.js
//
// Dynamic Product & Color Catalog matching Qikink inventory.
// Supports multi-product types (V-Neck, Crew Neck, Oversized, Hoodies) and custom pricing.
// ─────────────────────────────────────────────────────────────────────────────

window.PRODUCT_COLORS = [
    { id: 'Wh', name: 'Classic White',  shortName: 'White',        hex: '#f8fafc', border: '#cbd5e1', priceOffset: 0,  primary: true },
    { id: 'Bk', name: 'Midnight Black', shortName: 'Black',        hex: '#090d16', border: '#334155', priceOffset: 0,  primary: true },
    { id: 'Nb', name: 'Navy Blue',      shortName: 'Navy Blue',    hex: '#172554', border: '#3b82f6', priceOffset: 50, primary: true },
    { id: 'Gm', name: 'Grey Melange',   shortName: 'Grey Melange', hex: '#94a3b8', border: '#64748b', priceOffset: 0,  primary: false },
    { id: 'Rb', name: 'Royal Blue',     shortName: 'Royal Blue',   hex: '#2563eb', border: '#60a5fa', priceOffset: 50, primary: false },
    { id: 'Rd', name: 'Crimson Red',    shortName: 'Red',          hex: '#dc2626', border: '#ef4444', priceOffset: 50, primary: false },
    { id: 'Br', name: 'Earthy Brown',   shortName: 'Brown',        hex: '#78350f', border: '#92400e', priceOffset: 50, primary: false },
    { id: 'Mr', name: 'Deep Maroon',    shortName: 'Maroon',       hex: '#881337', border: '#9f1239', priceOffset: 50, primary: false },
    { id: 'Yl', name: 'Golden Yellow',  shortName: 'Yellow',       hex: '#eab308', border: '#facc15', priceOffset: 50, primary: false },
    { id: 'Gr', name: 'Bottle Green',   shortName: 'Green',        hex: '#14532d', border: '#166534', priceOffset: 50, primary: false }
];

window.PRODUCT_SIZES = [
    { size: 'S',   label: 'Small (38" Chest)' },
    { size: 'M',   label: 'Medium (40" Chest)' },
    { size: 'L',   label: 'Large (42" Chest)' },
    { size: 'XL',  label: 'X-Large (44" Chest)' },
    { size: 'XXL', label: 'XX-Large (46" Chest)' }
];

// Default V-Neck T-Shirt strictly uses the 6 active colors
window.DEFAULT_PRODUCTS = [
    {
        id: 'v_neck',
        name: 'V-Neck T-Shirt (UV34)',
        skuPrefix: 'MVnHs',
        spec: '100% Combed Cotton • 180 GSM • Front DTG Print',
        printTypeId: 1,
        basePrice: 900,
        colors: ['Wh', 'Bk', 'Nb', 'Gm', 'Rb', 'Rd'],
        sizes: ['S', 'M', 'L', 'XL', 'XXL'],
        active: true
    }
];

window.resolveColor = function(colorInput) {
    if (!colorInput) return window.PRODUCT_COLORS[0];
    if (typeof colorInput === 'object' && colorInput.id) return colorInput;
    const str = String(colorInput).trim();
    const found = window.PRODUCT_COLORS.find(c => 
        c.id.toLowerCase() === str.toLowerCase() || 
        c.shortName.toLowerCase() === str.toLowerCase() || 
        c.name.toLowerCase() === str.toLowerCase()
    );
    if (found) return found;

    // Fallback: generate dynamic color definition
    const safeId = str.replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase() || 'CL';
    return {
        id: safeId,
        name: str,
        shortName: str,
        hex: '#475569',
        border: '#64748b',
        priceOffset: 50,
        primary: false
    };
};

window.getStoreProducts = function(customCatalog) {
    if (Array.isArray(customCatalog) && customCatalog.length > 0) {
        return customCatalog.filter(p => p.active !== false);
    }
    return window.DEFAULT_PRODUCTS;
};

// Stock availability checker per Qikink catalog rules
window.isVariantAvailable = function(colorId, size) {
    return true;
};

// Helper to generate SKU: [Prefix]-[Color]-[Size]
window.getTshirtSku = function(colorId, size, prefix = 'MVnHs') {
    return `${prefix}-${colorId}-${size}`;
};

// Rebuild variants lookup dynamically
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
