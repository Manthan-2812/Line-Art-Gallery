// ─────────────────────────────────────────────────────────────────────────────
// components/FileUploadZone.js
//
// Admin artwork upload modal supporting:
//   1. Quick Multi-Upload: Bulk drop/browse multiple gallery images at once.
//   2. Dual-Asset Upload: Upload a Display Image + an Optional 300-DPI Transparent Print Master PNG.
//   3. Large File Support: Live progress tracking, MB counter, and robust error handling.
//
// Direct Cloudinary upload endpoint (no SDK required):
//   POST https://api.cloudinary.com/v1_1/{cloud_name}/auto/upload
//   FormData: file, upload_preset
// ─────────────────────────────────────────────────────────────────────────────

function FileUploadZone({ cloudName, uploadPreset, onUploaded, onClose }) {
    const { useState, useRef, useCallback } = React;
    const { motion, AnimatePresence } = window.Motion;

    const [tab, setTab] = useState('quick'); // 'quick' | 'dual'

    // Quick Multi-Upload state
    const [status, setStatus] = useState('idle'); // 'idle' | 'drag-over' | 'uploading' | 'done'
    const [progress, setProgress] = useState([]);  // [{name, pct, done, url, err, loadedMb, totalMb}]
    const quickInputRef = useRef(null);

    // Dual-Asset Upload state
    const [dualName, setDualName] = useState('');
    const [dualPrice, setDualPrice] = useState('900');
    const [displayFile, setDisplayFile] = useState(null);
    const [printFile, setPrintFile] = useState(null);
    const [dualUploading, setDualUploading] = useState(false);
    const [dualUploadStep, setDualUploadStep] = useState(''); // e.g. 'Uploading display image (45% - 5.2 MB / 11.5 MB)...'
    const [dualUploadPct, setDualUploadPct] = useState(0);
    const [dualError, setDualError] = useState('');
    const [dualSuccess, setDualSuccess] = useState(false);
    const displayInputRef = useRef(null);
    const printInputRef = useRef(null);

    // Helper: format bytes to readable MB/KB
    const formatBytes = (bytes) => {
        if (!bytes || bytes === 0) return '0 B';
        const k = 1024;
        const dm = 1;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };

    // Helper: Upload a file to Cloudinary with real-time XHR progress
    const uploadFileToCloudinary = (file, onProgress) => {
        return new Promise((resolve, reject) => {
            if (!cloudName || cloudName === 'YOUR_CLOUD_NAME') {
                return reject(new Error('Cloudinary cloud name is not configured.'));
            }
            if (!file) {
                return reject(new Error('No file selected.'));
            }

            const fd = new FormData();
            fd.append('file', file);
            fd.append('upload_preset', uploadPreset || 'vfxnz7wq');

            const xhr = new XMLHttpRequest();
            // Use auto/upload to support large images, raw assets, and PNGs
            xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, true);
            xhr.timeout = 240000; // 4 minutes timeout for large 300 DPI files

            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable && typeof onProgress === 'function') {
                    const pct = Math.round((e.loaded / e.total) * 100);
                    onProgress(pct, e.loaded, e.total);
                }
            };

            xhr.onload = () => {
                try {
                    const data = JSON.parse(xhr.responseText || '{}');
                    if (xhr.status >= 200 && xhr.status < 300 && data.secure_url) {
                        resolve({
                            url: data.secure_url,
                            public_id: data.public_id
                        });
                    } else {
                        const errMsg = data.error?.message || `Upload failed with HTTP ${xhr.status}`;
                        reject(new Error(errMsg));
                    }
                } catch (err) {
                    reject(new Error(`Server response parse error (${xhr.status}): ${xhr.responseText?.slice(0, 150)}`));
                }
            };

            xhr.onerror = () => {
                reject(new Error('Network error during upload. Please check your internet connection.'));
            };

            xhr.ontimeout = () => {
                reject(new Error('Upload timed out. The file may be too large for the current connection.'));
            };

            xhr.send(fd);
        });
    };

    // ── QUICK MULTI-UPLOAD HANDLER ──────────────────────────────────────────
    const uploadOne = async (file, idx) => {
        try {
            const data = await uploadFileToCloudinary(file, (pct, loaded, total) => {
                setProgress(p => {
                    const next = [...p];
                    next[idx] = { 
                        ...next[idx], 
                        pct, 
                        loadedMb: formatBytes(loaded), 
                        totalMb: formatBytes(total) 
                    };
                    return next;
                });
            });

            setProgress(p => {
                const next = [...p];
                next[idx] = { ...next[idx], pct: 100, done: true, url: data.url };
                return next;
            });

            onUploaded({
                id:       data.public_id || Date.now().toString(),
                url:      data.url,
                printUrl: null,
                name:     file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "),
                likes:    0,
                comments: []
            });
        } catch (err) {
            setProgress(p => {
                const next = [...p];
                next[idx] = { ...next[idx], err: err.message };
                return next;
            });
        }
    };

    const handleFiles = useCallback((files) => {
        const list = Array.from(files).filter(f => f.type.startsWith('image/'));
        if (!list.length) return;

        const initial = list.map(f => ({ 
            name: f.name, 
            pct: 0, 
            done: false, 
            url: null, 
            err: null,
            loadedMb: '0 MB',
            totalMb: formatBytes(f.size)
        }));
        setProgress(initial);
        setStatus('uploading');

        list.forEach((file, idx) => uploadOne(file, idx));
    }, [cloudName, uploadPreset]);

    const onDragOver  = (e) => { e.preventDefault(); setStatus('drag-over'); };
    const onDragLeave = ()  => { setStatus('idle'); };
    const onDrop      = (e) => {
        e.preventDefault();
        setStatus('idle');
        handleFiles(e.dataTransfer.files);
    };
    const onPick = (e) => handleFiles(e.target.files);

    const isDone = progress.length > 0 && progress.every(p => p.done || p.err);
    const isDragOver = status === 'drag-over';

    // ── DUAL-ASSET UPLOAD HANDLER ────────────────────────────────────────────
    const handleDualSubmit = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        if (!displayFile) {
            setDualError('Please select the Display Artwork image.');
            return;
        }
        setDualError('');
        setDualUploading(true);
        setDualUploadPct(0);

        try {
            // 1. Upload Display Image
            setDualUploadStep(`Uploading Display Image (${formatBytes(displayFile.size)})…`);
            const displayRes = await uploadFileToCloudinary(displayFile, (pct, loaded, total) => {
                setDualUploadPct(Math.round(pct * (printFile ? 0.45 : 0.95)));
                setDualUploadStep(`Uploading Display Image: ${pct}% (${formatBytes(loaded)} / ${formatBytes(total)})`);
            });

            // 2. Upload Optional Print Master Image (if chosen)
            let printMasterUrl = null;
            if (printFile) {
                setDualUploadStep(`Uploading 300-DPI Print Master (${formatBytes(printFile.size)})…`);
                const printRes = await uploadFileToCloudinary(printFile, (pct, loaded, total) => {
                    setDualUploadPct(45 + Math.round(pct * 0.5));
                    setDualUploadStep(`Uploading 300-DPI Print Master: ${pct}% (${formatBytes(loaded)} / ${formatBytes(total)})`);
                });
                printMasterUrl = printRes.url;
            }

            setDualUploadPct(100);
            setDualUploadStep('Finalizing artwork…');

            const cleanName = dualName.trim() || displayFile.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ") || 'Untitled Artwork';
            const priceVal = Number(dualPrice) || 900;

            onUploaded({
                id:       displayRes.public_id || Date.now().toString(),
                url:      displayRes.url,
                printUrl: printMasterUrl || null,
                name:     cleanName,
                price:    priceVal,
                likes:    0,
                comments: []
            });

            setDualSuccess(true);
            setDualUploadStep('Artwork published successfully!');
            setTimeout(() => {
                if (onClose) onClose();
            }, 1200);
        } catch (err) {
            console.error('Dual upload failed:', err);
            const msg = err.message || 'Failed to upload artwork';
            setDualError(
                msg.includes('File size') 
                    ? `${msg}. Note: Free Cloudinary presets typically limit files to 20MB. If exporting 300-DPI PNGs, save as standard PNG without uncompressed alpha channels.` 
                    : msg
            );
        } finally {
            setDualUploading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-2xl mx-auto bg-slate-900/90 border border-white/15 rounded-3xl p-5 sm:p-7 shadow-2xl backdrop-blur-md"
            data-name="FileUploadZone"
        >
            {/* Header & Mode Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10 mb-5">
                <div>
                    <h3 className="text-lg sm:text-xl font-extrabold text-white flex items-center gap-2">
                        <span>Upload Artwork to Gallery</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                        Add single artworks with optional 300-DPI transparent print masters, or bulk upload photos.
                    </p>
                </div>

                {/* Tab Switcher */}
                <div className="flex bg-slate-800/80 p-1 rounded-xl border border-white/10 shrink-0">
                    <button
                        type="button"
                        onClick={() => setTab('quick')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                            tab === 'quick'
                                ? 'bg-cyan-500 text-slate-950 shadow-md'
                                : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        Bulk Quick Upload
                    </button>
                    <button
                        type="button"
                        onClick={() => setTab('dual')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                            tab === 'dual'
                                ? 'bg-cyan-500 text-slate-950 shadow-md'
                                : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        <span>Dual-Asset (Print Master)</span>
                        <span className="text-[9px] bg-purple-500/30 text-purple-200 px-1.5 py-0.2 rounded-full font-mono">300 DPI</span>
                    </button>
                </div>
            </div>

            {/* TAB 1: QUICK MULTI-UPLOAD */}
            {tab === 'quick' && (
                <div>
                    {status !== 'uploading' && !isDone && (
                        <div
                            onDragOver={onDragOver}
                            onDragLeave={onDragLeave}
                            onDrop={onDrop}
                            onClick={() => quickInputRef.current?.click()}
                            className="relative rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-3 py-12 px-6 select-none"
                            style={{
                                borderColor:     isDragOver ? '#22d3ee' : 'rgba(34,211,238,0.35)',
                                background:      isDragOver ? 'rgba(34,211,238,0.08)' : 'rgba(255,255,255,0.02)',
                                boxShadow:       isDragOver ? '0 0 28px rgba(34,211,238,0.2)' : 'none',
                            }}
                        >
                            <svg width="42" height="42" viewBox="0 0 24 24" fill="none"
                                stroke={isDragOver ? '#22d3ee' : '#64748b'} strokeWidth="1.6">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                <polyline points="17 8 12 3 7 8"/>
                                <line x1="12" y1="3" x2="12" y2="15"/>
                            </svg>

                            <div className="text-center">
                                <p className="text-slate-200 font-bold text-sm sm:text-base">
                                    {isDragOver ? 'Release to upload' : 'Drag & drop multiple artworks here'}
                                </p>
                                <p className="text-slate-400 text-xs mt-1">
                                    or <span className="text-cyan-400 underline font-semibold">click to browse</span> · JPG, PNG, WEBP
                                </p>
                            </div>

                            <input
                                ref={quickInputRef}
                                type="file"
                                accept="image/*"
                                multiple
                                className="hidden"
                                onChange={onPick}
                            />
                        </div>
                    )}

                    {status === 'uploading' && (
                        <div className="space-y-3">
                            {progress.map((item, i) => (
                                <div key={i} className="rounded-xl border border-white/10 p-3.5 bg-white/5">
                                    <div className="flex justify-between text-xs text-slate-300 mb-1.5">
                                        <span className="truncate max-w-[60%] font-medium">{item.name}</span>
                                        <span className="font-semibold text-[11px] text-cyan-300">
                                            {item.err  ? '✗ Failed' :
                                             item.done ? '✓ Uploaded' : `${item.pct}% (${item.loadedMb || '0 MB'} / ${item.totalMb || ''})`}
                                        </span>
                                    </div>
                                    <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                                        <motion.div
                                            className="h-full rounded-full"
                                            animate={{ width: item.done ? '100%' : item.err ? '100%' : `${item.pct}%` }}
                                            transition={{ duration: 0.2 }}
                                            style={{
                                                background: item.err  ? '#f87171'
                                                          : item.done ? '#4ade80'
                                                          : 'linear-gradient(90deg,#22d3ee,#a78bfa)'
                                            }}
                                        />
                                    </div>
                                    {item.err && <p className="text-red-400 text-[11px] mt-1">{item.err}</p>}
                                </div>
                            ))}
                        </div>
                    )}

                    {isDone && (
                        <div className="text-center py-6 space-y-2">
                            <p className="text-emerald-400 font-bold text-base">
                                {progress.filter(p => p.done).length} artwork(s) uploaded successfully ✓
                            </p>
                            {progress.some(p => p.err) && (
                                <p className="text-red-400 text-xs">
                                    {progress.filter(p => p.err).length} file(s) failed.
                                </p>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* TAB 2: DUAL-ASSET UPLOAD (Display Image + Optional Print Master) */}
            {tab === 'dual' && (
                <form onSubmit={handleDualSubmit} className="space-y-4">
                    {/* Artwork Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                                Artwork Title
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. Lord Shiva & Ganesha"
                                value={dualName}
                                onChange={e => setDualName(e.target.value)}
                                className="w-full bg-slate-800/90 border border-white/20 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-400"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                                Base Price (INR ₹)
                            </label>
                            <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                                <input
                                    type="number"
                                    min="1"
                                    value={dualPrice}
                                    onChange={e => setDualPrice(e.target.value)}
                                    className="w-full bg-slate-800/90 border border-white/20 rounded-xl pl-8 pr-3 py-2 text-white font-bold text-sm focus:outline-none focus:border-cyan-400"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Dual Asset Pickers */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                        {/* 1. Primary Display Image (Required) */}
                        <div 
                            onClick={() => displayInputRef.current?.click()}
                            className={`p-4 rounded-2xl border-2 border-dashed cursor-pointer transition-all flex flex-col items-center text-center ${
                                displayFile 
                                    ? 'border-cyan-400/80 bg-cyan-950/20' 
                                    : 'border-white/20 hover:border-cyan-400/50 bg-white/5'
                            }`}
                        >
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 mb-2">
                                1. Display Image (Required)
                            </span>
                            <p className="text-xs font-bold text-slate-200 truncate max-w-full">
                                {displayFile ? displayFile.name : 'Choose Gallery Photo'}
                            </p>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                                {displayFile ? formatBytes(displayFile.size) : 'Shown on website & gallery'}
                            </p>
                            <input
                                ref={displayInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={e => setDisplayFile(e.target.files[0] || null)}
                            />
                        </div>

                        {/* 2. Optional Print Master PNG (300 DPI Transparent) */}
                        <div 
                            onClick={() => printInputRef.current?.click()}
                            className={`p-4 rounded-2xl border-2 border-dashed cursor-pointer transition-all flex flex-col items-center text-center ${
                                printFile 
                                    ? 'border-purple-400/80 bg-purple-950/20' 
                                    : 'border-white/20 hover:border-purple-400/50 bg-white/5'
                            }`}
                        >
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30 mb-2">
                                2. Print Master (Optional)
                            </span>
                            <p className="text-xs font-bold text-slate-200 truncate max-w-full">
                                {printFile ? printFile.name : 'Choose 300 DPI Transparent PNG'}
                            </p>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                                {printFile ? formatBytes(printFile.size) : 'Sent to Qikink for print orders'}
                            </p>
                            <input
                                ref={printInputRef}
                                type="file"
                                accept="image/png,image/*"
                                className="hidden"
                                onChange={e => setPrintFile(e.target.files[0] || null)}
                            />
                        </div>
                    </div>

                    <div className="bg-slate-800/60 border border-white/10 rounded-xl p-3 text-[11px] text-slate-400 leading-relaxed">
                        <strong className="text-cyan-300 font-semibold">Dual-URL Print System:</strong> Attach your 300-DPI transparent PNG (e.g. 11×14 in at 300 DPI) for Qikink DTG printing. If omitted, orders default to the Display Image.
                    </div>

                    {dualError && (
                        <p className="text-xs text-red-400 bg-red-950/40 border border-red-500/30 rounded-xl p-2.5 text-center leading-relaxed">
                            {dualError}
                        </p>
                    )}

                    {dualUploading && (
                        <div className="space-y-2 py-2">
                            <div className="flex justify-between items-center text-xs font-bold text-cyan-300">
                                <div className="flex items-center gap-2 truncate">
                                    <div className="w-3.5 h-3.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin shrink-0" />
                                    <span className="truncate">{dualUploadStep}</span>
                                </div>
                                <span className="shrink-0 font-mono">{dualUploadPct}%</span>
                            </div>
                            <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                                <motion.div
                                    className="h-full rounded-full"
                                    animate={{ width: `${dualUploadPct}%` }}
                                    transition={{ duration: 0.2 }}
                                    style={{ background: 'linear-gradient(90deg,#22d3ee,#a855f7)' }}
                                />
                            </div>
                        </div>
                    )}

                    {dualSuccess && (
                        <p className="text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-2.5 text-center font-bold">
                            ✓ Artwork uploaded and added to gallery!
                        </p>
                    )}

                    {/* Dual Action Buttons */}
                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-xs font-bold rounded-xl text-slate-400 hover:text-white bg-white/5 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={dualUploading || dualSuccess}
                            className="px-5 py-2 text-xs font-extrabold rounded-xl text-white bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 shadow-lg transition-all hover:scale-102 active:scale-98 disabled:opacity-50 cursor-pointer"
                        >
                            {dualUploading ? 'Uploading…' : 'Publish Artwork'}
                        </button>
                    </div>
                </form>
            )}

            {/* Quick Action footer */}
            {tab === 'quick' && (
                <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-white/10">
                    <button
                        onClick={onClose}
                        className="px-5 py-2 text-xs sm:text-sm font-bold rounded-xl text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
                    >
                        {isDone ? 'Close' : 'Cancel'}
                    </button>
                </div>
            )}
        </motion.div>
    );
}
