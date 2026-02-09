import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getHistory } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, Lock } from 'lucide-react';
import { Button } from '@/components/Button';

export const History = () => {
    const { sessionId } = useParams();
    const { user } = useAuth();
    const [history, setHistory] = useState<any[]>([]);

    useEffect(() => {
        if (sessionId && user?.subscription_status === 'active') {
            getHistory(Number(sessionId)).then(res => setHistory(res.data));
        }
    }, [sessionId, user]);

    if (!user || user.subscription_status !== 'active') {
        return (
            <div className="min-h-screen bg-slate-950 p-4 flex flex-col items-center justify-center text-center">
                <Lock size={48} className="text-purple-500 mb-4" />
                <h1 className="text-2xl font-bold text-white mb-2">Premium Feature</h1>
                <p className="text-slate-400 mb-6">History is only available to subscribers.</p>
                <Link to="/">
                    <Button>Go Back</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 p-4">
             <header className="flex items-center gap-4 mb-8 max-w-4xl mx-auto">
                <Link to={`/results/${sessionId}`} className="text-slate-400 hover:text-white"><ArrowLeft /></Link>
                <h1 className="text-2xl font-bold text-white">Date Night History</h1>
            </header>

            <div className="max-w-4xl mx-auto space-y-4">
                {history.length === 0 && <p className="text-slate-500">No history yet.</p>}
                {history.map(item => (
                    <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex gap-4">
                        {item.movie_data.poster_path && (
                            <img src={`https://image.tmdb.org/t/p/w92${item.movie_data.poster_path}`} alt={item.movie_title} className="w-16 h-24 object-cover rounded" />
                        )}
                        <div>
                            <h3 className="text-lg font-bold text-white">{item.movie_title}</h3>
                            <p className="text-sm text-slate-400">Watched on {new Date(item.watched_on).toLocaleDateString()}</p>
                            <div className="mt-2 text-yellow-500 text-sm font-medium">
                                {item.rating > 0 ? '★'.repeat(item.rating) : 'Marked as Watched'}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
