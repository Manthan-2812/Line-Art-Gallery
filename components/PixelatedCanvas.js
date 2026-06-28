// ─────────────────────────────────────────────────────────────────────────────
// components/PixelatedCanvas.js
//
// Renders any image as an interactive grid of coloured dots.
// Mouse hover creates a repulsion distortion — dots scatter away from the
// cursor then spring back when the cursor leaves.
//
// PROFILE IMAGE PATH:
//   Put your photo at:  photos/profile.jpg
//   The `src` prop is passed in from the About Me section in app.js.
//
// Props:
//   src             {string}  — image URL or relative path
//   width           {number}  — canvas width  (default 300)
//   height          {number}  — canvas height (default 380)
//   cellSize        {number}  — dot grid spacing in px (default 4)
//   dotRadius       {number}  — dot draw radius as fraction of cellSize (default 0.82)
//   repelRadius     {number}  — mouse repulsion radius in px (default 65)
//   repelStrength   {number}  — how hard dots are pushed (default 5)
//   returnSpeed     {number}  — spring-back lerp factor 0–1 (default 0.09)
// ─────────────────────────────────────────────────────────────────────────────

function PixelatedCanvas({
    src,
    width        = 300,
    height       = 380,
    cellSize     = 4,
    dotRadius    = 0.82,
    repelRadius  = 65,
    repelStrength = 5,
    returnSpeed  = 0.09,
}) {
    const { useRef, useEffect } = React;

    const canvasRef  = useRef(null);
    const mouseRef   = useRef({ x: -9999, y: -9999, active: false });
    const animRef    = useRef(null);
    const dotsRef    = useRef([]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        // ── 1. Load the image and sample pixel colours ───────────────────────
        const img = new Image();
        img.crossOrigin = 'anonymous';

        img.onload = () => {
            // Off-screen canvas to extract pixel data
            const offscreen    = document.createElement('canvas');
            offscreen.width    = width;
            offscreen.height   = height;
            const octx         = offscreen.getContext('2d');
            octx.drawImage(img, 0, 0, width, height);

            const { data } = octx.getImageData(0, 0, width, height);
            const dots = [];

            for (let py = 0; py < height; py += cellSize) {
                for (let px = 0; px < width; px += cellSize) {
                    const i = (py * width + px) * 4;
                    const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
                    if (a < 40) continue; // skip fully transparent areas

                    dots.push({
                        ox: px + cellSize / 2,  // original x
                        oy: py + cellSize / 2,  // original y
                        cx: px + cellSize / 2,  // current x (animated)
                        cy: py + cellSize / 2,  // current y (animated)
                        color: `rgba(${r},${g},${b},${(a / 255).toFixed(2)})`,
                    });
                }
            }
            dotsRef.current = dots;

            // ── 2. Animation loop ─────────────────────────────────────────────
            const render = () => {
                ctx.clearRect(0, 0, width, height);
                const { x: mx, y: my, active } = mouseRef.current;
                const r2 = repelRadius * repelRadius;

                for (const dot of dotsRef.current) {
                    if (active) {
                        const dx   = dot.cx - mx;
                        const dy   = dot.cy - my;
                        const dist2 = dx * dx + dy * dy;

                        if (dist2 < r2) {
                            const dist  = Math.sqrt(dist2);
                            const force = (1 - dist / repelRadius);
                            const angle = Math.atan2(dy, dx);
                            dot.cx += Math.cos(angle) * force * repelStrength;
                            dot.cy += Math.sin(angle) * force * repelStrength;
                        }
                    }

                    // Spring back toward origin
                    dot.cx += (dot.ox - dot.cx) * returnSpeed;
                    dot.cy += (dot.oy - dot.cy) * returnSpeed;

                    // Draw circle dot
                    const rad = (cellSize / 2) * dotRadius;
                    ctx.fillStyle = dot.color;
                    ctx.beginPath();
                    ctx.arc(dot.cx, dot.cy, rad, 0, Math.PI * 2);
                    ctx.fill();
                }

                animRef.current = requestAnimationFrame(render);
            };
            render();
        };

        img.onerror = () => {
            // Graceful fallback — draw a placeholder with text
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(0, 0, width, height);
            ctx.fillStyle = '#334155';
            ctx.font = '13px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('Place your photo at', width / 2, height / 2 - 16);
            ctx.fillText('photos/profile.jpg', width / 2, height / 2 + 6);
        };

        img.src = src;

        return () => {
            if (animRef.current) cancelAnimationFrame(animRef.current);
        };
    }, [src, width, height, cellSize, dotRadius, repelRadius, repelStrength, returnSpeed]);

    // ── Mouse tracking (coordinates scaled to canvas logical size) ───────────
    const onMouseMove = (e) => {
        const rect   = canvasRef.current.getBoundingClientRect();
        const scaleX = width  / rect.width;
        const scaleY = height / rect.height;
        mouseRef.current = {
            x:      (e.clientX - rect.left) * scaleX,
            y:      (e.clientY - rect.top)  * scaleY,
            active: true,
        };
    };

    const onMouseLeave = () => {
        mouseRef.current = { x: -9999, y: -9999, active: false };
    };

    return (
        <canvas
            ref={canvasRef}
            width={width}
            height={height}
            onMouseMove={onMouseMove}
            onMouseLeave={onMouseLeave}
            style={{ cursor: 'crosshair', display: 'block' }}
            className="rounded-xl border border-white/10 shadow-2xl"
        />
    );
}
