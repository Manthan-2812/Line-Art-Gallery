# Line and Layer Gallery

> **Where strokes meet dimensions.**  
> A premium art gallery and direct-to-garment (DTG) wearable art e-commerce platform featuring an interactive UI, real-time database, seamless customer authentication, automated Razorpay payments, and automated print-on-demand fulfillment.

🌐 **Live Website**: [line-art-gallery.netlify.app](https://line-art-gallery.netlify.app)

---

## Key Features

### 1. Interactive Visual Experience
- **Dynamic Hero Section**: Per-letter glowing gradient typography, interactive particle spark bursts on tap/click, and draggable artwork cards on desktop.
- **Real-Time Live Metrics**: Dynamic counters for **Total Orders**, **Delivered Artworks**, and **Customer Average Rating** calculated live from real purchases.
- **Artist Spotlight & Bio**: Glassmorphic "About Me" section showcasing the artist's philosophy and direct social channels.

### 2. Masonry Art Gallery & Admin Controls
- **Masonry Layout**: Responsive multi-column layout for artworks with smooth lazy-loading.
- **Featured / Pinned Artworks**: Admin can pin highlight pieces into a top featured horizontal scroll row.
- **Inline Admin Price & Name Editor**: Admins can edit artwork names and custom prices directly from the gallery card in real time.
- **Cloudinary Image Uploader**: Drag-and-drop direct image upload with automatic optimization.

### 3. Wearable Art E-Commerce & Checkout
- **T-Shirt Print Modal**: Interactive color selector (*Classic White*, *Midnight Black*, *Lavender Mist*) and size selector (*XS, S, M, L, XL, XXL*).
- **Cart & Checkout**: Fast single-page checkout with ambient powder light background animation.
- **Saved Address Book**: Signed-in customers can save and reuse multi-field delivery addresses.

### 4. Payments & Automated Print-on-Demand (POD)
- **Razorpay Payment Gateway**: Secure server-side order generation and cryptographic HMAC-SHA256 signature verification.
- **Qikink Automated Fulfillment**: Successful orders are automatically transmitted to Qikink via API for DTG printing, quality check, packaging, and door-to-door delivery.
- **Customer Order Invoices**: Instant itemized digital invoice with print/PDF export and automatic email dispatch via EmailJS.
- **Order History Drawer**: Slide-over customer dashboard to track active orders and download previous tax receipts.

---

## Tech Stack

| Layer | Technology / Service |
| :--- | :--- |
| **Frontend Framework** | React 18 (CDN Architecture) |
| **Styling & Design** | Tailwind CSS (Glassmorphism & Neon Glow) |
| **Animations** | Motion (Framer Motion Web SDK) |
| **Customer Auth** | Clerk Authentication (Google OAuth & Email) |
| **Database** | Firebase Firestore (Real-time sync) |
| **Backend & APIs** | Netlify Serverless Functions (Node.js) |
| **Payment Gateway** | Razorpay (UPI, Cards, NetBanking) |
| **Fulfillment / POD** | Qikink Print-on-Demand REST API |
| **Image Hosting** | Cloudinary CDN |
| **Email Dispatch** | EmailJS Browser SDK |
| **Deployment** | Netlify |

---

## Project Structure

```
art/
├── index.html                  # Landing page & Hero section
├── gallery.html                # Main Gallery & Artwork showcase
├── checkout.html               # E-Commerce Checkout & Invoice page
├── app.js                      # Landing page React application
├── gallery-app.js              # Gallery page React application
├── components/
│   ├── Navbar.js               # Responsive glass navbar & customer controls
│   ├── DraggableCards.js       # Hero draggable art preview cards
│   ├── GalleryCard.js          # Artwork card (Like, Price, Modal, Admin tools)
│   ├── ClerkAuth.js            # Customer sign-in & account button
│   ├── AddressModal.js         # Shipping address modal & auto-save
│   ├── OrderHistoryDrawer.js   # Slide-over order history & invoice viewer
│   ├── FileUploadZone.js       # Admin drag-and-drop Cloudinary uploader
│   └── TransitionOverlay.js    # Brush-stroke page transition
├── netlify/functions/
│   ├── _firebaseAdmin.js       # Secure Firebase Admin SDK connection
│   ├── _qikink.js              # Qikink API client & order submission
│   ├── create-order.js         # Server-side Razorpay order creation
│   ├── verify-payment.js       # Signature verification & Qikink order dispatch
│   ├── get-orders.js           # Secure order retrieval for authenticated users
│   ├── save-address.js         # User address book persistence
│   ├── get-address.js          # User address book lookup
│   ├── toggle-like.js          # Authenticated artwork likes
│   ├── get-user-likes.js       # User like history sync
│   ├── submit-rating.js        # Post-purchase reviews & metrics calculation
│   └── health.js               # System health & environment verification
├── utils/
│   ├── clerk-config.js         # Clerk SDK configuration & dark theme
│   ├── products.js             # T-Shirt color & size specification matrix
│   ├── print-master.js         # High-resolution print asset generator
│   └── emailjs-notify.js       # Customer & admin email notifications
├── netlify.toml                # Netlify deployment and function routing config
└── .env.example                # Template of required environment variables
```

---

## Environment Configuration

Create a `.env` file in the root directory (or configure in Netlify **Site configuration &rarr; Environment variables**):

```env
# ── Clerk Authentication ──
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# ── Razorpay Payments ──
RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_SECRET=...

# ── Qikink Fulfillment ──
QIKINK_CLIENT_ID=...
QIKINK_CLIENT_SECRET=...
QIKINK_BASE_URL=https://api.qikink.com

# ── Firebase Admin ──
FIREBASE_PROJECT_ID=lineandlayer
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# ── Store Defaults ──
ADMIN_EMAIL=manthanparekh9d@gmail.com
PRICE_TSHIRT=900
```

---

## Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/Manthan-2812/Line-Art-Gallery.git
   cd Line-Art-Gallery
   ```

2. Install backend dependencies (for Netlify serverless functions):
   ```bash
   npm install
   ```

3. Run locally using Netlify CLI:
   ```bash
   npx netlify dev
   ```
   *The app and API functions will run at `http://localhost:8888`.*

---

## Author & Contact

**Manthan Parekh**  
*Artist & AI / Data Science Engineer*  
- **Instagram**: [@manthanparekh138](https://www.instagram.com/manthanparekh138/)
- **LinkedIn**: [linkedin.com/in/manthanparekh2805](https://linkedin.com/in/manthanparekh2805)
- **Email**: manthanparekh9d@gmail.com

---
*Crafted with precision — Line and Layer Gallery 2026*
