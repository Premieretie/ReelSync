import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { subscribe } from '@/lib/api';
import { Button } from '@/components/Button';
import { CreditCard } from 'lucide-react';

export const Subscribe = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const username = location.state?.username || '';
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubscribe = async () => {
        if (!username) {
            setError("Session lost. Please login again.");
            return;
        }

        setLoading(true);
        try {
            await subscribe(username, "mock_token_123");
            alert("Payment Successful!");
            navigate('/login');
        } catch (e: any) {
            setError(e.response?.data?.error || "Payment failed");
        } finally {
            setLoading(false);
        }
    };

    if (!username) {
        return (
             <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 text-white flex-col gap-4">
                 <p className="text-xl">Session expired or invalid.</p>
                 <Button onClick={() => navigate('/login')}>Return to Login</Button>
             </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
            <div className="w-full max-w-md bg-slate-900 p-8 rounded-xl border border-slate-800">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-white mb-2">Subscribe to ReelSync</h2>
                    <p className="text-slate-400">Unlimited history and favorites for just <strong>$2/month</strong>.</p>
                </div>

                {error && <div className="bg-red-500/10 text-red-500 p-3 rounded text-sm text-center mb-4">{error}</div>}

                <div className="bg-slate-800 p-4 rounded-lg mb-6 border border-slate-700">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-slate-300">Plan</span>
                        <span className="text-white font-bold">Monthly Premium</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-slate-700 pt-4">
                        <span className="text-slate-300">Total</span>
                        <span className="text-2xl font-bold text-white">$2.00</span>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="bg-slate-800 p-3 rounded border border-slate-700 flex items-center gap-3">
                         <CreditCard className="text-slate-400" />
                         <span className="text-slate-300 font-mono">**** **** **** 4242</span>
                    </div>
                    <Button 
                        onClick={handleSubscribe} 
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                        isLoading={loading}
                    >
                        Pay $2.00 & Activate
                    </Button>
                    <p className="text-xs text-center text-slate-500 mt-4">
                        This is a secure mock payment. No real money is charged.
                    </p>
                </div>
            </div>
        </div>
    );
};
