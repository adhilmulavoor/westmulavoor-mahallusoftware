'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export default function TestConnectionPage() {
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');

    useEffect(() => {
        async function checkConnection() {
            try {
                const { data, error } = await supabase.from('families').select('count', { count: 'exact', head: true });

                if (error) {
                    console.error('Supabase error:', error);
                    setStatus('error');
                    setMessage(`Error: ${error.message}`);
                } else {
                    setStatus('success');
                    setMessage('Successfully connected to Supabase!');
                }
            } catch (err: any) {
                console.error('Connection error:', err);
                setStatus('error');
                setMessage(`Unexpected error: ${err.message}`);
            }
        }

        checkConnection();
    }, []);

    return (
        <div className="flex flex-col gap-6 max-w-2xl mx-auto py-10">
            <h1 className="text-3xl font-bold text-mahallu-dark">Supabase Connection Test</h1>
            <Card className="border-2">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        {status === 'loading' && <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />}
                        {status === 'success' && <CheckCircle2 className="h-6 w-6 text-mahallu-success" />}
                        {status === 'error' && <XCircle className="h-6 w-6 text-destructive" />}
                        Connection Status
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className={`p-4 rounded-lg border ${status === 'success' ? 'bg-mahallu-light border-mahallu-success/30 text-mahallu-dark' :
                            status === 'error' ? 'bg-destructive/10 border-destructive/30 text-destructive' :
                                'bg-muted border-muted-foreground/20'
                        }`}>
                        {status === 'loading' ? 'Checking connection to Supabase...' : message}
                    </div>

                    <div className="mt-6 space-y-4">
                        <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Diagnostics</h3>
                        <ul className="text-sm space-y-2">
                            <li className="flex justify-between border-b pb-2">
                                <span>URL Configured:</span>
                                <span className="font-mono text-xs">{process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Yes' : '❌ No'}</span>
                            </li>
                            <li className="flex justify-between border-b pb-2">
                                <span>Anon Key Configured:</span>
                                <span className="font-mono text-xs">{process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Yes' : '❌ No'}</span>
                            </li>
                        </ul>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
