# Line and Layer Gallery

A personal art portfolio and gallery web app built with React, Tailwind CSS, Framer Motion, Cloudinary, Firebase, and EmailJS — no build tools or backend server required.

---

## Live Features

- **Landing page** with animated hero title, spark burst effect on tap/click, and draggable art cards on desktop
- **About Me** section with bio, profile photo, and glassy social cards (LinkedIn, Instagram, Email)
- **Art Gallery** page with responsive masonry-style grid
- **Real-time likes & comments** powered by Firebase Firestore — shared across all browsers instantly
- **Cloudinary image uploads** via drag-and-drop (admin only) — images persist forever
- **Email notifications** to the gallery owner on every new like or comment (via EmailJS)
- **Admin dashboard** — protected by email/password login, upload and delete artworks
- **Page transitions** with animated brush-stroke overlay (Framer Motion)

---

## Tech Stack

| Layer | Technology |
|---|---|
| UI Framework | React 18 (CDN, no build step) |
| Styling | Tailwind CSS (CDN) |
| Animations | Framer Motion |
| Image Storage | Cloudinary (unsigned REST upload) |
| Database | Firebase Firestore (real-time) |
| Email Notifications | EmailJS |
| Hosting | Netlify (static) |

---

## Project Structure

```
art/
├── index.html              # Landing page
├── gallery.html            # Gallery page
├── app.js                  # Landing page React app
├── gallery-app.js          # Gallery page React app
├── components/
│   ├── Navbar.js           # Fixed navigation bar
│   ├── DraggableCards.js   # Hero draggable art cards (desktop)
│   ├── GalleryCard.js      # Individual artwork card (likes, comments)
│   ├── FileUploadZone.js   # Admin drag-and-drop Cloudinary uploader
│   └── TransitionOverlay.js# Brush-stroke page transition
├── utils/
│   ├── auth.js             # Admin pseudo-JWT authentication
│   ├── store.js            # LocalStorage helpers (fallback)
│   ├── firebase.js         # Firebase Firestore config + helpers
│   └── emailjs-notify.js   # EmailJS like/comment notifications
└── photos/
    ├── profile.jpg         # Profile photo (About Me section)
    ├── art1.jpeg           # Hero draggable card images
    ├── art2.jpeg
    ├── art3.jpeg
    ├── art4.jpeg
    └── art5.jpeg
```

---

## Admin Access

Login at the landing page with admin credentials to:
- Upload new artworks via drag-and-drop
- Delete artworks from the gallery

---

## Setup & Deployment

This is a **fully static** site — no Node.js, no build step.

### Local development
Open `index.html` directly in a browser, or use any static file server:
```bash
npx serve .
```

### Deploy to Netlify
1. Go to [netlify.com](https://www.netlify.com) → **Add new site → Deploy manually**
2. Drag the entire project folder onto the Netlify drop zone
3. Done — live URL generated instantly

---

## Services Used

- **Cloudinary** — image hosting and delivery ([cloudinary.com](https://cloudinary.com))
- **Firebase Firestore** — real-time database for likes and comments ([firebase.google.com](https://firebase.google.com))
- **EmailJS** — browser-side email notifications ([emailjs.com](https://www.emailjs.com))

---

## Author

**Manthan Parekh** — AI & Data Science student, artist  
[Instagram](https://www.instagram.com/manthanparekh138/) · [LinkedIn](https://linkedin.com/in/manthanparekh2805) · manthanparekh9d@gmail.com
