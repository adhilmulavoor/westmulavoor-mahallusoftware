'use client';

import { AppSidebar } from '@/components/shared/app-sidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <TooltipProvider>
            <SidebarProvider>
                <div className="flex min-h-screen w-full bg-slate-50/30">
                    <AppSidebar />
                    <main className="flex-1 flex flex-col min-w-0">
                        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-white/80 px-6 backdrop-blur-md">
                            <div className="flex items-center gap-4">
                                <SidebarTrigger className="-ml-1" />
                                <div className="h-6 w-px bg-border" />
                                <h1 className="text-lg font-semibold text-mahallu-dark md:text-xl tracking-tight">
                                    Mahallu Management
                                </h1>
                            </div>
                            <div className="flex items-center gap-4">
                                {/* Optional Profile/Notifications Placeholder */}
                                <div className="h-8 w-8 rounded-full bg-mahallu-light border border-mahallu-primary/20 flex items-center justify-center text-mahallu-dark font-medium text-xs">
                                    {user?.email?.substring(0, 2).toUpperCase()}
                                </div>
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

