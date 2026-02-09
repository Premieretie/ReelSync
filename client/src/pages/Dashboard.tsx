import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getFavorites, getAccountHistory, removeFromFavorites } from '@/lib/api';
import { MovieCard } from '@/components/MovieCard';
import { Link } from 'react-router-dom';
import { ArrowLeft, Star, History as HistoryIcon, LogOut, X } from 'lucide-react';
import { Button } from '@/components/Button';

export const Dashboard = () => {
  const { user, logout } = useAuth();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'favorites' | 'history'>('favorites');

  useEffect(() => {
    if (user) {
      getFavorites().then(res => setFavorites(res.data));
      if (user.subscription_status === 'active') {
        getAccountHistory().then(res => setHistory(res.data));
      }
    }
  }, [user]);

  const handleRemoveFav = async (movieId: number) => {
    try {
      await removeFromFavorites(movieId);
      setFavorites(prev => prev.filter(f => f.movie_id !== movieId));
    } catch (e) {
      console.error(e);
    }
  };

  if (!user) return <div className="p-8 text-white">Please login</div>;

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-8 text-white">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
                <Link to="/" className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition">
                    <ArrowLeft size={20} />
                </Link>
                <h1 className="text-3xl font-bold">My Account</h1>
            </div>
            <div className="flex items-center gap-4">
                <span className="text-slate-400">
                    {user.username} 
                    {user.subscription_status === 'active' && <span className="ml-2 text-xs bg-gradient-to-r from-yellow-500 to-amber-600 text-black px-2 py-0.5 rounded font-bold">PREMIUM</span>}
                </span>
                <Button variant="ghost" onClick={logout} className="text-red-400 hover:text-red-300">
                    <LogOut size={18} />
                </Button>
            </div>
        </div>

        <div className="flex gap-4 mb-8 border-b border-slate-800 pb-4">
            <button 
                onClick={() => setActiveTab('favorites')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${activeTab === 'favorites' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
                <Star size={18} /> Favorites
            </button>
            {user.subscription_status === 'active' && (
                <button 
                    onClick={() => setActiveTab('history')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${activeTab === 'history' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                    <HistoryIcon size={18} /> Watch History
                </button>
            )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {activeTab === 'favorites' && favorites.map((fav: any) => (
                <div key={fav.id} className="relative group">
                    <MovieCard movie={fav.movie_data} sessionId={0} userId={user.id} mode="history" />
                    <button 
                        onClick={() => handleRemoveFav(fav.movie_id)}
                        className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition hover:bg-red-600 z-10"
                        title="Remove from favorites"
                    >
                        <X size={14} />
                    </button>
                </div>
            ))}
            
            {activeTab === 'history' && history.map((item: any) => (
                 <div key={item.id} className="relative">
                    <MovieCard movie={item.movie_data} sessionId={0} userId={user.id} mode="history" />
                    <div className="mt-2 text-xs text-slate-500 text-center">
                        Watched: {new Date(item.watched_on).toLocaleDateString()}
                    </div>
                 </div>
            ))}

            {activeTab === 'favorites' && favorites.length === 0 && (
                <div className="col-span-full text-center text-slate-500 py-12">No favorites yet.</div>
            )}
            {activeTab === 'history' && history.length === 0 && (
                <div className="col-span-full text-center text-slate-500 py-12">No watch history yet.</div>
            )}
        </div>

      </div>
    </div>
  );
};
