'use client';

import { AppSidebar } from '@/components/shared/app-sidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/use-auth';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, role, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push('/login');
            } else if (role === 'member') {
                const allowedForMembers = ['/member-details', '/notices'];
                if (!allowedForMembers.includes(pathname)) {
                    router.push('/member-details');
                }
            }
        }
    }, [user, role, loading, pathname, router]);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    const mockUser = user || { email: 'admin@mahallu.org' };

    return (
        <TooltipProvider>
            <SidebarProvider>
                <div className="flex min-h-screen w-full bg-slate-50/30">
                    <AppSidebar />
                    <main className="flex-1 flex flex-col min-w-0">
                        <header className="sticky top-0 z-10 flex h-16 items-center border-b bg-white/80 px-6 backdrop-blur-md">
                            {/* Mobile menu trigger (left) */}
                            <SidebarTrigger className="-ml-1 md:hidden" />
                            {/* Centered title */}
                            <h1 className="flex-1 text-center text-lg font-semibold text-mahallu-dark md:text-xl tracking-tight">
                                West Mulavoor Mahall
                            </h1>
                            {/* User Avatar (right) */}
                            <div className="h-8 w-8 rounded-full bg-mahallu-primary flex items-center justify-center text-white font-bold text-xs shadow-sm">
                                {mockUser?.email?.substring(0, 2).toUpperCase()}
                            </div>
                        </header>
                        <div className="flex-1 overflow-auto">
                            <div className="mx-auto w-full max-w-[1400px] p-6 md:p-8 lg:p-10">
                                {children}
                            </div>
                        </div>
                    </main>
                </div>
            </SidebarProvider>
        </TooltipProvider>
    );
}

