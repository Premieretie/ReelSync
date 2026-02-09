import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { verifyEmail } from '@/lib/api';
import { Button } from '@/components/Button';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

export const VerifyEmail = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [username, setUsername] = useState('');
    const effectRan = React.useRef(false);

    useEffect(() => {
        if (!token || effectRan.current) return;

        effectRan.current = true; // Mark as ran

        verifyEmail(token)
            .then(res => {
                setStatus('success');
                setUsername(res.data.username);
            })
            .catch((err) => {
                // If it failed, it might have been verified in a previous race (unlikely with this guard, but possible in other scenarios)
                console.error(err);
                setStatus('error');
            });
    }, [token]);

    const handleContinue = () => {
        navigate('/subscribe', { state: { username } });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
            <div className="w-full max-w-md bg-slate-900 p-8 rounded-xl border border-slate-800 text-center">
                {status === 'loading' && (
                    <div className="flex flex-col items-center gap-4">
                        <Loader size={48} className="text-indigo-500 animate-spin" />
                        <h2 className="text-xl font-bold text-white">Verifying...</h2>
                    </div>
                )}

                {status === 'success' && (
                    <div className="flex flex-col items-center gap-4">
                        <CheckCircle size={48} className="text-green-500" />
                        <h2 className="text-2xl font-bold text-white">Email Verified!</h2>
                        <p className="text-slate-400">Your email has been successfully verified.</p>
                        <p className="text-slate-400">Next step: Activate your subscription.</p>
                        <Button className="w-full mt-4" onClick={handleContinue}>
                            Continue to Subscription
                        </Button>
                    </div>
                )}

                {status === 'error' && (
                    <div className="flex flex-col items-center gap-4">
                        <XCircle size={48} className="text-red-500" />
                        <h2 className="text-2xl font-bold text-white">Verification Link Invalid</h2>
                        <p className="text-slate-400">
                            The link may have expired or your account is already verified.
                        </p>
                        <Button className="w-full mt-4" onClick={() => navigate('/login')}>
                            Go to Login
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};
