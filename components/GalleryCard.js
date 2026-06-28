// ─────────────────────────────────────────────────────────────────────────────
// components/GalleryCard.js
//
// STATE FLOW:
//   liked        — whether THIS browser session has liked this image.
//                  Initialised from getLikedSet() on mount.
//                  Toggling updates both the Set (localStorage) and the global
//                  like count via onUpdate().
//   showComments — toggles the inline comment panel that slides up from the
//                  bottom of the card (does NOT cover the image — sits below).
//   newComment   — controlled input for the comment field.
//   imgLoaded    — hides the image until it finishes loading (shows spinner).
//
// PROPS:
//   image    {id, url, likes, comments[]}
//   isAdmin  {boolean}  — shows the delete button on hover
//   onDelete {fn(id)}   — parent removes card from state + localStorage
//   onUpdate {fn(id, updatedImage)} — parent merges updates into state
// ─────────────────────────────────────────────────────────────────────────────

function GalleryCard({ image, isAdmin, onDelete, onUpdate }) {
    const { useState, useEffect, useRef } = React;
    const { motion, AnimatePresence } = window.Motion;

    // Initialise liked state from the persistent Set in localStorage
    const [liked, setLiked]               = useState(() => getLikedSet().has(image.id));
    const [showComments, setShowComments] = useState(false);
    const [newComment,   setNewComment]   = useState('');
    const [commentName,  setCommentName]  = useState('');
    const [imgLoaded,    setImgLoaded]    = useState(false);
    const commentInputRef                 = useRef(null);
    const nameInputRef                    = useRef(null);

    // Re-sync if a parent re-renders this card with a different image.id
    useEffect(() => {
        setLiked(getLikedSet().has(image.id));
    }, [image.id]);

    // Auto-focus the name input when panel opens
    useEffect(() => {
        if (showComments && nameInputRef.current) {
            setTimeout(() => nameInputRef.current && nameInputRef.current.focus(), 150);
        }
    }, [showComments]);

    // ── Handlers ──────────────────────────────────────────────────────────────

    // Toggle like: flip session Set + adjust global count by ±1
    const handleLike = () => {
        const set   = getLikedSet();
        const delta = set.has(image.id) ? -1 : 1;
        delta === -1 ? set.delete(image.id) : set.add(image.id);
        saveLikedSet(set);
        setLiked(delta === 1);
        onUpdate(image.id, { ...image, likes: Math.max(0, image.likes + delta) });
        if (delta === 1) notifyLike(image.url);
    };

    // Add comment on Enter key; name is required — shake name field if missing
    const handleAddComment = (e) => {
        if (e.key !== 'Enter' || !newComment.trim()) return;
        if (!commentName.trim()) {
            if (nameInputRef.current) {
                nameInputRef.current.focus();
                nameInputRef.current.style.borderColor = '#f87171';
                setTimeout(() => {
                    if (nameInputRef.current) nameInputRef.current.style.borderColor = '';
                }, 1200);
            }
            return;
        }
        const name    = commentName.trim();
        const comment = { name, text: newComment.trim(), ts: Date.now() };
        onUpdate(image.id, { ...image, comments: [...image.comments, comment] });
        notifyComment(image.url, name, newComment.trim());
        setNewComment('');
    };

    // Render comment with @name attribution; handles legacy string-only comments
    const renderComment = (c) => {
        if (typeof c === 'string') return c;
        return (
            <span>
                <span className="font-semibold text-cyan-400">@{c.name} </span>
                <span>{c.text}</span>
            </span>
        );
    };

    // ── SVG Heart (filled when liked, outline when not) ───────────────────────
    const HeartIcon = ({ filled }) => (
        <svg
            width="18" height="18"
            viewBox="0 0 24 24"
            fill={filled ? '#f472b6' : 'none'}
            stroke={filled ? '#f472b6' : 'currentColor'}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ transition: 'all 0.2s ease', filter: filled ? 'drop-shadow(0 0 6px #f472b6aa)' : 'none' }}
        >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
    );

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <div
            className="relative group bg-slate-800/80 rounded-xl overflow-hidden border border-slate-700/50 flex flex-col transition-all duration-300"
            style={{ minHeight: '260px' }}
            data-name="GalleryCard"
        >
            {/* Glowing cyan border on hover */}
            <div
                className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10"
                style={{ boxShadow: 'inset 0 0 0 2px rgba(56,189,248,0.75), 0 0 22px rgba(56,189,248,0.3)' }}
            />

            {/* Admin: delete button — visible on hover */}
            {isAdmin && (
                <button
                    onClick={() => onDelete(image.id)}
                    className="absolute top-2 right-2 z-20 bg-red-500/80 hover:bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
                    title="Delete artwork"
                >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                    </svg>
                </button>
            )}

            {/* Image with loading spinner */}
            <div className="flex-1 overflow-hidden relative bg-slate-900 min-h-[180px]">
                {!imgLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-7 h-7 border-2 border-slate-600 border-t-cyan-400 rounded-full animate-spin" />
                    </div>
                )}
                <img
                    src={image.url}
                    alt="Artwork"
                    className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
                    onLoad={() => setImgLoaded(true)}
                />
            </div>

            {/* Action bar: like toggle + comment toggle */}
            <div className="bg-slate-900/95 px-3 py-2 flex justify-between items-center z-10 shrink-0 border-t border-white/5">
                <button
                    onClick={handleLike}
                    className={`flex items-center gap-1.5 transition-transform duration-150 hover:scale-110 ${liked ? 'text-pink-400' : 'text-slate-400 hover:text-pink-300'}`}
                    title={liked ? 'Unlike' : 'Like'}
                >
                    <HeartIcon filled={liked} />
                    <span className="text-xs font-semibold tabular-nums">{image.likes}</span>
                </button>

                <button
                    onClick={() => setShowComments(p => !p)}
                    className={`flex items-center gap-1.5 transition-colors duration-150 ${showComments ? 'text-cyan-400' : 'text-slate-400 hover:text-cyan-300'}`}
                    title="Comments"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                    <span className="text-xs font-semibold tabular-nums">{image.comments.length}</span>
                </button>
            </div>

            {/* Inline comment panel — slides in below the action bar, NOT over the image */}
            <AnimatePresence>
                {showComments && (
                    <motion.div
                        key="comment-panel"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: 'easeInOut' }}
                        className="overflow-hidden bg-slate-900/98 border-t border-slate-700/40 z-10 shrink-0"
                    >
                        {/* Comments list — always at the top */}
                        <div className="px-2 pt-2 max-h-[90px] overflow-y-auto space-y-1">
                            {image.comments.length === 0 ? (
                                <p className="text-[11px] text-slate-500 italic px-1 pb-1">No comments yet — be first!</p>
                            ) : (
                                image.comments.map((c, i) => (
                                    <div key={i} className="text-[11px] text-slate-300 bg-slate-800/80 rounded px-2 py-1 border border-slate-700/40 leading-snug">
                                        {renderComment(c)}
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Divider */}
                        <div className="mx-2 mt-2 border-t border-slate-700/40" />

                        {/* Name input */}
                        <div className="px-2 pt-2 pb-1">
                            <input
                                ref={nameInputRef}
                                type="text"
                                value={commentName}
                                onChange={e => setCommentName(e.target.value)}
                                placeholder="Comment by @yourname"
                                maxLength={30}
                                className="w-full bg-slate-800/60 border border-slate-600/40 rounded px-2.5 py-1.5 text-[11px] text-cyan-300 focus:outline-none focus:border-cyan-400/80 placeholder-slate-500 transition-colors font-semibold"
                            />
                        </div>

                        {/* Comment text input */}
                        <div className="px-2 pb-2 pt-1">
                            <input
                                ref={commentInputRef}
                                type="text"
                                value={newComment}
                                onChange={e => setNewComment(e.target.value)}
                                onKeyDown={handleAddComment}
                                placeholder="Write a comment… (Enter to post)"
                                className="w-full bg-slate-800 border border-slate-600/60 rounded px-2.5 py-1.5 text-[11px] text-white focus:outline-none focus:border-cyan-400/80 placeholder-slate-500 transition-colors"
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}