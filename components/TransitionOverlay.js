// ─────────────────────────────────────────────────────────────────────────────
// components/TransitionOverlay.js
//
// TWO utilities:
//
//  1. <TransitionOverlay isVisible={bool} />
//     Used on page ENTER.  Five colored brush-stroke bars cover the screen
//     on mount (isVisible=true) then wipe upward to reveal the page content.
//     Each bar has a unique gradient and a rounded bristle-stroke bottom edge.
//
//  2. TriggerTransition(targetUrl)
//     Used on page LEAVE.  Imperatively injects the same bars into the DOM,
//     animates them sweeping DOWN across the screen, then navigates.
//     Called from any component via:  TriggerTransition('gallery.html')
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
                        // Jagged bottom = brush bristle edge illusion
                        borderBottomLeftRadius:  i % 2 === 0 ? '60px 30px' : '30px 60px',
                        borderBottomRightRadius: i % 2 === 0 ? '30px 60px' : '60px 30px',
                        boxShadow: `0 8px 32px rgba(0,0,0,0.4)`
                    }}
                    initial={{ scaleY: 1 }}
                    animate={{ scaleY: isVisible ? 1 : 0 }}
                    transition={{
                        duration: 0.65,
                        delay: i * 0.08,
                        ease: [0.22, 1, 0.36, 1]
                    }}
                    onAnimationComplete={i === bars.length - 1 ? onComplete : undefined}
                />
            ))}
        </div>
    );
}

// ── Imperative page-leave transition ─────────────────────────────────────────
// Creates DOM bars, sweeps them DOWN to cover the current page, then navigates.
// Total time: ~950ms  (sweep-in 600ms + settle 350ms)

function TriggerTransition(targetUrl) {
    const overlay = document.createElement('div');
    overlay.style.cssText =
        'position:fixed;inset:0;z-index:9999;display:flex;pointer-events:none;';
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
            transition: transform 0.6s cubic-bezier(0.22,1,0.36,1) ${i * 0.08}s;
        `;
        overlay.appendChild(bar);
    });

    // Double rAF ensures the initial scaleY:0 paint happens before transition
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            Array.from(overlay.children).forEach(bar => {
                bar.style.transform = 'scaleY(1)';
            });
            // Navigate after bars fully cover the screen
            setTimeout(() => {
                window.location.href = targetUrl;
            }, 950);
        });
    });
}
