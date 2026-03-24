'use client';

import { AppSidebar } from '@/components/shared/app-sidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/use-auth';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { GlobalSearch } from '@/components/dashboard/global-search';
import { Search } from 'lucide-react';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, role, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [searchOpen, setSearchOpen] = useState(false);

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

    // if (!user) return null;
    const mockUser = user || { email: 'admin@mahallu.org' };

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
                            <div className="flex items-center gap-3">
                                {/* Global Search Trigger */}
                                <button
                                    onClick={() => setSearchOpen(true)}
                                    className="hidden md:flex items-center gap-2 text-sm text-slate-400 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-4 py-2 transition-all group"
                                >
                                    <Search className="h-4 w-4 group-hover:text-mahallu-primary transition-colors" />
                                    <span className="w-36 text-left">Search anything...</span>
                                    <kbd className="flex items-center gap-0.5 text-[10px] font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-400">
                                        Ctrl K
                                    </kbd>
                                </button>
                                {/* Mobile search icon */}
                                <button
                                    onClick={() => setSearchOpen(true)}
                                    className="md:hidden h-9 w-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 hover:text-mahallu-primary hover:bg-mahallu-light transition-all"
                                >
                                    <Search className="h-4 w-4" />
                                </button>
                                {/* User Avatar */}
                                <div className="h-8 w-8 rounded-full bg-mahallu-primary flex items-center justify-center text-white font-bold text-xs shadow-sm">
                                    {mockUser?.email?.substring(0, 2).toUpperCase()}
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
            {/* Global Search Overlay */}
            {searchOpen && <GlobalSearch onClose={() => setSearchOpen(false)} />}
        </TooltipProvider>
    );
}
