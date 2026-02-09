import React, { createContext, useContext, useState } from 'react';
import { X, ChevronRight, ChevronLeft, Film } from 'lucide-react';
import { getMovieVideos } from '@/lib/api';

interface Video {
  key: string;
  name: string;
  type: string;
}

interface VideoPlayerContextType {
  playMovie: (movieId: number, title: string) => void;
  closePlayer: () => void;
}

const VideoPlayerContext = createContext<VideoPlayerContextType | undefined>(undefined);

export const VideoPlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [movieTitle, setMovieTitle] = useState('');
  const [videos, setVideos] = useState<Video[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  const playMovie = async (movieId: number, title: string) => {
    setIsOpen(true);
    setMovieTitle(title);
    setLoading(true);
    setVideos([]);
    setCurrentIndex(0);

    try {
      const res = await getMovieVideos(movieId);
      // Filter for YouTube trailers/videos
      const validVideos = res.data.results.filter((v: any) => v.site === "YouTube");
      setVideos(validVideos);
    } catch (e) {
      console.error("Failed to load videos", e);
    } finally {
      setLoading(false);
    }
  };

  const closePlayer = () => {
    setIsOpen(false);
    setVideos([]);
  };

  const nextVideo = () => {
    if (currentIndex < videos.length - 1) setCurrentIndex(prev => prev + 1);
  };

  const prevVideo = () => {
    if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
  };

  return (
    <VideoPlayerContext.Provider value={{ playMovie, closePlayer }}>
      {children}
      
      {/* Cinema Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-200">
          
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center text-white z-10">
            <div className="flex items-center gap-3">
                <Film className="text-purple-500" />
                <h2 className="text-xl font-bold tracking-tight">{movieTitle}</h2>
                {videos.length > 0 && (
                    <span className="text-slate-500 text-sm bg-slate-900/50 px-2 py-1 rounded">
                        {currentIndex + 1} / {videos.length}
                    </span>
                )}
            </div>
            <button 
                onClick={closePlayer}
                className="p-2 bg-slate-800/50 rounded-full hover:bg-slate-700 transition"
            >
                <X size={24} />
            </button>
          </div>

          {/* Main Content */}
          <div className="w-full max-w-6xl aspect-video relative bg-black shadow-2xl rounded-lg overflow-hidden border border-slate-800">
             {loading ? (
                <div className="absolute inset-0 flex items-center justify-center text-slate-500">
                    Loading Trailers...
                </div>
             ) : videos.length > 0 ? (
                <iframe 
                    src={`https://www.youtube.com/embed/${videos[currentIndex].key}?autoplay=1&rel=0`}
                    title={videos[currentIndex].name}
                    className="w-full h-full" 
                    allow="autoplay; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen 
                />
             ) : (
                <div className="absolute inset-0 flex items-center justify-center text-slate-500 flex-col gap-2">
                    <Film size={48} className="opacity-20" />
                    <p>No trailers found for this movie.</p>
                </div>
             )}

             {/* Navigation Arrows */}
             {!loading && videos.length > 1 && (
                <>
                    {currentIndex > 0 && (
                        <button 
                            onClick={prevVideo}
                            className="absolute left-4 top-1/2 -translate-y-1/2 p-4 bg-black/50 hover:bg-purple-600/80 rounded-full text-white backdrop-blur transition group"
                        >
                            <ChevronLeft size={32} className="group-hover:-translate-x-1 transition-transform" />
                        </button>
                    )}
                    {currentIndex < videos.length - 1 && (
                        <button 
                            onClick={nextVideo}
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-4 bg-black/50 hover:bg-purple-600/80 rounded-full text-white backdrop-blur transition group"
                        >
                            <ChevronRight size={32} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    )}
                </>
             )}
          </div>

          {/* Thumbnails / Playlist */}
          {!loading && videos.length > 1 && (
             <div className="mt-8 flex gap-4 overflow-x-auto max-w-4xl pb-4 px-4 scrollbar-hide">
                {videos.map((v, idx) => (
                    <button 
                        key={v.key}
                        onClick={() => setCurrentIndex(idx)}
                        className={`relative flex-shrink-0 w-40 aspect-video rounded-lg overflow-hidden border-2 transition ${idx === currentIndex ? 'border-purple-500 scale-105' : 'border-transparent opacity-60 hover:opacity-100'}`}
                    >
                        <img 
                            src={`https://img.youtube.com/vi/${v.key}/mqdefault.jpg`} 
                            alt={v.name}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                            {idx === currentIndex && <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />}
                        </div>
                    </button>
                ))}
             </div>
          )}

        </div>
      )}
    </VideoPlayerContext.Provider>
  );
};

export const useVideoPlayer = () => {
  const context = useContext(VideoPlayerContext);
  if (!context) throw new Error('useVideoPlayer must be used within a VideoPlayerProvider');
  return context;
};
