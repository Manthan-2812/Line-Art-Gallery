// ─────────────────────────────────────────────────────────────────────────────
// components/TransitionOverlay.js
//
// Smooth Page Navigation & Exit Handling:
//  1. <TransitionOverlay isVisible={bool} />
//     Brush-stroke wipe on page enter. Cleans up automatically.
//
//  2. TriggerTransition(targetUrl)
//     Smooth leave transition with BFCache / back-button restoration.
//
//  3. Browser Back/Forward & Exit Confirmation prompt.
// ─────────────────────────────────────────────────────────────────────────────

function TransitionOverlay({ isVisible, onComplete }) {
    const { motion } = window.Motion;

    // 5 bars with individual gradient pairs for a brush-paint feel
    const bars = [
        { from: '#0ea5e9', to: '#6366f1' },
        { from: '#ec4899', to: '#f97316' },
        { from: '#eab308', to: '#22d3ee' },
        { from: '#3b82f6', to: '#a855f7' },
        { from: '#a855f7', to: '#ec4899' }
    ];

    return (
        <div className="fixed inset-0 z-[9999] pointer-events-none flex" data-name="TransitionOverlay">
            {bars.map((bar, i) => (
                <motion.div
                    key={i}
                    className="flex-1 relative"
                    style={{
                        background: `linear-gradient(180deg, ${bar.from}, ${bar.to})`,
                        transformOrigin: 'top',
                        borderBottomLeftRadius:  i % 2 === 0 ? '60px 30px' : '30px 60px',
                        borderBottomRightRadius: i % 2 === 0 ? '30px 60px' : '60px 30px',
                        boxShadow: `0 8px 32px rgba(0,0,0,0.4)`
                    }}
                    initial={{ scaleY: 1 }}
                    animate={{ scaleY: isVisible ? 1 : 0 }}
                    transition={{
                        duration: 0.55,
                        delay: i * 0.06,
                        ease: [0.22, 1, 0.36, 1]
                    }}
                    onAnimationComplete={i === bars.length - 1 ? onComplete : undefined}
                />
            ))}
        </div>
    );
}

// Clean up any stray overlays on back/forward cache restores
if (typeof window !== 'undefined') {
    window.addEventListener('pageshow', (event) => {
        const stray = document.getElementById('lnl-leave-transition-overlay');
        if (stray && stray.parentNode) stray.parentNode.removeChild(stray);
    });
    window.addEventListener('popstate', () => {
        const stray = document.getElementById('lnl-leave-transition-overlay');
        if (stray && stray.parentNode) stray.parentNode.removeChild(stray);
    });
}

// ── Imperative page-leave transition ─────────────────────────────────────────
function TriggerTransition(targetUrl) {
    if (!targetUrl) return;

    // Remove any existing overlay first
    const prev = document.getElementById('lnl-leave-transition-overlay');
    if (prev && prev.parentNode) prev.parentNode.removeChild(prev);

    const overlay = document.createElement('div');
    overlay.id = 'lnl-leave-transition-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;pointer-events:none;';
    document.body.appendChild(overlay);

    const gradients = [
        ['#0ea5e9','#6366f1'],
        ['#ec4899','#f97316'],
        ['#eab308','#22d3ee'],
        ['#3b82f6','#a855f7'],
        ['#a855f7','#ec4899']
    ];

    gradients.forEach(([from, to], i) => {
        const bar = document.createElement('div');
        bar.style.cssText = `
            flex: 1;
            background: linear-gradient(180deg, ${from}, ${to});
            transform-origin: top;
            transform: scaleY(0);
            border-bottom-left-radius:  ${i % 2 === 0 ? '60px 30px' : '30px 60px'};
            border-bottom-right-radius: ${i % 2 === 0 ? '30px 60px' : '60px 30px'};
            box-shadow: 0 8px 32px rgba(0,0,0,0.4);
            transition: transform 0.45s cubic-bezier(0.22,1,0.36,1) ${i * 0.05}s;
        `;
        overlay.appendChild(bar);
    });

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            Array.from(overlay.children).forEach(bar => {
                bar.style.transform = 'scaleY(1)';
            });
            setTimeout(() => {
                window.location.href = targetUrl;
            }, 550);
        });
    });
}
