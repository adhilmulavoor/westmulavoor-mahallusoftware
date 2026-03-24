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

        const checkRole = async (currentUser: User | null) => {
            if (!currentUser) {
                if (mounted) {
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
                    setLoading(false);
                }
            } catch (error) {
                console.error("Error checking role:", error);
                if (mounted) {
                    setRole('member'); // Default fallback
                    setLoading(false);
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
                    setLoading(false);
                    if (event === 'SIGNED_OUT') {
                         router.push('/login');
                    }
                }
            }
        });
        
        // Ensure we load the initial session if the event hasn't fired
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                setUser(session.user);
                checkRole(session.user);
            } else {
                if (mounted) setLoading(false);
            }
        }).catch(() => {
             if (mounted) setLoading(false);
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, [router]);

    return { user, role, loading };
}
