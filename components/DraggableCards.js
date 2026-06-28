// ─────────────────────────────────────────────────────────────────────────────
// components/DraggableCards.js
//
// Scattered stack of draggable art cards shown on the RIGHT side of the hero.
// Each card can be freely dragged anywhere on screen with Framer Motion `drag`.
//
// IMAGE PATHS — paste your art images into the photos/ folder:
//   photos/art1.jpg  →  card 1
//   photos/art2.jpg  →  card 2
//   photos/art3.jpg  →  card 3
//   photos/art4.jpg  →  card 4
//   photos/art5.jpg  →  card 5
//
// Cards fall back to a dark gradient tile if the image file is missing.
// ─────────────────────────────────────────────────────────────────────────────

const DRAGGABLE_CARDS = [
    {
        id: 1,
        // ↓ IMAGE PATH — replace with your filename if different
        src:     'photos/art1.jpeg',
        label:   'No. 001',
        rotate:  -8,
        top:     '4%',
        left:    '2%',
        zIndex:  5,
    },
    {
        id: 2,
        src:     'photos/art2.jpeg',
        label:   'No. 002',
        rotate:  6,
        top:     '28%',
        left:    '28%',
        zIndex:  4,
    },
    {
        id: 3,
        src:     'photos/art3.jpeg',
        label:   'No. 003',
        rotate:  -4,
        top:     '52%',
        left:    '3%',
        zIndex:  3,
    },
    {
        id: 4,
        src:     'photos/art4.jpeg',
        label:   'No. 004',
        rotate:  9,
        top:     '6%',
        left:    '48%',
        zIndex:  2,
    },
    {
        id: 5,
        src:     'photos/art5.jpeg',
        label:   'No. 005',
        rotate:  -6,
        top:     '44%',
        left:    '42%',
        zIndex:  1,
    },
];

// Fallback gradient colours shown when an image fails to load
const FALLBACK_GRADIENTS = [
    'linear-gradient(135deg,#1e3a5f,#0e1f3b)',
    'linear-gradient(135deg,#2d1b4e,#130d2b)',
    'linear-gradient(135deg,#1a3a2a,#0a1f14)',
    'linear-gradient(135deg,#3a1a1a,#1f0a0a)',
    'linear-gradient(135deg,#1a2a3a,#0a1420)',
];

function DraggableCards() {
    const { motion } = window.Motion;

    return (
        // Relative container sized to fill the right-side column of the hero.
        // overflow-visible so cards can spill outside the column without clipping.
        <div
            className="relative w-full"
            style={{ height: '520px', perspective: '900px' }}
            data-name="DraggableCards"
        >
            {DRAGGABLE_CARDS.map((card, idx) => (
                <motion.div
                    key={card.id}
                    // Initial resting position and rotation from the card spec above
                    style={{
                        position:  'absolute',
                        top:       card.top,
                        left:      card.left,
                        rotate:    card.rotate,
                        zIndex:    card.zIndex,
                        transformStyle: 'preserve-3d',
                    }}
                    // Framer Motion drag — unconstrained, momentum-free
                    drag
                    dragMomentum={false}
                    // Bring to front while dragging
                    whileDrag={{ scale: 1.06, zIndex: 99, cursor: 'grabbing' }}
                    whileHover={{ scale: 1.04, zIndex: 20 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                    className="cursor-grab active:cursor-grabbing"
                >
                    {/* Card shell — dark matte surface mimicking photo paper */}
                    <div
                        className="rounded-2xl p-2 border border-white/10 shadow-2xl select-none"
                        style={{
                            width:      '140px',
                            background: '#18181b',
                            boxShadow:  '0 12px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)',
                        }}
                    >
                        {/* 3:4 portrait image */}
                        <div
                            className="rounded-xl overflow-hidden flex items-center justify-center"
                            style={{
                                aspectRatio: '3/4',
                                background:  '#f8f5f0',
                            }}
                        >
                            <img
                                src={card.src}
                                alt={card.label}
                                className="w-full h-full object-contain"
                                draggable={false}
                                onError={e => {
                                    e.target.style.display = 'none';
                                    e.target.parentNode.style.background = FALLBACK_GRADIENTS[idx % FALLBACK_GRADIENTS.length];
                                }}
                                style={{ display: 'block', pointerEvents: 'none' }}
                            />
                        </div>

                        {/* Label row */}
                        <div className="flex justify-between items-center px-1 pt-2 pb-1">
                            <span className="text-[10px] font-mono text-slate-400">
                                {card.label}
                            </span>
                            {/* Tiny coloured dot per card */}
                            <span
                                className="w-2 h-2 rounded-full"
                                style={{
                                    background: ['#22d3ee','#a78bfa','#f472b6','#4ade80','#fb923c'][idx],
                                    boxShadow:  `0 0 6px ${['#22d3ee','#a78bfa','#f472b6','#4ade80','#fb923c'][idx]}99`,
                                }}
                            />
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}
