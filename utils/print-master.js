// ─────────────────────────────────────────────────────────────────────────────
// utils/print-master.js
//
// STANDARD PRINT TARGET — 11x14 inch PORTRAIT frame.
//
// Every artwork sent to QikInk is normalised to an exact 11:14 master:
//   • whole painting centered (dead-center),
//   • padded with a clean WHITE gallery border (passe-partout),
//   • never cropped — the printer can't cut off any edge,
//   • landscape art is auto-rotated 90° so it fills the portrait frame.
//
// Two ways to produce the master:
//   1) getPrintMasterUrl(url)        → Cloudinary transform URL  (PRIMARY, used
//                                       in the checkout/order payload). No
//                                       re-upload, cached, full 300-DPI res.
//   2) padImageToPrintMasterBlob()   → HTML5 Canvas → Blob  (OPTIONAL, for flows
//                                       that need a physical padded file).
// ─────────────────────────────────────────────────────────────────────────────

const PRINT_TARGET = {
    inchesW: 11,
    inchesH: 14,
    dpi:     300,
    get pxW() { return this.inchesW * this.dpi; },  // 3300
    get pxH() { return this.inchesH * this.dpi; }    // 4200
};

// Cloudinary aspect-ratio token ("11:14")
const PRINT_AR = `${PRINT_TARGET.inchesW}:${PRINT_TARGET.inchesH}`;

// ── PRIMARY: Cloudinary URL transform (no re-upload) ──────────────────────────
// Pads any Cloudinary image to an exact 11x14 portrait master on white.
// Non-Cloudinary URLs are returned unchanged (safe no-op).
function getPrintMasterUrl(rawUrl) {
    if (!rawUrl || typeof rawUrl !== 'string') return rawUrl;
    if (!rawUrl.includes('/image/upload/'))    return rawUrl; // not a Cloudinary delivery URL

    // Chained transform:
    //   if landscape (aspect ratio > 1) → rotate 90° into portrait
    //   then pad to exact 3300x4200 on white, centered, export high-quality jpg
    const tx = [
        'if_ar_gt_1.0,a_90',
        'if_end',
        `c_pad,g_center,w_${PRINT_TARGET.pxW},h_${PRINT_TARGET.pxH},b_white`,
        'f_jpg,q_90'
    ].join('/');

    return rawUrl.replace('/image/upload/', `/image/upload/${tx}/`);
}

// ── OPTIONAL: Canvas-based padding → Blob ─────────────────────────────────────
// Loads the image (CORS), rotates landscape to portrait, centers it on a white
// 11x14 canvas, and returns a JPEG Blob. Use only when a physical file is needed
// (e.g. re-uploading a flattened master); the URL helper above is preferred.
function padImageToPrintMasterBlob(imgUrl, opts) {
    opts = opts || {};
    const H = opts.longEdge || 2100;                                   // portrait height (px)
    const W = Math.round(H * (PRINT_TARGET.inchesW / PRINT_TARGET.inchesH)); // keep exact 11:14

    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                canvas.width  = W;
                canvas.height = H;
                const ctx = canvas.getContext('2d');

                // Clean white gallery border
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, W, H);

                const nW = img.naturalWidth;
                const nH = img.naturalHeight;
                const landscape = nW > nH;

                if (landscape) {
                    // Rotate 90° so wide art fills the tall frame; fit entirely inside
                    const scale = Math.min(W / nH, H / nW);
                    const drawW = nW * scale;
                    const drawH = nH * scale;
                    ctx.save();
                    ctx.translate(W / 2, H / 2);
                    ctx.rotate(Math.PI / 2);
                    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
                    ctx.restore();
                } else {
                    // Portrait / square: fit entirely inside, centered
                    const scale = Math.min(W / nW, H / nH);
                    const drawW = nW * scale;
                    const drawH = nH * scale;
                    ctx.drawImage(img, (W - drawW) / 2, (H - drawH) / 2, drawW, drawH);
                }

                canvas.toBlob(
                    b => b ? resolve(b) : reject(new Error('toBlob() returned null')),
                    'image/jpeg',
                    0.9
                );
            } catch (e) { reject(e); }
        };
        img.onerror = () => reject(new Error('Image failed to load (CORS?)'));
        img.src = imgUrl;
    });
}