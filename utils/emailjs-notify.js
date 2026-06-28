// ─────────────────────────────────────────────────────────────────────────────
// utils/emailjs-notify.js  –  EmailJS notification helpers
//
// Sends an email to the gallery owner whenever:
//   - Someone likes an artwork    → notifyLike(imageUrl)
//   - Someone posts a comment     → notifyComment(imageUrl, name, text)
//
// Uses EmailJS browser SDK (loaded via CDN in gallery.html).
// No backend required — sends directly from the browser.
// ─────────────────────────────────────────────────────────────────────────────

const EMAILJS_PUBLIC_KEY  = '_aYo3S4YB97RmUEzE';
const EMAILJS_SERVICE_ID  = 'service_5mb4ond';
const EMAILJS_TEMPLATE_ID = 'template_j5wozvn';

// Initialise EmailJS once
emailjs.init(EMAILJS_PUBLIC_KEY);

/** Notify owner that someone liked an artwork */
const notifyLike = (imageUrl) => {
    emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
        type:      'Like',
        name:      'Someone',
        message:   'Someone liked your artwork!',
        image_url: imageUrl,
        time:      new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
    }).catch(err => console.error('[EmailJS] like notify failed:', err));
};

/** Notify owner that someone posted a comment */
const notifyComment = (imageUrl, commenterName, commentText) => {
    const name = commenterName || 'Anonymous';
    emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
        type:      'Comment',
        name:      name,
        message:   `@${name} commented: "${commentText}"`,
        image_url: imageUrl,
        time:      new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
    }).catch(err => console.error('[EmailJS] comment notify failed:', err));
};
