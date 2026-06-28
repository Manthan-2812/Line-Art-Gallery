// ─────────────────────────────────────────────────────────────────────────────
// app.js  –  Landing Page  (index.html)
// ─────────────────────────────────────────────────────────────────────────────

// ── CanvasBackground ──────────────────────────────────────────────────────────
// Renders an animated HTML5 canvas fixed behind all content.
// 7 glowing orbs drift slowly across the viewport; each has a shifting hue so
// the nebula colours evolve continuously.  globalCompositeOperation:'lighter'
// makes overlapping orbs brighten each other (gas-cloud blending).
//
// TO TWEAK:  Adjust ORB_COUNT, BASE_RADIUS, BASE_ALPHA, and VEL_SCALE below.
// ─────────────────────────────────────────────────────────────────────────────
function CanvasBackground() {
    const { useRef, useEffect } = React;
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let animId;

        const ORB_COUNT  = 7;
        const BASE_RADIUS = 200;
        const RADIUS_VAR  = 180;
        const BASE_ALPHA  = 0.16;
        const ALPHA_VAR   = 0.18;
        const VEL_SCALE   = 0.38;

        const resize = () => {
            canvas.width  = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener('resize', resize);

        // Each orb: position, velocity, radius, hue, saturation, lightness, alpha
        const orbs = Array.from({ length: ORB_COUNT }, (_, i) => ({
            x:     Math.random() * window.innerWidth,
            y:     Math.random() * window.innerHeight,
            r:     BASE_RADIUS + Math.random() * RADIUS_VAR,
            vx:    (Math.random() - 0.5) * VEL_SCALE,
            vy:    (Math.random() - 0.5) * VEL_SCALE,
            hue:   (i * 52) % 360,
            sat:   70 + Math.random() * 30,
            lit:   42 + Math.random() * 20,
            alpha: BASE_ALPHA + Math.random() * ALPHA_VAR
        }));

        const draw = () => {
            // Dark base fill
            ctx.fillStyle = '#080e1d';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.globalCompositeOperation = 'lighter';
            orbs.forEach(o => {
                // Drift
                o.x += o.vx;
                o.y += o.vy;
                // Wrap edges so orbs re-enter from the other side
                if (o.x + o.r < 0)              o.x = canvas.width  + o.r;
                if (o.x - o.r > canvas.width)   o.x = -o.r;
                if (o.y + o.r < 0)              o.y = canvas.height + o.r;
                if (o.y - o.r > canvas.height)  o.y = -o.r;
                // Slowly shift hue for living-colour effect
                o.hue = (o.hue + 0.07) % 360;

                const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
                g.addColorStop(0,   `hsla(${o.hue},${o.sat}%,${o.lit}%,${o.alpha})`);
                g.addColorStop(0.45,`hsla(${(o.hue+35)%360},${o.sat-10}%,${o.lit-12}%,${o.alpha*0.55})`);
                g.addColorStop(1,   'hsla(0,0%,0%,0)');

                ctx.beginPath();
                ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
                ctx.fillStyle = g;
                ctx.fill();
            });
            ctx.globalCompositeOperation = 'source-over';

            animId = requestAnimationFrame(draw);
        };

        draw();
        return () => {
            cancelAnimationFrame(animId);
            window.removeEventListener('resize', resize);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{ position:'fixed', top:0, left:0, width:'100%', height:'100%', zIndex:0, pointerEvents:'none' }}
        />
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// App  –  Landing Page root component
//
// STATE:
//   isAdmin      {boolean} — derived from JWT token on mount; drives Navbar CTA
//   showLogin    {boolean} — controls login modal visibility
//   email/password         — controlled form inputs (cleared on success/close)
//   isLoaded     {boolean} — set to true after mount; TransitionOverlay watches
//   titleHovered {boolean} — when true, each letter's text-shadow intensifies
//   showHand     {boolean} — true for ~950ms after arrow click; drives hand animation
// ─────────────────────────────────────────────────────────────────────────────

// Per-letter title colours — 22 distinct vibrant tones cycling across the title
const LETTER_COLORS = [
    '#f472b6','#fb923c','#facc15','#4ade80','#34d399',
    '#22d3ee','#60a5fa','#a78bfa','#f472b6','#fb923c',
    '#facc15','#4ade80','#22d3ee','#60a5fa','#a78bfa',
    '#f472b6','#fb923c','#facc15','#4ade80','#34d399',
    '#22d3ee','#60a5fa'
];
const TITLE = 'Line and Layer Gallery';

function App() {
    const { useState, useEffect, useRef } = React;
    const { motion, AnimatePresence } = window.Motion;

    const [isAdmin,       setIsAdmin]       = useState(checkIsAdmin());
    const [showLogin,     setShowLogin]     = useState(false);
    const [email,         setEmail]         = useState('');
    const [password,      setPassword]      = useState('');
    const [isLoaded,      setIsLoaded]      = useState(false);
    const [titleHovered,  setTitleHovered]  = useState(false);
    const [showHand,      setShowHand]      = useState(false);
    const aboutRef   = useRef(null);
    const sparkIdRef = useRef(0);
    const [sparks,   setSparks]   = useState([]);

    useEffect(() => {
        const t = setTimeout(() => setIsLoaded(true), 120);
        return () => clearTimeout(t);
    }, []);

    // Arrow click: flash the hand (going downward) then smooth-scroll to About
    const handleArrowClick = () => {
        setShowHand(true);
        setTimeout(() => {
            if (aboutRef.current) aboutRef.current.scrollIntoView({ behavior: 'smooth' });
        }, 150);
        setTimeout(() => setShowHand(false), 950);
    };

    // ── Admin handlers ─────────────────────────────────────────────────────────
    const handleLogin = (e) => {
        e.preventDefault();
        if (loginAdmin(email, password)) {
            setIsAdmin(true);
            setShowLogin(false);
            setEmail('');
            setPassword('');
        } else {
            alert('Invalid credentials.\nHint: admin@gallery.com / artgallery2025');
        }
    };

    const handleLogout = () => {
        logoutAdmin();
        setIsAdmin(false);
    };

    const navigateToGallery = () => TriggerTransition('gallery.html');

    // ── Spark burst on hero tap/click (mobile: replaces hidden draggable cards) ─
    const fireSparks = (clientX, clientY, rect) => {
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        const count = 12;
        const id0   = sparkIdRef.current;
        sparkIdRef.current += count;
        const batch = Array.from({ length: count }, (_, i) => ({
            id:    id0 + i,
            x, y,
            color: LETTER_COLORS[Math.floor(Math.random() * LETTER_COLORS.length)],
            angle: (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.6,
            dist:  55 + Math.random() * 75,
            size:  4  + Math.random() * 5,
        }));
        setSparks(prev => [...prev.slice(-60), ...batch]);
        setTimeout(() => setSparks(prev => prev.filter(s => s.id < id0 || s.id >= id0 + count)), 750);
    };

    const handleHeroClick = (e) => {
        if (e.target.closest('button, a')) return;
        fireSparks(e.clientX, e.clientY, e.currentTarget.getBoundingClientRect());
    };

    const handleHeroTouch = (e) => {
        if (e.target.closest('button, a')) return;
        const t = e.touches[0];
        fireSparks(t.clientX, t.clientY, e.currentTarget.getBoundingClientRect());
    };

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen relative overflow-x-hidden" data-name="App">

            {/* Animated nebula canvas — z-0, never intercepts clicks */}
            <CanvasBackground />

            {/* Brush-stroke page-entry overlay — disappears once isLoaded=true */}
            <TransitionOverlay isVisible={!isLoaded} />

            <Navbar
                isAdmin={isAdmin}
                onLoginClick={() => setShowLogin(true)}
                onLogout={handleLogout}
                onAboutClick={handleArrowClick}
            />

            {/* ── Animated grabbing hand ─────────────────────────────────────── */}
            {/* Rises from the bottom of the screen and pulls the shutter up */}
            {/* Hand flashes at the About Me arrow and drifts DOWN (scroll direction) */}
            <AnimatePresence>
                {showHand && (
                    <motion.div
                        className="fixed left-1/2 -translate-x-1/2 z-[60]"
                        initial={{ bottom: '110px', opacity: 1, scale: 1 }}
                        animate={{ bottom: '30px',  opacity: 0, scale: 0.8 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.85, ease: 'easeIn' }}
                    >
                        <svg width="52" height="52" viewBox="0 0 24 24" fill="#22d3ee"
                            style={{ filter: 'drop-shadow(0 0 12px rgba(34,211,238,0.9))' }}>
                            <path d="M10 2a2 2 0 0 1 2 2v5.5a.5.5 0 0 0 1 0V5a2 2 0 0 1 4 0v4.5a.5.5 0 0 0 1 0V7a2 2 0 0 1 4 0v9.5A7.5 7.5 0 0 1 14.5 24h-1a7.5 7.5 0 0 1-7.2-5.3L4.5 13a2 2 0 0 1 3-2.5l2.5 3V4a2 2 0 0 1 2-2z"/>
                        </svg>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Hero Section ──────────────────────────────────────────────────── */}
            <section
                className="relative min-h-screen flex flex-col md:flex-row items-center justify-center pt-24 pb-20 px-6 md:px-12 gap-10 z-10 overflow-hidden"
                data-name="hero"
                onClick={handleHeroClick}
                onTouchStart={handleHeroTouch}
            >
                {/* ── Spark particles: burst on tap/click anywhere in hero ── */}
                <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 20 }}>
                    <AnimatePresence>
                        {sparks.map(s => (
                            <motion.div
                                key={s.id}
                                initial={{ left: s.x, top: s.y, opacity: 1, scale: 1, x: 0, y: 0 }}
                                animate={{
                                    x: Math.cos(s.angle) * s.dist,
                                    y: Math.sin(s.angle) * s.dist,
                                    opacity: 0, scale: 0
                                }}
                                transition={{ duration: 0.65, ease: 'easeOut' }}
                                style={{
                                    position:      'absolute',
                                    width:         s.size,
                                    height:        s.size,
                                    borderRadius:  '50%',
                                    background:    s.color,
                                    boxShadow:     `0 0 ${s.size * 2}px ${s.color}`,
                                    marginLeft:    -(s.size / 2),
                                    marginTop:     -(s.size / 2),
                                    pointerEvents: 'none',
                                }}
                            />
                        ))}
                    </AnimatePresence>
                </div>

                {/* ── Left column: title, slogan, CTA ── */}
                <div className="flex-1 flex flex-col items-center md:items-start justify-center max-w-xl">

                    {/* Per-letter coloured title with staggered typewriter fade-in */}
                    <h1
                        className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-wider mb-2 cursor-default leading-tight text-center md:text-left"
                        onMouseEnter={() => setTitleHovered(true)}
                        onMouseLeave={() => setTitleHovered(false)}
                    >
                        {/* "Line and Layer " renders normally; "Gallery" is wrapped
                            in a nowrap span so it never breaks mid-word */}
                        {TITLE.split('').slice(0, 15).map((char, i) => (
                            <span
                                key={i}
                                style={{
                                    display:    'inline-block',
                                    color:      char === ' ' ? 'transparent' : LETTER_COLORS[i % LETTER_COLORS.length],
                                    textShadow: char === ' ' ? 'none' : titleHovered
                                        ? `0 0 22px ${LETTER_COLORS[i % LETTER_COLORS.length]}dd, 0 0 50px ${LETTER_COLORS[i % LETTER_COLORS.length]}77`
                                        : `0 0 12px ${LETTER_COLORS[i % LETTER_COLORS.length]}99, 0 0 24px ${LETTER_COLORS[i % LETTER_COLORS.length]}44`,
                                    opacity:    0,
                                    animation:  `lnlFadeUp 0.07s ease forwards ${0.85 + i * 0.055}s`,
                                    transition: 'text-shadow 0.3s ease',
                                    whiteSpace: char === ' ' ? 'pre' : 'normal'
                                }}
                            >
                                {char === ' ' ? '\u00A0' : char}
                            </span>
                        ))}
                        <span style={{ whiteSpace: 'nowrap', display: 'inline-block' }}>
                            {TITLE.split('').slice(15).map((char, j) => {
                                const i = 15 + j;
                                return (
                                    <span
                                        key={i}
                                        style={{
                                            display:    'inline-block',
                                            color:      LETTER_COLORS[i % LETTER_COLORS.length],
                                            textShadow: titleHovered
                                                ? `0 0 22px ${LETTER_COLORS[i % LETTER_COLORS.length]}dd, 0 0 50px ${LETTER_COLORS[i % LETTER_COLORS.length]}77`
                                                : `0 0 12px ${LETTER_COLORS[i % LETTER_COLORS.length]}99, 0 0 24px ${LETTER_COLORS[i % LETTER_COLORS.length]}44`,
                                            opacity:    0,
                                            animation:  `lnlFadeUp 0.07s ease forwards ${0.85 + i * 0.055}s`,
                                            transition: 'text-shadow 0.3s ease',
                                        }}
                                    >
                                        {char}
                                    </span>
                                );
                            })}
                        </span>
                    </h1>

                    {/* Slogan */}
                    <motion.p
                        className="text-sm sm:text-base text-slate-400 mb-10 mt-4 font-light tracking-[0.25em] uppercase text-center md:text-left"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 2.5, duration: 1 }}
                    >
                        Where strokes meet dimensions
                    </motion.p>

                    {/* CTA button */}
                    <motion.button
                        onClick={navigateToGallery}
                        className="relative font-bold py-4 px-10 rounded-full text-base sm:text-lg"
                        initial={{ opacity: 0, scale: 0.92 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 2.75, duration: 0.5 }}
                        whileHover={{ scale: 1.06 }}
                        whileTap={{ scale: 0.97 }}
                        style={{
                            background: 'transparent',
                            border:     '2px solid rgba(34,211,238,0.65)',
                            boxShadow:  '0 0 22px rgba(34,211,238,0.3), inset 0 0 18px rgba(34,211,238,0.06)',
                            color:      'white'
                        }}
                    >
                        <span style={{
                            background: 'linear-gradient(90deg,#22d3ee,#a78bfa,#f472b6)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}>
                            Click here to view My Art
                        </span>
                    </motion.button>

                    {/* About Me arrow — sits below CTA on mobile, bottom-left on desktop */}
                    <motion.div
                        className="flex flex-col items-center cursor-pointer group select-none mt-12"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 3.1, duration: 0.6 }}
                        onClick={handleArrowClick}
                    >
                        <span className="text-[10px] tracking-[0.3em] text-cyan-400 mb-2 group-hover:text-cyan-300 uppercase transition-colors">
                            About Me
                        </span>
                        <motion.div
                            animate={{ y: [0, 9, 0] }}
                            transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
                            className="w-9 h-9 rounded-full border border-cyan-400/55 flex items-center justify-center group-hover:bg-cyan-400/10 transition-colors"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2.5">
                                <polyline points="6 9 12 15 18 9"/>
                            </svg>
                        </motion.div>
                    </motion.div>
                </div>

                {/* ── Right column: draggable art cards ── */}
                {/* Cards can be freely dragged; images come from photos/art1-5.jpg */}
                <motion.div
                    className="flex-1 relative w-full hidden md:block"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2, duration: 1.2 }}
                >
                    <DraggableCards />
                </motion.div>
            </section>

            {/* ── About Section — normal page flow, user scrolls down to reach it */}
            <section
                id="about-section"
                ref={aboutRef}
                className="relative min-h-screen flex items-center justify-center p-5 sm:p-8"
                style={{ background: 'linear-gradient(150deg,#0a0e1f 0%,#0f1635 40%,#150d2b 100%)' }}
            >
                {/* Soft glowing divider — replaces the harsh rainbow line.
                    Blends the hero's canvas bg into the about section bg. */}
                <div className="absolute top-0 left-0 right-0 pointer-events-none" style={{ height: '120px' }}>
                    {/* Fade mask from transparent to section bg */}
                    <div className="absolute inset-0" style={{
                        background: 'linear-gradient(to bottom, transparent 0%, rgba(10,14,31,0.7) 50%, rgba(10,14,31,1) 100%)'
                    }} />
                    {/* Subtle multi-colour glow strip — softened, no hard line */}
                    <div className="absolute bottom-0 left-0 right-0" style={{
                        height: '2px',
                        background: 'linear-gradient(90deg, transparent 0%, #22d3ee44 20%, #818cf855 40%, #f472b644 60%, #fb923c44 80%, transparent 100%)',
                        filter: 'blur(2px)'
                    }} />
                </div>

                {/* Glassmorphic card */}
                <div className="max-w-4xl w-full rounded-2xl p-6 sm:p-10 flex flex-col md:flex-row gap-8 md:gap-12 items-center z-10 border border-white/10 shadow-2xl"
                    style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(18px)' }}>

                    {/* Left — bio and contact */}
                    <div className="flex-1 space-y-4">
                        <h2 className="text-3xl sm:text-4xl font-extrabold text-center md:text-left"
                            style={{ background: 'linear-gradient(90deg,#22d3ee,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            About Me
                        </h2>
                        <p className="text-slate-300 leading-relaxed text-sm sm:text-base">
                            Built by <span className="font-bold text-white">Manthan Parekh</span>
                        </p>
                        <p className="text-slate-300 leading-relaxed text-sm sm:text-base">
                            AI &amp; Data Science student with a strong interest in finance, focused on building
                            practical tools that simplify real-world financial decisions using mathematics and
                            technology. Have art as a hobby. Love to paint and sketch.
                        </p>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            From ink studies to fully digital paintings, this gallery documents an evolving
                            journey through line, colour, and dimension.
                        </p>
                        <p className="text-slate-300 text-sm font-bold leading-relaxed">
                            Always welcome for the next art suggestions. just....
                        </p>

                        {/* Connect Me On — glassy social cards */}
                        <div className="space-y-3 pt-2">
                            <p className="text-white font-bold text-sm tracking-wide">Connect Me On</p>

                            {/* LinkedIn */}
                            <a href="https://linkedin.com/in/manthanparekh2805" target="_blank" rel="noreferrer"
                                className="flex items-center gap-3 rounded-xl px-4 py-3 border border-white/10 hover:border-blue-400/40 transition-all"
                                style={{ background: 'rgba(255,255,255,0.05)' }}>
                                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                                    style={{ background: '#0077b5' }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                                        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
                                        <rect x="2" y="9" width="4" height="12"/>
                                        <circle cx="4" cy="4" r="2"/>
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-white font-semibold text-sm">LinkedIn</p>
                                    <p className="text-slate-400 text-xs">linkedin.com/in/manthanparekh2805</p>
                                </div>
                            </a>

                            {/* Instagram */}
                            <a href="https://www.instagram.com/manthanparekh138/" target="_blank" rel="noreferrer"
                                className="flex items-center gap-3 rounded-xl px-4 py-3 border border-white/10 hover:border-pink-400/40 transition-all"
                                style={{ background: 'rgba(255,255,255,0.05)' }}>
                                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                                    style={{ background: 'linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)' }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                                        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-white font-semibold text-sm">Instagram</p>
                                    <p className="text-slate-400 text-xs">@manthanparekh138</p>
                                </div>
                            </a>

                            {/* Email */}
                            <a href="mailto:manthanparekh9d@gmail.com"
                                className="flex items-center gap-3 rounded-xl px-4 py-3 border border-white/10 hover:border-cyan-400/40 transition-all"
                                style={{ background: 'rgba(255,255,255,0.05)' }}>
                                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                                    style={{ background: '#0e7490' }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                                        <polyline points="22,6 12,13 2,6"/>
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-white font-semibold text-sm">Email</p>
                                    <p className="text-slate-400 text-xs">manthanparekh9d@gmail.com</p>
                                </div>
                            </a>
                        </div>
                    </div>

                    {/* Right — profile photo. IMAGE PATH: photos/profile.jpg */}
                    <div className="shrink-0 flex flex-col items-center gap-2">
                        <div className="rounded-2xl overflow-hidden border border-white/10 w-full"
                            style={{ maxWidth: '340px', boxShadow: '0 0 35px rgba(34,211,238,0.15)' }}>
                            <img
                                src="photos/profile.jpg"
                                alt="Artist Profile"
                                className="w-full h-auto block"
                            />
                        </div>
                        <p className="text-[10px] text-slate-500 tracking-[0.25em] uppercase mt-1">The Artist</p>
                    </div>
                </div>
            </section>

            {/* ── Admin Login Modal ──────────────────────────────────────────────── */}
            <AnimatePresence>
                {showLogin && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
                        onClick={e => e.target === e.currentTarget && setShowLogin(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 16 }}
                            animate={{ scale: 1,   y: 0  }}
                            exit={{    scale: 0.9, y: 16 }}
                            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                            className="w-full max-w-md p-8 rounded-2xl border border-slate-700/80 shadow-2xl"
                            style={{ background: 'rgba(15,23,42,0.96)', backdropFilter: 'blur(16px)' }}
                        >
                            <div className="flex justify-between items-center mb-7">
                                <h3 className="text-2xl font-bold"
                                    style={{ background: 'linear-gradient(90deg,#22d3ee,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                    Admin Login
                                </h3>
                                <button onClick={() => setShowLogin(false)} className="text-slate-400 hover:text-white transition p-1">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                        <line x1="18" y1="6" x2="6"  y2="18"/>
                                        <line x1="6"  y1="6" x2="18" y2="18"/>
                                    </svg>
                                </button>
                            </div>

                            <form onSubmit={handleLogin} className="space-y-5">
                                <div>
                                    <label className="block text-[11px] text-slate-400 mb-1.5 uppercase tracking-widest">Email</label>
                                    <input
                                        type="email" value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        placeholder="admin@gallery.com"
                                        className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-cyan-400 transition-colors"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] text-slate-400 mb-1.5 uppercase tracking-widest">Password</label>
                                    <input
                                        type="password" value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        placeholder="••••••••••"
                                        className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-cyan-400 transition-colors"
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="w-full font-bold py-3 rounded-lg text-slate-900 transition-all mt-1"
                                    style={{ background: 'linear-gradient(90deg,#22d3ee,#818cf8)', boxShadow: '0 0 22px rgba(34,211,238,0.35)' }}
                                >
                                    Login
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Keyframe for per-letter typewriter fade-up animation */}
            <style dangerouslySetInnerHTML={{__html:`
                @keyframes lnlFadeUp {
                    from { opacity: 0; transform: translateY(10px); }
                    to   { opacity: 1; transform: translateY(0);    }
                }
            `}} />
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);