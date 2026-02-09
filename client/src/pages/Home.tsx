import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createSession, getSession } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/Button';
import { User, LogIn } from 'lucide-react';
import logo from '../assets/CineMatch_Logo2.png';

export const Home = () => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleCreate = async () => {
    setLoading(true);
    try {
      const res = await createSession();
      navigate(`/join/${res.data.code}`);
    } catch (e) {
      console.error(e);
      alert('Failed to create session');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;
    setLoading(true);
    try {
      await getSession(code); // Validate
      navigate(`/join/${code}`);
    } catch (e) {
      console.error(e);
      alert('Invalid session code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 relative">
      
      {/* Auth Corner */}
      <div className="absolute top-4 right-4">
        {user ? (
            <Link to="/dashboard">
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                    <User size={16} /> {user.username}
                </Button>
            </Link>
        ) : (
            <Link to="/login">
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                    <LogIn size={16} /> Login
                </Button>
            </Link>
        )}
      </div>

      <div className="max-w-md w-full text-center space-y-8">
        <div className="flex justify-center mb-6">
           <img src={logo} alt="ReelSync Logo" className="w-128 h-128 object-contain rounded-full shadow-lg" />
        </div>
        
        {/* <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
          ReelSync
        </h1> */}
        <p className="text-slate-400 text-lg">
          Find the perfect date night movie without the arguments.
        </p>

        <div className="space-y-4 pt-8">
          <Button 
            onClick={handleCreate} 
            className="w-full h-14 text-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 border-none"
            isLoading={loading}
          >
            Start New Date Night
          </Button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-700"></span></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-slate-900 px-2 text-slate-500">Or join existing</span></div>
          </div>

          <form onSubmit={handleJoin} className="flex gap-2">
            <input 
              type="text" 
              placeholder="Enter 6-char code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              maxLength={6}
              className="flex-1 bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 outline-none uppercase tracking-widest text-center font-mono"
            />
            <Button type="submit" variant="secondary" isLoading={loading}>
              Join
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
