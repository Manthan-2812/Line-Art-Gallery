// ─────────────────────────────────────────────────────────────────────────────
// utils/firebase.js  –  Firebase / Firestore helpers
//
// Loaded via <script> tag (compat CDN build) — no npm/bundler needed.
// All functions are globals available to gallery-app.js and GalleryCard.js.
//
// Firestore collection: "images"
//   Document fields: { url, likes, comments: [{text, ts}], createdAt }
//   Document ID  = Firestore auto-ID (used as image.id throughout the app)
// ─────────────────────────────────────────────────────────────────────────────

const FIREBASE_CONFIG = {
    apiKey:            "AIzaSyBr3pImMRwwXepZMRYythbomyZMhXHRtAo",
    authDomain:        "line-and-layer-gallery.firebaseapp.com",
    projectId:         "line-and-layer-gallery",
    storageBucket:     "line-and-layer-gallery.firebasestorage.app",
    messagingSenderId: "507100131763",
    appId:             "1:507100131763:web:0a06118d08d9a32e439bc6"
};

// Guard against Babel re-evaluation on hot-reload
if (!firebase.apps.length) {
    firebase.initializeApp(FIREBASE_CONFIG);
}

const db = firebase.firestore();

// ── Real-time subscription ─────────────────────────────────────────────────
// Returns an unsubscribe() function.
// Calls callback(images[]) immediately and on every Firestore change.
const subscribeToImages = (callback) => {
    return db.collection('images')
        .orderBy('createdAt', 'desc')
        .onSnapshot(
            snap => callback(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))),
            err  => console.error('[Firebase] subscription error:', err)
        );
};

// ── Write helpers ──────────────────────────────────────────────────────────

/** Add a freshly-uploaded image (id from FileUploadZone is discarded; Firestore generates one) */
const addImageToFirebase = ({ url }) =>
    db.collection('images').add({
        url,
        likes:     0,
        comments:  [],
        createdAt: Date.now()
    });

/** Persist updated likes count and/or comments array for one image */
const updateImageInFirebase = (id, { likes, comments }) =>
    db.collection('images').doc(id).update({ likes, comments });

/** Permanently remove an image document */
const deleteImageFromFirebase = (id) =>
    db.collection('images').doc(id).delete();
