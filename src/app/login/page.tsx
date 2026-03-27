'use client';

import { useState, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Building2, User, Phone, ShieldCheck } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function LoginForm() {
    const searchParams = useSearchParams();
    const defaultType = searchParams.get('type') === 'member' ? 'member' : 'admin';
    const [loginType, setLoginType] = useState<'admin' | 'member'>(defaultType);
    const [identifier, setIdentifier] = useState(''); // username or phone
    const [password, setPassword] = useState('');     // password or pin
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (loginType === 'admin') {
                // Admin Login: Direct Database lookup (Bypasses Auth Provider restriction)
                const { data: adminData, error: adminErr } = await supabase
                    .from('admins')
                    .select('id, username')
                    .ilike('username', identifier)
                    .eq('password', password) // Direct matching for simple admin access
                    .single();

                if (adminErr || !adminData) {
                    throw new Error('Invalid username or password.');
                }
                
                // Set custom Admin session in LocalStorage
                localStorage.setItem('admin-session', JSON.stringify({
                    id: adminData.id,
                    username: adminData.username,
                    role: 'admin',
                    expires: new Date(Date.now() + 86400000).toISOString() // 24h
                }));

                console.log('Admin authenticated:', adminData.username);
            } else {
                // Member Login: Direct Database lookup + Local Session
                const familyId = identifier.toUpperCase().trim();
                const inputPassword = password.toUpperCase().trim();

                if (familyId !== inputPassword) {
                    throw new Error('Please enter your Family ID in both the Family ID and Password fields.');
                }

                // 1. Verify family exists in Database
                const { data: familyData, error: familyError } = await supabase
                    .from('families')
                    .select('id, family_id, house_name')
                    .ilike('family_id', familyId)
                    .single();

                if (familyError || !familyData) {
                    throw new Error('Family ID not found in directory.');
                }

                // 2. Set custom Member session in LocalStorage
                localStorage.setItem('member-session', JSON.stringify({
                    id: familyData.id,
                    family_id: familyData.family_id,
                    house_name: familyData.house_name,
                    role: 'member',
                    expires: new Date(Date.now() + 86400000).toISOString() // 24h
                }));

                console.log('Member authenticated:', familyData.family_id);
            }

            router.push(loginType === 'admin' ? '/dashboard' : '/member-details');
        } catch (err: any) {
            let message = err.message;
            if (message === 'Invalid login credentials') {
                message = 'Incorrect credentials. Please check your login details.';
            } else if (message.includes('Email not confirmed')) {
                message = 'Your account is not confirmed. Please contact the administrator.';
            }
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-mahallu-light p-4">
            <Card className="w-full max-w-md shadow-lg border-emerald-100">
                <CardHeader className="space-y-1 text-center pb-2">
                    <div className="flex justify-center mb-2">
                        <div className="rounded-full bg-primary/10 p-3 text-primary">
                            <Building2 size={32} />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold">Mahallu Management</CardTitle>
                    <CardDescription>
                        Access the portal with your credentials
                    </CardDescription>
                </CardHeader>

                <Tabs value={loginType} onValueChange={(v) => {
                    setLoginType(v as 'admin' | 'member');
                    setError(null);
                    setIdentifier('');
                    setPassword('');
                }}>
                    <div className="px-6 pb-2">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="admin" className="flex items-center gap-2">
                                <ShieldCheck size={16} /> Admin
                            </TabsTrigger>
                            <TabsTrigger value="member" className="flex items-center gap-2">
                                <User size={16} /> Member
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <form onSubmit={handleLogin}>
                        <CardContent className="space-y-4 pt-4">
                            {error && (
                                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive font-medium">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="identifier">
                                    {loginType === 'admin' ? 'Username' : 'Family ID'}
                                </Label>
                                <div className="relative">
                                    <div className="absolute left-3 top-2.5 text-muted-foreground">
                                        {loginType === 'admin' ? <User size={18} /> : <ShieldCheck size={18} />}
                                    </div>
                                    <Input
                                        id="identifier"
                                        type="text"
                                        placeholder={loginType === 'admin' ? 'Enter username' : 'e.g., F101'}
                                        className={loginType === 'member' ? "pl-10 uppercase focus:uppercase" : "pl-10"}
                                        value={identifier}
                                        onChange={(e) => setIdentifier(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">
                                    {loginType === 'admin' ? 'Password' : 'Password (Family ID)'}
                                </Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder={loginType === 'admin' ? 'Enter password' : 'Enter Family ID again'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                {loginType === 'member' && (
                                    <p className="text-xs text-muted-foreground">
                                        Use your Family ID (e.g. F101) as both username and password.
                                    </p>
                                )}
                            </div>
                        </CardContent>
                        <CardFooter className="pt-2">
                            <Button className="w-full text-lg h-11" type="submit" disabled={loading}>
                                {loading ? 'Checking...' : 'Login'}
                            </Button>
                        </CardFooter>
                    </form>
                </Tabs>
            </Card>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-mahallu-light p-4">Loading...</div>}>
            <LoginForm />
        </Suspense>
    );
}

