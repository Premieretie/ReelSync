import { useState } from 'react';
import { seedTMDB, clearMovies } from '@/lib/api';
import { Button } from '@/components/Button';
import { ArrowLeft, Database, Download, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Admin = () => {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [pages, setPages] = useState(5);

    const handleSeed = async (type: 'popular' | 'top_rated') => {
        setLoading(true);
        setStatus(`Fetching ${pages} pages of ${type} movies...`);
        setError(null);
        
        try {
            await seedTMDB(pages, type);
            setStatus('Success! Database populated with new movies.');
        } catch (e: any) {
            console.error(e);
            setError(e.response?.data?.error || 'Failed to seed database');
            setStatus(null);
        } finally {
            setLoading(false);
        }
    };

    const handleClear = async () => {
        if (!confirm("Are you sure? This will delete ALL movies from the database.")) return;
        setLoading(true);
        setStatus('Clearing database...');
        setError(null);

        try {
            await clearMovies();
            setStatus('Success! All movies deleted.');
        } catch (e: any) {
            console.error(e);
            setError(e.response?.data?.error || 'Failed to clear database');
            setStatus(null);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 p-8 text-white">
            <div className="max-w-2xl mx-auto space-y-8">
                <header className="flex items-center gap-4">
                    <Link to="/" className="p-2 hover:bg-slate-800 rounded-full transition">
                        <ArrowLeft />
                    </Link>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Database className="text-purple-500" /> Admin Dashboard
                    </h1>
                </header>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-6">
                    <div>
                        <h2 className="text-xl font-bold mb-2">TMDB Import</h2>
                        <p className="text-slate-400">Fetch real movie data from The Movie Database and populate the local database.</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <label className="text-sm font-bold text-slate-300">Pages to Fetch:</label>
                        <input 
                            type="number" 
                            value={pages} 
                            onChange={(e) => setPages(Number(e.target.value))}
                            className="bg-slate-950 border border-slate-700 rounded px-3 py-1 w-20 text-center"
                            min="1" max="50"
                        />
                    </div>

                    <div className="flex gap-4">
                        <Button 
                            onClick={() => handleSeed('popular')} 
                            disabled={loading}
                            className="flex-1 bg-blue-600 hover:bg-blue-700"
                        >
                            <Download size={18} className="mr-2" /> Import Popular
                        </Button>
                        <Button 
                            onClick={() => handleSeed('top_rated')} 
                            disabled={loading}
                            className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                            <Download size={18} className="mr-2" /> Import Top Rated
                        </Button>
                    </div>

                    <div className="pt-6 border-t border-slate-800">
                        <h3 className="text-lg font-bold text-red-400 mb-2">Danger Zone</h3>
                         <Button 
                            onClick={handleClear} 
                            disabled={loading}
                            className="w-full bg-red-900/50 hover:bg-red-900 text-red-200 border border-red-800"
                        >
                            <Trash2 size={18} className="mr-2" /> Clear All Movies
                        </Button>
                    </div>

                    {loading && (
                        <div className="p-4 bg-blue-900/20 text-blue-400 rounded-xl flex items-center justify-center gap-2 animate-pulse">
                            <Download className="animate-bounce" /> {status}
                        </div>
                    )}

                    {status && !loading && (
                        <div className="p-4 bg-green-900/20 text-green-400 rounded-xl flex items-center justify-center gap-2">
                            <CheckCircle /> {status}
                        </div>
                    )}

                    {error && (
                        <div className="p-4 bg-red-900/20 text-red-400 rounded-xl flex items-center justify-center gap-2">
                            <AlertCircle /> {error}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
