import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getUsers, getRecommendations, getSharedList, getSessionById, updateSessionVisibility } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { MovieCard } from '@/components/MovieCard';
import { RockPaperScissors } from '@/components/RockPaperScissors';
import { Button } from '@/components/Button';
import { Sparkles, History as HistoryIcon, ArrowLeft, Dice5, Share2, Globe, Lock, Copy, X, Trophy } from 'lucide-react';

export const Results = () => {
  const { sessionId } = useParams();
  const { user } = useAuth();
  const [movies, setMovies] = useState<any[]>([]);
  const [profile, setProfile] = useState('');
  const [modifiers, setModifiers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [tab, setTab] = useState<'recommendations' | 'shared'>('recommendations');
  const [sharedList, setSharedList] = useState<any[]>([]);
  
  // Share State
  const [showShare, setShowShare] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [sessionCode, setSessionCode] = useState('');

  // RPS State
  const [showRPS, setShowRPS] = useState(false);

  // Get session participant ID from storage (for voting/adding)
  const sessionUserId = localStorage.getItem('session_user_id');
  const participantId = sessionUserId ? parseInt(sessionUserId) : undefined;

  useEffect(() => {
    if (sessionId) {
      loadSessionDetails();
      loadRecommendations();
      loadSharedList();

      const interval = setInterval(() => {
          loadSharedList();
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [sessionId]);

  const loadSessionDetails = async () => {
      try {
          const res = await getSessionById(Number(sessionId));
          setIsPublic(!!res.data.is_public);
          setSessionCode(res.data.code);
      } catch (e) {
          console.error(e);
      }
  };

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      const usersRes = await getUsers(Number(sessionId));
      const recRes = await getRecommendations(usersRes.data);
      setMovies(recRes.data.results);
      setProfile(recRes.data.profile);
      setModifiers(recRes.data.modifiers || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = async () => {
      setLoadingMore(true);
      try {
          const usersRes = await getUsers(Number(sessionId));
          // Pass current movie IDs to exclude them from next batch
          const seenIds = movies.map(m => m.id);
          const recRes = await getRecommendations(usersRes.data, seenIds);
          
          if (recRes.data.results.length > 0) {
              setMovies(prev => [...prev, ...recRes.data.results]);
          } else {
              alert("No more matching movies found!");
          }
      } catch(e) {
          console.error(e);
      } finally {
          setLoadingMore(false);
      }
  };

  const loadSharedList = async () => {
    try {
        const res = await getSharedList(Number(sessionId));
        setSharedList(res.data);
    } catch(e) {
        console.error(e);
    }
  };
  
  const toggleVisibility = async () => {
      try {
          const newState = !isPublic;
          await updateSessionVisibility(Number(sessionId), newState);
          setIsPublic(newState);
      } catch(e) {
          console.error(e);
          alert("Failed to update visibility");
      }
  };

  const copyLink = () => {
      const url = `${window.location.origin}/results/${sessionId}`;
      navigator.clipboard.writeText(url);
      alert("Link copied!");
  };

  // Check if we need a tie breaker
  const matches = sharedList.filter(m => Number(m.likes) >= 2);
  const needsTieBreaker = sharedList.length > 0 && matches.length === sharedList.length && matches.length > 1;

  return (
    <div className="min-h-screen bg-slate-950 p-4 relative">
      <header className="flex items-center justify-between mb-6 max-w-5xl mx-auto">
          <Link to="/" className="text-slate-400 hover:text-white"><ArrowLeft /></Link>
          <div className="flex gap-2">
             <Button variant="ghost" size="sm" onClick={() => setShowShare(true)}>
                <Share2 size={16} className="mr-2"/> Share
             </Button>
             {user?.subscription_status === 'active' && (
                 <Link to={`/history/${sessionId}`}>
                    <Button variant="ghost" size="sm"><HistoryIcon size={16} className="mr-2"/> History</Button>
                 </Link>
             )}
          </div>
      </header>

      {/* Share Modal */}
      {showShare && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
              <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full relative">
                  <button onClick={() => setShowShare(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
                      <X size={20} />
                  </button>
                  
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                      <Share2 className="text-purple-500" /> Share List
                  </h3>
                  
                  <div className="space-y-6">
                      <div className="flex items-center justify-between bg-slate-800 p-4 rounded-xl">
                          <div className="flex items-center gap-3">
                              {isPublic ? <Globe className="text-green-400" /> : <Lock className="text-slate-400" />}
                              <div>
                                  <p className="text-white font-medium">{isPublic ? 'Public Access' : 'Private Session'}</p>
                                  <p className="text-xs text-slate-400">{isPublic ? 'Anyone with the link can view' : 'Only participants can view'}</p>
                              </div>
                          </div>
                          <button 
                            onClick={toggleVisibility}
                            className={`w-12 h-6 rounded-full transition-colors relative ${isPublic ? 'bg-green-600' : 'bg-slate-600'}`}
                          >
                              <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${isPublic ? 'translate-x-6' : 'translate-x-0'}`} />
                          </button>
                      </div>

                      {isPublic && (
                          <div className="space-y-2">
                              <label className="text-sm text-slate-400">Shareable Link</label>
                              <div className="flex gap-2">
                                  <input 
                                    readOnly 
                                    value={`${window.location.origin}/results/${sessionId}`}
                                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 outline-none"
                                  />
                                  <Button size="sm" onClick={copyLink}>
                                      <Copy size={14} />
                                  </Button>
                              </div>
                          </div>
                      )}
                      
                      <div className="bg-slate-800/50 p-4 rounded-xl text-center">
                          <p className="text-xs text-slate-500 mb-1">Session Code</p>
                          <p className="text-2xl font-mono tracking-widest text-purple-400">{sessionCode}</p>
                      </div>
                  </div>
              </div>
          </div>
      )}

      <div className="max-w-5xl mx-auto space-y-6">
        {/* Profile Summary */}
        <div className="grid md:grid-cols-3 gap-4">
            <div className="md:col-span-2 bg-gradient-to-r from-indigo-900/50 to-purple-900/50 p-6 rounded-2xl border border-indigo-500/30">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-indigo-500/20 rounded-lg">
                        <Sparkles className="text-indigo-400" size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white mb-1">Tonight's Vibe</h2>
                        <p className="text-indigo-200 text-lg font-medium">{profile}</p>
                    </div>
                </div>
            </div>

            {/* Random Modifiers */}
            <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-2 mb-3 text-purple-400 font-bold">
                    <Dice5 size={20} />
                    <h3>Side Quests</h3>
                </div>
                <ul className="space-y-2">
                    {modifiers.map((mod, i) => (
                        <li key={i} className="text-slate-300 text-sm flex items-start gap-2">
                            <span className="text-purple-500">•</span> {mod}
                        </li>
                    ))}
                </ul>
            </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-slate-800">
            <button 
                className={`pb-3 px-2 font-medium text-sm transition ${tab === 'recommendations' ? 'text-white border-b-2 border-purple-500' : 'text-slate-500 hover:text-slate-300'}`}
                onClick={() => setTab('recommendations')}
            >
                Top Matches
            </button>
            <button 
                className={`pb-3 px-2 font-medium text-sm transition ${tab === 'shared' ? 'text-white border-b-2 border-purple-500' : 'text-slate-500 hover:text-slate-300'}`}
                onClick={() => setTab('shared')}
            >
                Shared List ({sharedList.length})
            </button>
        </div>

        {loading ? (
            <div className="text-center py-20 text-slate-500">Calculating compatibility matrix...</div>
        ) : (
            <>
                {tab === 'recommendations' && (
                    <>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {movies.map(movie => (
                            <MovieCard 
                                key={movie.id} 
                                movie={movie} 
                                sessionId={Number(sessionId)} 
                                userId={participantId}
                                mode="recommendation" 
                                onAction={loadSharedList}
                            />
                        ))}
                    </div>
                    
                    <div className="mt-8 flex justify-center">
                        <Button 
                            onClick={handleLoadMore} 
                            disabled={loadingMore}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                        >
                            {loadingMore ? (
                                <span className="flex items-center gap-2"><Sparkles className="animate-spin" size={16} /> Loading...</span>
                            ) : (
                                "Load More Movies"
                            )}
                        </Button>
                    </div>
                    </>
                )}

                {tab === 'shared' && (
                    <div className="space-y-8">
                        {/* Tie Breaker Section */}
                        {needsTieBreaker && (
                            <div className="bg-gradient-to-r from-pink-900/20 to-purple-900/20 p-6 rounded-xl border border-pink-500/30 text-center animate-pulse">
                                <h3 className="text-2xl font-bold text-white mb-2 flex items-center justify-center gap-2">
                                    <Trophy className="text-yellow-400" /> IT'S A TIE!
                                </h3>
                                <p className="text-slate-300 mb-4">You have multiple matches. Settle it with a mini-game?</p>
                                {!showRPS && (
                                    <Button onClick={() => setShowRPS(true)} className="bg-pink-600 hover:bg-pink-700">
                                        Play Rock Paper Scissors
                                    </Button>
                                )}
                            </div>
                        )}

                        {showRPS && participantId && (
                            <RockPaperScissors 
                                sessionId={Number(sessionId)} 
                                userId={participantId} 
                                onComplete={(winner) => console.log('RPS Winner:', winner)} 
                            />
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {sharedList.length === 0 && <div className="text-slate-500 col-span-full text-center py-10">No movies added yet. Go pick some!</div>}
                            {sharedList.map(item => (
                                <MovieCard 
                                    key={item.id} 
                                    movie={item.movie_data} 
                                    sessionId={Number(sessionId)} 
                                    userId={participantId} 
                                    mode="shared" 
                                    onAction={loadSharedList}
                                    voteCounts={{ likes: Number(item.likes), dislikes: Number(item.dislikes) }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </>
        )}
      </div>
    </div>
  );
};
