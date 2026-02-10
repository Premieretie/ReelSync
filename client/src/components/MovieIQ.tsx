import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Trophy, X, Clock, AlertCircle } from 'lucide-react';
import { Button } from './Button';
import { getMovieIQStatus, submitMovieIQAnswer, startMovieIQ } from '@/lib/api';

interface MovieIQProps {
    sessionId: number;
    userId: number;
    nickname: string;
    onWin: () => void;
    onClose: () => void;
}

export const MovieIQ: React.FC<MovieIQProps> = ({ sessionId, userId, nickname, onWin, onClose }) => {
    const [gameState, setGameState] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [result, setResult] = useState<'correct' | 'wrong' | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        // Start the game if not active (or just check status)
        loadGame();

        const interval = setInterval(loadGame, 2000);
        return () => clearInterval(interval);
    }, []);

    const loadGame = async () => {
        try {
            const res = await getMovieIQStatus(sessionId);
            setGameState(res.data);
            setLoading(false);

            if (res.data.active === false && !res.data.winner && !gameState?.active) {
                // If not active and we haven't started locally, try starting it
                // Only if we are the ones who opened it? 
                // For simplicity, let's assume the component mounting tries to start it if null
                if (!gameState) {
                    await startMovieIQ(sessionId);
                }
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleAnswer = async (option: string) => {
        if (selectedOption || result) return;
        setSelectedOption(option);

        try {
            const res = await submitMovieIQAnswer(sessionId, userId, nickname, option);
            if (res.data.success) {
                if (res.data.winner) {
                    setResult('correct');
                    setTimeout(() => {
                        onWin();
                    }, 2000);
                } else {
                    setResult('wrong');
                    setError("Wrong answer! Wait for next round.");
                }
            } else {
                setResult('wrong');
                setError(res.data.message || "Too slow! Someone else answered.");
            }
        } catch (e) {
            setError("Failed to submit answer");
        }
    };

    if (loading) return <div className="text-white p-4">Loading Movie IQ...</div>;

    // Winner Screen
    if (gameState?.winner) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
                <motion.div 
                    initial={{ scale: 0 }} 
                    animate={{ scale: 1 }} 
                    className="p-4 bg-yellow-500/20 rounded-full"
                >
                    <Trophy className="text-yellow-400 w-16 h-16" />
                </motion.div>
                <h2 className="text-2xl font-bold text-white">
                    {gameState.winner.id === userId ? "YOU WON!" : `${gameState.winner.nickname} Won!`}
                </h2>
                <p className="text-slate-300">
                    {gameState.winner.id === userId 
                        ? "You earned the power to REMOVE one movie from the list!" 
                        : "They get to choose a movie to remove."}
                </p>
                {gameState.winner.id !== userId && (
                    <Button onClick={onClose} variant="ghost">Close</Button>
                )}
            </div>
        );
    }

    if (!gameState?.active) {
        return (
            <div className="text-center p-8">
                 <p className="text-slate-400">Waiting for game to start...</p>
                 <Button onClick={() => startMovieIQ(sessionId)} className="mt-4">Start Round</Button>
            </div>
        );
    }

    return (
        <div className="w-full max-w-lg mx-auto p-2">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2 text-purple-400 font-bold">
                    <Brain /> MOVIE IQ
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Clock size={14} /> Quick!
                </div>
            </div>

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <h3 className="text-xl font-bold text-white mb-6 text-center leading-relaxed">
                    {gameState.question.q}
                </h3>

                <div className="grid grid-cols-1 gap-3">
                    {gameState.question.options.map((opt: string) => (
                        <motion.button
                            key={opt}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleAnswer(opt)}
                            disabled={!!selectedOption}
                            className={`
                                p-4 rounded-xl font-medium text-left transition-all border
                                ${selectedOption === opt 
                                    ? result === 'correct' 
                                        ? 'bg-green-600 border-green-500 text-white'
                                        : result === 'wrong'
                                            ? 'bg-red-600 border-red-500 text-white'
                                            : 'bg-slate-700 border-slate-600 text-slate-300'
                                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:border-slate-500'
                                }
                            `}
                        >
                            {opt}
                        </motion.button>
                    ))}
                </div>
            </motion.div>

            {error && (
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }}
                    className="p-3 bg-red-900/50 border border-red-500/50 rounded-lg flex items-center gap-2 text-red-200 text-sm"
                >
                    <AlertCircle size={16} /> {error}
                </motion.div>
            )}
        </div>
    );
};
