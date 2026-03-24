'use client';

import Image from 'next/image';import {
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
    WalletCards,
    ClockAlert,
    Megaphone,
    ShieldCheck,
    Receipt,
    User,
    HandHeart,
    MessageCircle,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

const adminItems = [
    { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
    { title: 'Arrear Checker', url: '/arrear-checker', icon: ClockAlert },
    { title: 'Directory', url: '/directory', icon: Users },
    { title: 'WhatsApp Reminders', url: '/whatsapp-reminders', icon: MessageCircle },
    { title: 'Subscriptions', url: '/subscriptions', icon: WalletCards },
    { title: 'Sponsorships', url: '/sponsorships', icon: HandHeart },
    { title: 'Finances', url: '/finances', icon: Wallet },
    { title: 'Expenses', url: '/expenses', icon: Receipt },
    { title: 'Announcements', url: '/notices', icon: Megaphone },
    { title: 'Committee', url: '/committee', icon: ShieldCheck },
];

const memberItems = [
    { title: 'Dashboard', url: '/member-details', icon: LayoutDashboard },
    { title: 'Announcements', url: '/notices', icon: Megaphone },
];

import { useAuth } from '@/hooks/use-auth';

export function AppSidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { role, loading } = useAuth();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    const items = role === 'admin' ? adminItems : memberItems;

    if (loading) return (
        <Sidebar>
            <SidebarHeader className="border-b p-5">
                <div className="animate-pulse flex items-center gap-3">
                    <div className="h-9 w-9 bg-slate-200 rounded-xl"></div>
                    <div className="h-4 w-24 bg-slate-200 rounded"></div>
                </div>
            </SidebarHeader>
        </Sidebar>
    );

    return (
        <Sidebar>
            <SidebarHeader className="border-b p-5">
                <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                    <div className="relative h-10 w-10 min-w-10 rounded-full overflow-hidden shadow-sm border border-slate-200 bg-white">
                        <Image src="/logo.png" alt="Mahallu Logo" fill className="object-cover" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-sm leading-tight text-white">
                            {role === 'admin' ? 'Admin' : 'Member Portal'}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-medium">West Mulavoor</span>
                    </div>
                </Link>
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
