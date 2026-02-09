import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { submitRPSMove, getRPSStatus, resetRPSGame } from '@/lib/api';
import { Button } from '@/components/Button';
import { Hand, Scissors, Scroll, RefreshCw } from 'lucide-react';

interface RPSProps {
    sessionId: number;
    userId: number;
    onComplete: (winnerId: string | 'draw') => void;
}

export const RockPaperScissors = ({ sessionId, userId, onComplete }: RPSProps) => {
    const [move, setMove] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const res = await getRPSStatus(sessionId);
                // Status check omitted for brevity unless needed for debugging
                if (res.data.result) {
                    setResult(res.data.result);
                    onComplete(res.data.result.winner);
                }
            } catch (e) {
                console.error(e);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [sessionId]);

    const handleMove = async (selectedMove: string) => {
        setMove(selectedMove);
        setLoading(true);
        try {
            await submitRPSMove(sessionId, userId, selectedMove);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleReset = async () => {
        setMove(null);
        setResult(null);
        await resetRPSGame(sessionId);
    };

    if (result) {
        const isWinner = result.winner === userId.toString();
        const isDraw = result.winner === 'draw';
        const opponentMove = Object.entries(result.moves).find(([uid]) => uid !== userId.toString())?.[1] as string;

        return (
            <div className="flex flex-col items-center justify-center space-y-6 p-8 bg-slate-900 rounded-2xl border border-purple-500/50 shadow-2xl">
                <h3 className="text-3xl font-bold text-white mb-4">
                    {isDraw ? "It's a Draw!" : (isWinner ? "You Won!" : "You Lost!")}
                </h3>
                
                <div className="flex items-center gap-8">
                    <div className="text-center">
                        <p className="text-sm text-slate-400 mb-2">You</p>
                        <MoveIcon move={move} size={64} className="text-purple-400" />
                    </div>
                    <span className="text-2xl font-bold text-slate-600">VS</span>
                    <div className="text-center">
                        <p className="text-sm text-slate-400 mb-2">Opponent</p>
                        <MoveIcon move={opponentMove} size={64} className="text-red-400" />
                    </div>
                </div>

                <Button onClick={handleReset} className="mt-6">
                    <RefreshCw size={16} className="mr-2" /> Play Again
                </Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center space-y-8 p-6 bg-slate-900 rounded-2xl border border-slate-700">
            <div className="text-center">
                <h3 className="text-2xl font-bold text-white mb-2">Tie Breaker!</h3>
                <p className="text-slate-400">Choose your weapon to decide who picks the movie.</p>
            </div>

            <div className="flex gap-4">
                <MoveButton 
                    move="rock" 
                    icon={Hand} 
                    selected={move === 'rock'} 
                    onClick={() => handleMove('rock')} 
                    disabled={!!move || loading} 
                />
                <MoveButton 
                    move="paper" 
                    icon={Scroll} 
                    selected={move === 'paper'} 
                    onClick={() => handleMove('paper')} 
                    disabled={!!move || loading} 
                />
                <MoveButton 
                    move="scissors" 
                    icon={Scissors} 
                    selected={move === 'scissors'} 
                    onClick={() => handleMove('scissors')} 
                    disabled={!!move || loading} 
                />
            </div>

            {move && !result && (
                <div className="text-purple-400 animate-pulse font-mono flex items-center gap-2">
                    {loading ? 'Submitting...' : 'Waiting for opponent...'}
                </div>
            )}
        </div>
    );
};

const MoveButton = ({ move, icon: Icon, selected, onClick, disabled }: any) => (
    <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={onClick}
        disabled={disabled}
        className={`p-6 rounded-2xl border-2 transition-all ${
            selected 
            ? 'bg-purple-600 border-purple-400 text-white shadow-[0_0_20px_rgba(168,85,247,0.5)]' 
            : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
        } ${disabled && !selected ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
        <Icon size={40} />
        <p className="mt-2 text-sm font-bold uppercase">{move}</p>
    </motion.button>
);

const MoveIcon = ({ move, size, className }: any) => {
    if (move === 'rock') return <Hand size={size} className={className} />;
    if (move === 'paper') return <Scroll size={size} className={className} />;
    if (move === 'scissors') return <Scissors size={size} className={className} />;
    return null;
};
