'use client';

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import {
    LayoutDashboard,
    Users,
    Wallet,
    FileBadge,
    LogOut,
    CreditCard,
    Building2,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

const items = [
    { title: 'Dashboard', url: '/', icon: LayoutDashboard },
    { title: 'Directory', url: '/directory', icon: Users },
    { title: 'Finances', url: '/finances', icon: Wallet },
    { title: 'Pending', url: '/pending', icon: CreditCard },
    { title: 'Certificates', url: '/certificates', icon: FileBadge },
];

export function AppSidebar() {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    return (
        <Sidebar>
            <SidebarHeader className="border-b p-5">
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-mahallu-primary flex items-center justify-center shadow-sm">
                        <Building2 className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-sm text-mahallu-dark leading-tight">Mahallu Admin</span>
                        <span className="text-[10px] text-muted-foreground font-medium">West Mulavoor</span>
                    </div>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-slate-400 font-bold px-4 py-2">Navigation</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {items.map((item) => {
                                const isActive = pathname === item.url;
                                return (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={isActive}
                                            tooltip={item.title}
                                        >
                                            <Link href={item.url} className={`flex items-center gap-3 px-3 py-2.5 mx-1 rounded-xl transition-all ${isActive ? 'bg-mahallu-primary text-white font-semibold shadow-sm' : 'hover:bg-mahallu-light hover:text-mahallu-primary'}`}>
                                                <item.icon className="size-4" />
                                                <span className="text-sm">{item.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter className="border-t p-4">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            onClick={handleLogout}
                            className="text-rose-500 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-all mx-1"
                        >
                            <LogOut className="size-4" />
                            <span className="text-sm">Logout</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );
}
