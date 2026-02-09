import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSession, joinSession, getUsers, getTrailers } from '@/lib/api';
import { DualSlider } from '@/components/DualSlider';
import { Button } from '@/components/Button';
import { Users, Copy, CheckCircle } from 'lucide-react';
import logo from '../assets/logo.png';

const TrailerGrid = ({ movies, show }: { movies: any[], show: boolean }) => {
    return (
        <div className="relative h-full w-full rounded-xl overflow-hidden bg-black/20">
            {/* Loading Overlay */}
            <div className={`absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-900/90 backdrop-blur-sm transition-opacity duration-1000 ${show ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                 <img src={logo} alt="Loading..." className="w-64 h-64 animate-pulse rounded-full shadow-[0_0_50px_rgba(168,85,247,0.4)]" />
                 <p className="text-purple-400 mt-4 animate-pulse font-mono tracking-widest text-sm">LOADING PREVIEWS...</p>
            </div>

            {/* Video Grid (Always rendered to preload) */}
            <div className={`grid grid-cols-3 gap-2 h-full content-start overflow-hidden transition-all duration-1000 ${show ? 'opacity-50 hover:opacity-100 blur-0 scale-100' : 'opacity-0 blur-sm scale-95'}`}>
                {movies.map((m) => (
                    <div key={m.id} className="aspect-video bg-black rounded overflow-hidden relative group">
                         <iframe 
                            src={`https://www.youtube.com/embed/${m.key}?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&loop=1&playlist=${m.key}`}
                            className="absolute inset-0 w-full h-full pointer-events-none scale-150 group-hover:scale-100 transition-transform duration-700"
                            title={m.title}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export const Sliders = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [nickname, setNickname] = useState('');
  const [joined, setJoined] = useState(false);
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [trailers, setTrailers] = useState<any[]>([]);
  const [videosReady, setVideosReady] = useState(false);

  // Sliders State
  const [brainyEasy, setBrainyEasy] = useState(2.5);
  const [emotionalLight, setEmotionalLight] = useState(2.5);
  const [actionDialogue, setActionDialogue] = useState(2.5);
  const [realisticWeird, setRealisticWeird] = useState(2.5);
  const [classicModern, setClassicModern] = useState(2.5);
  // New Sliders
  const [safeScary, setSafeScary] = useState(2.5);
  const [slowFast, setSlowFast] = useState(2.5);
  const [indieBlockbuster, setIndieBlockbuster] = useState(2.5);
  const [liveAnimated, setLiveAnimated] = useState(2.5);

  useEffect(() => {
    // Start video reveal timer
    const timer = setTimeout(() => {
        setVideosReady(true);
    }, 25000);

    if (code) {
      getSession(code).then(res => {
        setSessionId(res.data.id);
        fetchUsers(res.data.id);
      }).catch(() => navigate('/'));
    }
    
    // Fetch trailers
    getTrailers().then(res => {
        setTrailers(res.data.results || []);
    }).catch(console.error);

    return () => clearTimeout(timer);
  }, [code]);

  const fetchUsers = async (id: number) => {
    try {
      const res = await getUsers(id);
      setParticipants(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  // Poll for users every 3s if joined
  useEffect(() => {
    if (!joined || !sessionId) return;
    const interval = setInterval(() => fetchUsers(sessionId), 3000);
    return () => clearInterval(interval);
  }, [joined, sessionId]);

  const handleSubmit = async () => {
    if (!nickname || !sessionId) return;
    setLoading(true);
    const values = {
        brainy_easy: brainyEasy,
        emotional_light: emotionalLight,
        action_dialogue: actionDialogue,
        realistic_weird: realisticWeird,
        classic_modern: classicModern,
        safe_scary: safeScary,
        slow_fast: slowFast,
        indie_blockbuster: indieBlockbuster,
        live_animated: liveAnimated
    };

    try {
        const res = await joinSession(sessionId, nickname, values);
        localStorage.setItem('session_user_id', res.data.id.toString());
        setJoined(true);
        fetchUsers(sessionId); // immediate update
    } catch(e) {
        console.error(e);
        alert("Failed to join");
    } finally {
        setLoading(false);
    }
  };

  const copyCode = () => {
      navigator.clipboard.writeText(code || '');
      alert("Code copied!");
  };

  const startMatching = () => {
      navigate(`/results/${sessionId}`);
  };

  if (joined) {
      return (
          <div className="min-h-screen bg-slate-950 p-6 flex flex-col items-center">
             <div className="w-full max-w-lg space-y-8">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-white mb-2">Waiting Room</h2>
                    <div className="inline-flex items-center gap-2 bg-slate-900 px-4 py-2 rounded-full border border-slate-800 cursor-pointer" onClick={copyCode}>
                        <span className="text-purple-400 font-mono text-xl tracking-widest">{code}</span>
                        <Copy size={16} className="text-slate-500" />
                    </div>
                    <p className="text-slate-400 text-sm mt-4">Share this code with your partner!</p>
                </div>

                <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
                    <h3 className="text-slate-300 font-medium mb-4 flex items-center gap-2">
                        <Users size={18} /> Participants ({participants.length})
                    </h3>
                    <div className="space-y-3">
                        {participants.map((u: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between bg-slate-800 p-3 rounded-lg">
                                <span className="text-white font-medium">{u.nickname}</span>
                                <CheckCircle size={18} className="text-green-500" />
                            </div>
                        ))}
                    </div>
                </div>

                {participants.length > 0 && (
                     <Button onClick={startMatching} className="w-full h-12 text-lg bg-green-600 hover:bg-green-700">
                        See Matches
                     </Button>
                )}
             </div>
          </div>
      );
  }

  // Split trailers for left and right panels
  const mid = Math.ceil(trailers.length / 2);
  const leftTrailers = trailers.slice(0, mid);
  const rightTrailers = trailers.slice(mid);

  return (
    <div className="min-h-screen bg-slate-950 p-6 flex justify-center overflow-x-hidden">
      <div className="flex w-full max-w-[1600px] gap-8">
        
        {/* Left Panel */}
        <div className="hidden xl:block flex-1 bg-slate-700/30 rounded-2xl border border-slate-800/50 p-4 overflow-hidden">
            <TrailerGrid movies={leftTrailers} show={videosReady} />
        </div>

        {/* Center Panel (Sliders) */}
        <div className="w-full max-w-lg space-y-6 flex-shrink-0 mx-auto">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white">Your Movie Taste</h2>
                <p className="text-slate-400 text-sm">Adjust sliders to match your vibe tonight.</p>
            </div>

            <div className="space-y-6 bg-slate-900/80 backdrop-blur-sm p-6 rounded-2xl border border-slate-800 shadow-2xl">
                <DualSlider 
                    leftLabel="Brainy" rightLabel="Easy Watching" 
                    value={brainyEasy} onChange={setBrainyEasy} 
                />
                <DualSlider 
                    leftLabel="Deep / Emotional" rightLabel="Light / Fun" 
                    value={emotionalLight} onChange={setEmotionalLight} 
                />
                <DualSlider 
                    leftLabel="Action / Intense" rightLabel="Dialogue / Slow" 
                    value={actionDialogue} onChange={setActionDialogue} 
                />
                <DualSlider 
                    leftLabel="Realistic / Grounded" rightLabel="Weird / Sci-Fi" 
                    value={realisticWeird} onChange={setRealisticWeird} 
                />
                <DualSlider 
                    leftLabel="Classic / Old School" rightLabel="Modern / Fresh" 
                    value={classicModern} onChange={setClassicModern} 
                />
                <DualSlider 
                    leftLabel="Safe / Comfort" rightLabel="Scary / Tense" 
                    value={safeScary} onChange={setSafeScary} 
                />
                <DualSlider 
                    leftLabel="Slow Burn" rightLabel="Fast Paced" 
                    value={slowFast} onChange={setSlowFast} 
                />
                <DualSlider 
                    leftLabel="Indie / Artsy" rightLabel="Blockbuster" 
                    value={indieBlockbuster} onChange={setIndieBlockbuster} 
                />
                <DualSlider 
                    leftLabel="Live Action" rightLabel="Animated" 
                    value={liveAnimated} onChange={setLiveAnimated} 
                />
            </div>

            <div className="space-y-4">
                <label className="block text-sm font-medium text-slate-300">Your Nickname</label>
                <input 
                    type="text" 
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 outline-none"
                    placeholder="e.g. ReelSync99"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                />
            </div>

            <Button onClick={handleSubmit} disabled={!nickname} isLoading={loading} className="w-full h-12 text-lg">
                Ready
            </Button>
        </div>

        {/* Right Panel */}
        <div className="hidden xl:block flex-1 bg-slate-700/30 rounded-2xl border border-slate-800/50 p-4 overflow-hidden">
            <TrailerGrid movies={rightTrailers} show={videosReady} />
        </div>

      </div>
    </div>
  );
};
