import React, { useState } from 'react';
import { Play, Plus, ThumbsUp, ThumbsDown, Check, Heart, Scale, Sparkles, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { addToSharedList, voteMovie, addToHistory, addToFavorites } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useVideoPlayer } from '@/context/VideoPlayerContext';
import { cn } from '@/lib/utils';

interface MovieCardProps {
  movie: any;
  sessionId: number;
  userId?: number;
  mode: 'recommendation' | 'shared' | 'history';
  onAction?: () => void;
  onRemove?: () => void;
  voteCounts?: { likes: number; dislikes: number };
}

export const MovieCard: React.FC<MovieCardProps> = ({ movie, sessionId, userId, mode, onAction, onRemove, voteCounts }) => {
  const [added, setAdded] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [userVote, setUserVote] = useState<'like' | 'dislike' | null>(null);
  const { user } = useAuth();
  const { playMovie } = useVideoPlayer();

  const isSplitDecision = mode === 'shared' && voteCounts && voteCounts.likes > 0 && voteCounts.dislikes > 0;
  const isMatch = mode === 'shared' && voteCounts && voteCounts.likes >= 2;

  const handlePlayTrailer = () => {
    playMovie(movie.id, movie.title);
  };

  const handleAddToList = async () => {
    if (!userId) return;
    try {
      await addToSharedList(sessionId, movie.id, movie, userId);
      setAdded(true);
      if (onAction) onAction();
    } catch (e) {
      console.error(e);
    }
  };

  const handleVote = async (val: number) => {
    if (!userId) return;
    setUserVote(val === 1 ? 'like' : 'dislike');
    try {
      await voteMovie(sessionId, movie.id, userId, val);
      // Optimistic update or callback could go here
    } catch (e) {
      console.error(e);
    }
  };
  
  const handleMarkWatched = async () => {
       try {
        await addToHistory(sessionId, movie.id, movie.title, movie, 0, user?.id); // Link to account if logged in
        if (onAction) onAction();
       } catch(e) {
           console.error(e);
       }
  }

  const handleFavorite = async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!user) return alert("Please login to favorite movies");
      try {
          await addToFavorites(movie.id, movie);
          setFavorited(true);
      } catch(e) {
          console.error(e);
      }
  }

  return (
    <div className={cn(
        "relative group overflow-hidden rounded-xl bg-slate-900 border shadow-lg transition-transform hover:scale-[1.02]",
        isMatch ? "border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.3)]" : "border-slate-800",
        isSplitDecision ? "border-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.3)]" : ""
    )}>
      <div className="relative aspect-[2/3] w-full overflow-hidden">
        {movie.poster_path ? (
          <img
            src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
            alt={movie.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-slate-800 text-slate-500">No Image</div>
        )}
        
        {/* Overlays for Split Decision / Match */}
        {isSplitDecision && (
            <div className="absolute top-0 left-0 w-full bg-orange-600 text-white text-xs font-bold py-1 flex items-center justify-center gap-1 z-20">
                <Scale size={14} /> SPLIT DECISION
            </div>
        )}
        {isMatch && (
            <div className="absolute top-0 left-0 w-full bg-green-600 text-white text-xs font-bold py-1 flex items-center justify-center gap-1 z-20">
                <Sparkles size={14} /> IT'S A MATCH!
            </div>
        )}

        {/* Favorite Button (Top Right) */}
        {user && (
            <button 
                onClick={handleFavorite}
                className={cn("absolute top-2 right-2 p-2 rounded-full transition shadow-lg z-10", favorited ? "bg-pink-600 text-white" : "bg-black/50 text-white hover:bg-pink-600")}
            >
                <Heart size={16} fill={favorited ? "currentColor" : "none"} />
            </button>
        )}

        {/* Remove Button (For Movie IQ Winner) */}
        {onRemove && (
            <button 
                onClick={(e) => { e.stopPropagation(); onRemove(); }}
                className="absolute top-2 right-12 p-2 rounded-full bg-red-600 text-white shadow-lg z-30 hover:bg-red-700 hover:scale-110 transition"
                title="Remove from list"
            >
                <X size={16} />
            </button>
        )}

        {/* Voted Indicator (Top Right - Left of Favorite) */}
        <div className="absolute top-2 right-12 z-10 flex gap-2">
            {userVote === 'like' && (
                <motion.div 
                    layoutId={`vote-like-${movie.id}`}
                    className="p-2 bg-green-600 rounded-full text-white shadow-lg"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                >
                    <ThumbsUp size={16} />
                </motion.div>
            )}
            {userVote === 'dislike' && (
                <motion.div 
                    layoutId={`vote-dislike-${movie.id}`}
                    className="p-2 bg-red-600 rounded-full text-white shadow-lg"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                >
                    <ThumbsDown size={16} />
                </motion.div>
            )}
        </div>

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-4 p-4">
          <button onClick={handlePlayTrailer} className="flex items-center gap-2 px-4 py-2 bg-red-600 rounded-full hover:bg-red-700 transition font-bold">
            <Play size={16} fill="white" /> Trailer
          </button>
          
          {mode === 'recommendation' && !added && (
            <button onClick={handleAddToList} className="flex items-center gap-2 px-4 py-2 bg-blue-600 rounded-full hover:bg-blue-700 transition font-bold">
              <Plus size={16} /> Add to List
            </button>
          )}
          {mode === 'recommendation' && added && (
             <div className="flex items-center gap-2 text-green-400 font-bold"><Check size={16} /> Added</div>
          )}

          {mode === 'shared' && !userVote && (
             <div className="flex gap-4">
                <motion.button 
                    layoutId={`vote-like-${movie.id}`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleVote(1)} 
                    className="p-3 bg-green-600 rounded-full hover:bg-green-700"
                >
                    <ThumbsUp size={20} />
                </motion.button>
                <motion.button 
                    layoutId={`vote-dislike-${movie.id}`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleVote(-1)} 
                    className="p-3 bg-red-600 rounded-full hover:bg-red-700"
                >
                    <ThumbsDown size={20} />
                </motion.button>
             </div>
          )}
          
           {mode === 'shared' && user?.subscription_status === 'active' && (
              <button onClick={handleMarkWatched} className="mt-4 text-xs text-slate-400 underline hover:text-white">Mark as Watched</button>
           )}
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-bold text-lg leading-tight mb-1 truncate">{movie.title}</h3>
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mb-2">
            <span>{movie.release_date?.split('-')[0]}</span>
            <span>•</span>
            <span>{Number(movie.vote_average || 0).toFixed(1)}/10</span>
            {movie.runtime > 0 && (
                <>
                    <span>•</span>
                    <span>{Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m</span>
                </>
            )}
            {(movie.original_language || movie.origin_country) && (
                <>
                   <span>•</span>
                   <span className="uppercase">{movie.original_language || movie.origin_country}</span>
                </>
            )}
        </div>
        
        <p className="text-sm text-slate-300 mt-2 line-clamp-3">{movie.overview}</p>
        
        {movie.cast && movie.cast.length > 0 && (
            <p className="text-xs text-slate-500 mt-2 truncate">
                <span className="text-slate-400 font-semibold">Stars:</span> {movie.cast.join(', ')}
            </p>
        )}
      </div>
    </div>
  );
};
