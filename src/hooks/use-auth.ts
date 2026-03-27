'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [role, setRole] = useState<'admin' | 'member' | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        let mounted = true;
        let initialCheckComplete = false;

        const checkRole = async (currentUser: User | null) => {
            if (!currentUser) {
                if (mounted && initialCheckComplete) {
                    setRole(null);
                    setLoading(false);
                }
                return;
            }

            try {
                // Check if user exists in admins table
                const { data: admin } = await supabase
                    .from('admins')
                    .select('id')
                    .eq('id', currentUser.id)
                    .single();

                if (mounted) {
                    setRole(admin ? 'admin' : 'member');
                    if (initialCheckComplete) setLoading(false);
                }
            } catch (error) {
                console.error("Error checking role:", error);
                if (mounted) {
                    setRole('member'); // Default fallback
                    if (initialCheckComplete) setLoading(false);
                }
            }
        };

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            const currentUser = session?.user ?? null;
            if (mounted) {
                setUser(currentUser);
            }
            if (currentUser) {
                await checkRole(currentUser);
            } else {
                if (mounted) {
                    setRole(null);
                    if (initialCheckComplete) {
                        setLoading(false);
                        if (event === 'SIGNED_OUT') {
                             router.push('/login');
                        }
                    }
                }
            }
        });
        
        // Ensure we load the initial session if the event hasn't fired
        const checkInitialSession = async () => {
            try {
                // 1. Check Supabase
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user) {
                    if (mounted) setUser(session.user);
                    await checkRole(session.user);
                } else {
                    // 2. Check Local Sessions (Bypasses restricted Auth Provider)
                    const localAdmin = typeof window !== 'undefined' ? localStorage.getItem('admin-session') : null;
                    const localMember = typeof window !== 'undefined' ? localStorage.getItem('member-session') : null;

                    if (localAdmin) {
                        const sessionData = JSON.parse(localAdmin);
                        if (new Date(sessionData.expires) > new Date()) {
                            if (mounted) {
                                setUser({ id: sessionData.id, email: `${sessionData.username}@admin.local` } as any);
                                setRole('admin');
                            }
                        } else {
                            localStorage.removeItem('admin-session');
                        }
                    } else if (localMember) {
                        const sessionData = JSON.parse(localMember);
                        if (new Date(sessionData.expires) > new Date()) {
                            if (mounted) {
                                setUser({ id: sessionData.id, email: `${sessionData.family_id}@member.local` } as any);
                                setRole('member');
                            }
                        } else {
                            localStorage.removeItem('member-session');
                        }
                    }
                }
            } catch (err) {
                console.error("Initial session check failed:", err);
            } finally {
                if (mounted) {
                    initialCheckComplete = true;
                    setLoading(false);
                }
            }
        };

        checkInitialSession();

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, [router]);

    return { user, role, loading };
}
