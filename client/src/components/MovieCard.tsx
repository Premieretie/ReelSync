import React, { useState } from 'react';
import { Play, Plus, ThumbsUp, ThumbsDown, Check, Heart } from 'lucide-react';
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
}

export const MovieCard: React.FC<MovieCardProps> = ({ movie, sessionId, userId, mode, onAction }) => {
  const [added, setAdded] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const { user } = useAuth();
  const { playMovie } = useVideoPlayer();

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
    <div className="relative group overflow-hidden rounded-xl bg-slate-900 border border-slate-800 shadow-lg transition-transform hover:scale-[1.02]">
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
        
        {/* Favorite Button (Top Right) */}
        {user && (
            <button 
                onClick={handleFavorite}
                className={cn("absolute top-2 right-2 p-2 rounded-full transition shadow-lg z-10", favorited ? "bg-pink-600 text-white" : "bg-black/50 text-white hover:bg-pink-600")}
            >
                <Heart size={16} fill={favorited ? "currentColor" : "none"} />
            </button>
        )}

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

          {mode === 'shared' && (
             <div className="flex gap-4">
                <button onClick={() => handleVote(1)} className="p-3 bg-green-600 rounded-full hover:bg-green-700"><ThumbsUp size={20} /></button>
                <button onClick={() => handleVote(-1)} className="p-3 bg-red-600 rounded-full hover:bg-red-700"><ThumbsDown size={20} /></button>
             </div>
          )}
          
           {mode === 'shared' && user?.subscription_status === 'active' && (
              <button onClick={handleMarkWatched} className="mt-4 text-xs text-slate-400 underline hover:text-white">Mark as Watched</button>
           )}
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-bold text-lg leading-tight mb-1 truncate">{movie.title}</h3>
        <p className="text-xs text-slate-400">{movie.release_date?.split('-')[0]} • {Number(movie.vote_average || 0).toFixed(1)}/10</p>
        <p className="text-sm text-slate-300 mt-2 line-clamp-3">{movie.overview}</p>
      </div>
    </div>
  );
};
