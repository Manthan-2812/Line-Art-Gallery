// ─────────────────────────────────────────────────────────────────────────────
// components/FileUploadZone.js
//
// Styled drag-and-drop / click-to-select upload zone for admin artwork uploads.
// Uploads files directly to Cloudinary via the unsigned REST API — no widget
// popup needed (the Cloudinary widget SDK script is still optional).
//
// Props:
//   cloudName    {string}  — your Cloudinary cloud name
//   uploadPreset {string}  — unsigned upload preset name
//   onUploaded   {fn({id, url, likes, comments})} — called per successful upload
//   onClose      {fn}      — called when the zone should be dismissed
//
// Direct Cloudinary upload endpoint (no SDK required):
//   POST https://api.cloudinary.com/v1_1/{cloud_name}/image/upload
//   FormData: file, upload_preset
// ─────────────────────────────────────────────────────────────────────────────

function FileUploadZone({ cloudName, uploadPreset, onUploaded, onClose }) {
    const { useState, useRef, useCallback } = React;
    const { motion, AnimatePresence } = window.Motion;

    // 'idle' | 'drag-over' | 'uploading' | 'done' | 'error'
    const [status,   setStatus]   = useState('idle');
    const [progress, setProgress] = useState([]);  // [{name, pct, done, url, err}]
    const inputRef = useRef(null);

    // ── Upload a single File object to Cloudinary ─────────────────────────────
    const uploadOne = async (file, idx) => {
        if (cloudName === 'YOUR_CLOUD_NAME') {
            setProgress(p => {
                const next = [...p];
                next[idx] = { ...next[idx], err: 'Set CLOUD_NAME in gallery-app.js first' };
                return next;
            });
            return;
        }

        const fd = new FormData();
        fd.append('file', file);
        fd.append('upload_preset', uploadPreset);

        try {
            const res  = await fetch(
                `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
                { method: 'POST', body: fd }
            );
            const data = await res.json();

            if (data.secure_url) {
                setProgress(p => {
                    const next = [...p];
                    next[idx]  = { ...next[idx], pct: 100, done: true, url: data.secure_url };
                    return next;
                });
                onUploaded({
                    id:       data.public_id || Date.now().toString(),
                    url:      data.secure_url,
                    likes:    0,
                    comments: []
                });
            } else {
                throw new Error(data.error?.message || 'Upload failed');
            }
        } catch (err) {
            setProgress(p => {
                const next = [...p];
                next[idx]  = { ...next[idx], err: err.message };
                return next;
            });
        }
    };

    // ── Handle file list (from drop or file input) ────────────────────────────
    const handleFiles = useCallback((files) => {
        const list = Array.from(files).filter(f => f.type.startsWith('image/'));
        if (!list.length) return;

        const initial = list.map(f => ({ name: f.name, pct: 0, done: false, url: null, err: null }));
        setProgress(initial);
        setStatus('uploading');

        list.forEach((file, idx) => uploadOne(file, idx));
    }, [cloudName, uploadPreset]);

    // ── Drag-and-drop handlers ────────────────────────────────────────────────
    const onDragOver  = (e) => { e.preventDefault(); setStatus('drag-over'); };
    const onDragLeave = ()  => { setStatus('idle'); };
    const onDrop      = (e) => {
        e.preventDefault();
        setStatus('idle');
        handleFiles(e.dataTransfer.files);
    };
    const onPick      = (e) => handleFiles(e.target.files);

    const isDone     = progress.length > 0 && progress.every(p => p.done || p.err);
    const isDragOver = status === 'drag-over';

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-xl mx-auto"
            data-name="FileUploadZone"
        >
            {/* Drop zone */}
            {status !== 'uploading' && !isDone && (
                <div
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                    onClick={() => inputRef.current?.click()}
                    className="relative rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-4 py-14 px-6 select-none"
                    style={{
                        borderColor:     isDragOver ? '#22d3ee' : 'rgba(34,211,238,0.3)',
                        background:      isDragOver ? 'rgba(34,211,238,0.06)' : 'rgba(255,255,255,0.03)',
                        boxShadow:       isDragOver ? '0 0 28px rgba(34,211,238,0.2)' : 'none',
                    }}
                >
                    {/* Upload icon */}
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none"
                        stroke={isDragOver ? '#22d3ee' : '#475569'} strokeWidth="1.5">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17 8 12 3 7 8"/>
                        <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>

                    <div className="text-center">
                        <p className="text-slate-200 font-semibold text-base">
                            {isDragOver ? 'Release to upload' : 'Drop artwork here'}
                        </p>
                        <p className="text-slate-500 text-sm mt-1">
                            or <span className="text-cyan-400 underline">click to browse</span> · JPG, PNG, WEBP
                        </p>
                    </div>

                    {/* Hidden actual file input */}
                    <input
                        ref={inputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={onPick}
                    />
                </div>
            )}

            {/* Upload progress list */}
            {status === 'uploading' && (
                <div className="space-y-3">
                    {progress.map((item, i) => (
                        <div key={i}
                            className="rounded-xl border border-white/10 p-4"
                            style={{ background: 'rgba(255,255,255,0.04)' }}>
                            <div className="flex justify-between text-xs text-slate-400 mb-2">
                                <span className="truncate max-w-[60%]">{item.name}</span>
                                <span>
                                    {item.err  ? '✗ Error'  :
                                     item.done ? '✓ Done'   : 'Uploading…'}
                                </span>
                            </div>
                            {/* Progress bar */}
                            <div className="h-1 rounded-full bg-slate-700 overflow-hidden">
                                <motion.div
                                    className="h-full rounded-full"
                                    animate={{ width: item.done ? '100%' : item.err ? '100%' : '60%' }}
                                    transition={{ duration: 0.5 }}
                                    style={{
                                        background: item.err  ? '#f87171'
                                                  : item.done ? '#4ade80'
                                                  : 'linear-gradient(90deg,#22d3ee,#a78bfa)'
                                    }}
                                />
                            </div>
                            {item.err && (
                                <p className="text-red-400 text-[11px] mt-1">{item.err}</p>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Done state */}
            {isDone && (
                <div className="text-center py-8 space-y-3">
                    <p className="text-green-400 font-semibold">
                        {progress.filter(p => p.done).length} image(s) uploaded ✓
                    </p>
                    {progress.some(p => p.err) && (
                        <p className="text-red-400 text-sm">
                            {progress.filter(p => p.err).length} failed
                        </p>
                    )}
                </div>
            )}

            {/* Action row */}
            <div className="flex justify-end gap-3 mt-4">
                <button
                    onClick={onClose}
                    className="px-5 py-2 text-sm rounded-xl text-slate-400 hover:text-white transition-colors"
                    style={{ background: 'rgba(255,255,255,0.06)' }}
                >
                    {isDone ? 'Done' : 'Cancel'}
                </button>
            </div>
        </motion.div>
    );
}
