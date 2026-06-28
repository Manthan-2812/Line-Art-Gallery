// ─────────────────────────────────────────────────────────────────────────────
// utils/store.js  –  LocalStorage Persistence Layer
//
// STATE SHAPE — each image object:
//   { id: string, url: string, likes: number, comments: Comment[] }
//
// Comment shape:  { text: string, ts: number }
//
// LIKED SET — tracks which image IDs the current browser session has already
//   liked so the heart button toggles correctly.
//
// TO CONNECT A DATABASE:
//   Replace getGalleryImages()  → GET  /api/images
//   Replace saveGalleryImages() → PATCH /api/images  (or individual endpoints)
//   Replace getLikedSet() / saveLikedSet() with user-account liked tracking.
// ─────────────────────────────────────────────────────────────────────────────

// Gallery starts empty — all artworks uploaded via Cloudinary begin with likes:0, comments:[]
const INITIAL_IMAGES = [];

// ── Gallery Images ────────────────────────────────────────────────────────────

/** Fetch images from localStorage; seeds INITIAL_IMAGES on first ever load */
const getGalleryImages = () => {
    const stored = localStorage.getItem('gallery_images');
    if (stored) return JSON.parse(stored);
    localStorage.setItem('gallery_images', JSON.stringify(INITIAL_IMAGES));
    return INITIAL_IMAGES;
};

/** Persist the full images array back to localStorage */
const saveGalleryImages = (images) =>
    localStorage.setItem('gallery_images', JSON.stringify(images));

// ── Like-Toggle Tracking ──────────────────────────────────────────────────────
// We store a Set of image IDs this browser session has liked so the heart can
// toggle.  Global like counts are stored on the image objects themselves.

/** Returns a Set<string> of image IDs the current session has liked */
const getLikedSet = () => {
    const raw = localStorage.getItem('liked_ids');
    return raw ? new Set(JSON.parse(raw)) : new Set();
};

/** Persist the liked Set (serialised as a JSON array) */
const saveLikedSet = (set) =>
    localStorage.setItem('liked_ids', JSON.stringify([...set]));