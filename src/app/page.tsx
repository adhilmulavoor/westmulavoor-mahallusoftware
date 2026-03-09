'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { PublicNotice, CommitteeMember } from '@/types/database';
import {
    Bell,
    Calendar,
    User,
    ShieldCheck,
    ChevronRight,
    Info,
    Megaphone,
    Clock,
    MapPin,
    Phone,
    Mail,
    Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function LandingPage() {
    const [notices, setNotices] = useState<PublicNotice[]>([]);
    const [committee, setCommittee] = useState<CommitteeMember[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        await Promise.all([fetchNotices(), fetchCommittee()]);
        setLoading(false);
    };

    const fetchNotices = async () => {
        const { data, error } = await supabase
            .from('public_notices')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        if (!error && data) setNotices(data);
    };

    const fetchCommittee = async () => {
        const { data, error } = await supabase
            .from('committee_members')
            .select('*')
            .eq('is_active', true)
            .order('display_order', { ascending: true });

        if (!error && data) setCommittee(data);
    };

    return (
        <div className="min-h-screen bg-slate-50 overflow-x-hidden">
            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-mahallu-primary rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg ring-4 ring-mahallu-light">
                            M
                        </div>
                        <span className="text-xl font-black text-mahallu-dark tracking-tight">MAHALLU <span className="text-mahallu-primary">PRO</span></span>
                    </div>

                    <div className="hidden md:flex items-center gap-8">
                        <Link href="#notice-board" className="text-sm font-bold text-slate-600 hover:text-mahallu-primary transition-colors">Notice Board</Link>
                        <Link href="#contact" className="text-sm font-bold text-slate-600 hover:text-mahallu-primary transition-colors">Contact</Link>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link href="/login">
                            <Button variant="outline" className="hidden sm:flex border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl h-11 px-6">
                                Member Login
                            </Button>
                        </Link>
                        <Link href="/login">
                            <Button className="bg-mahallu-dark hover:bg-black text-white font-bold rounded-xl h-11 px-6 shadow-xl transition-all hover:scale-105 active:scale-95">
                                Admin Portal
                            </Button>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div className="space-y-8 max-w-2xl animate-in fade-in slide-in-from-left-8 duration-700">
                            <Badge className="bg-mahallu-light text-mahallu-dark border-mahallu-primary/20 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest flex w-fit items-center gap-2">
                                <span className="flex h-2 w-2 rounded-full bg-mahallu-primary animate-pulse" />
                                Official Management Portal
                            </Badge>

                            <h1 className="text-6xl lg:text-7xl font-black text-mahallu-dark leading-[1.1] tracking-tighter">
                                Modernizing Our <br />
                                <span className="text-mahallu-primary italic bg-gradient-to-r from-mahallu-primary to-emerald-600 bg-clip-text text-transparent">Community</span> Care.
                            </h1>

                            <p className="text-xl text-slate-600 leading-relaxed font-medium max-w-xl">
                                Seamlessly manage accounts, certificates, and community welfare with our digital platform. Building a stronger, more connected Mahallu.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
                                <Link href="/login" className="w-full sm:w-auto">
                                    <Button size="lg" className="h-14 px-10 text-lg font-black rounded-2xl bg-mahallu-primary hover:bg-mahallu-dark text-white shadow-2xl shadow-mahallu-primary/30 w-full transition-all hover:-translate-y-1">
                                        Access Dashboard <ChevronRight className="ml-2 h-5 w-5" />
                                    </Button>
                                </Link>
                                <Link href="#notice-board" className="w-full sm:w-auto">
                                    <Button variant="ghost" size="lg" className="h-14 px-10 text-lg font-bold rounded-2xl text-slate-700 hover:bg-slate-100 w-full border border-transparent hover:border-slate-200">
                                        View Notices
                                    </Button>
                                </Link>
                            </div>

                            <div className="flex items-center gap-8 pt-8 border-t border-slate-200/60">
                                <div className="space-y-1">
                                    <div className="text-2xl font-black text-mahallu-dark">500+</div>
                                    <div className="text-sm font-bold text-slate-500 uppercase">Families</div>
                                </div>
                                <div className="h-10 w-[1px] bg-slate-200" />
                                <div className="space-y-1">
                                    <div className="text-2xl font-black text-mahallu-dark">2.4k</div>
                                    <div className="text-sm font-bold text-slate-500 uppercase">Members</div>
                                </div>
                                <div className="h-10 w-[1px] bg-slate-200" />
                                <div className="space-y-1">
                                    <div className="text-2xl font-black text-mahallu-dark">10k+</div>
                                    <div className="text-sm font-bold text-slate-500 uppercase">Records</div>
                                </div>
                            </div>
                        </div>

                        <div className="relative animate-in fade-in slide-in-from-right-8 duration-1000 delay-200 h-[300px] sm:h-[400px] lg:h-[600px] w-full mt-8 lg:mt-0">
                            <div className="relative h-full w-full rounded-[24px] md:rounded-[40px] overflow-hidden shadow-[0_32px_64px_-16px_rgba(5,150,105,0.25)] border-[6px] md:border-[12px] border-white">
                                <Image
                                    src="/masjid-new-final.jpg"
                                    alt="Central Juma Masjid"
                                    fill
                                    className="object-cover transition-transform duration-700 hover:scale-105"
                                    priority
                                />
                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-6 md:p-12">
                                    <div className="flex items-center gap-2 md:gap-3 text-white/90 font-bold tracking-wide text-sm md:text-base">
                                        <MapPin className="h-4 w-4 md:h-5 md:w-5 text-mahallu-primary" />
                                        Central Juma Masjid Complex
                                    </div>
                                </div>
                            </div>
                            {/* Decorative Elements */}
                            <div className="absolute -top-6 -right-6 h-32 w-32 md:-top-12 md:-right-12 md:h-64 md:w-64 bg-mahallu-primary/10 rounded-full blur-2xl md:blur-3xl -z-10" />
                            <div className="absolute -bottom-6 -left-6 h-32 w-32 md:-bottom-12 md:-left-12 md:h-64 md:w-64 bg-emerald-100 rounded-full blur-2xl md:blur-3xl -z-10" />
                        </div>
                    </div>
                </div>
            </section>


            {/* Notice Board Section */}
            <section id="notice-board" className="py-24 bg-white relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
                        <div className="space-y-4">
                            <h2 className="text-5xl font-black text-mahallu-dark tracking-tighter">Public Notice Board</h2>
                            <p className="text-xl text-slate-500 font-medium">Get the latest updates, events, and announcements from the committee.</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="h-14 w-14 bg-mahallu-light rounded-2xl flex items-center justify-center text-mahallu-primary">
                                <Megaphone className="h-7 w-7" />
                            </div>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {loading ? (
                            Array(3).fill(0).map((_, i) => (
                                <div key={i} className="h-[300px] rounded-[32px] bg-slate-50 animate-pulse border border-slate-100" />
                            ))
                        ) : notices.length === 0 ? (
                            <div className="col-span-full py-20 text-center space-y-4">
                                <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                                    <Info className="h-10 w-10" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-400">No active notices at this time</h3>
                            </div>
                        ) : (
                            notices.map((notice) => (
                                <div key={notice.id} className="group p-8 rounded-[32px] bg-white border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 relative overflow-hidden">
                                    <div className="absolute -right-6 -top-6 h-24 w-24 bg-mahallu-light opacity-0 group-hover:opacity-100 transition-opacity rounded-full rotate-12" />

                                    <div className="space-y-6 relative z-10">
                                        <div className="flex items-center justify-between">
                                            <Badge className={`
                                                px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border-none
                                                ${notice.category === 'Urgent' ? 'bg-rose-100 text-rose-600' :
                                                    notice.category === 'Event' ? 'bg-blue-100 text-blue-600' :
                                                        'bg-mahallu-light text-mahallu-primary'}
                                            `}>
                                                {notice.category}
                                            </Badge>
                                            <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider">
                                                <Clock className="h-3.5 w-3.5" />
                                                {new Date(notice.created_at).toLocaleDateString()}
                                            </div>
                                        </div>

                                        <h3 className="text-2xl font-black text-mahallu-dark leading-tight group-hover:text-mahallu-primary transition-colors">
                                            {notice.title}
                                        </h3>

                                        <p className="text-slate-600 font-medium leading-relaxed line-clamp-4">
                                            {notice.content}
                                        </p>

                                        <div className="pt-4">
                                            <Button variant="ghost" className="p-0 text-mahallu-primary font-black uppercase text-xs tracking-widest hover:bg-transparent group/btn">
                                                Read More <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </section>

            {/* Committee Members Section */}
            <section id="committee" className="py-32 bg-slate-50 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

                <div className="max-w-7xl mx-auto px-6 relative">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
                        <div className="space-y-4 max-w-2xl">
                            <Badge className="bg-mahallu-light text-mahallu-primary border-none px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">
                                Leadership
                            </Badge>
                            <h2 className="text-4xl md:text-5xl font-black text-mahallu-dark tracking-tight">
                                Our <span className="text-mahallu-primary">Committee</span> Members
                            </h2>
                            <p className="text-slate-600 font-medium text-lg leading-relaxed">
                                Dedicated leadership working towards the spiritual and social welfare of our Mahallu.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {loading ? (
                            Array(4).fill(0).map((_, i) => (
                                <div key={i} className="h-64 bg-white rounded-[32px] animate-pulse border border-slate-100" />
                            ))
                        ) : committee.length === 0 ? (
                            <div className="col-span-full py-20 text-center space-y-4 bg-white rounded-[40px] border border-dashed border-slate-200">
                                <Users className="h-12 w-12 text-slate-300 mx-auto" />
                                <h3 className="text-xl font-black text-slate-400">Committee details coming soon</h3>
                            </div>
                        ) : (
                            committee.map((member) => (
                                <div key={member.id} className="group p-8 rounded-[32px] bg-white border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 text-center">
                                    <div className="h-20 w-20 bg-mahallu-light text-mahallu-primary rounded-2xl flex items-center justify-center mx-auto mb-6 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
                                        <User className="h-10 w-10" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-xl font-black text-mahallu-dark group-hover:text-mahallu-primary transition-colors">
                                            {member.name}
                                        </h3>
                                        <Badge variant="outline" className="border-mahallu-primary/20 text-mahallu-primary font-bold px-3 py-1 rounded-full text-[10px] uppercase tracking-wider">
                                            {member.designation}
                                        </Badge>
                                        {member.contact_number && (
                                            <div className="pt-4 flex items-center justify-center gap-2 text-slate-400 text-sm font-bold">
                                                <Phone className="h-3.5 w-3.5" />
                                                {member.contact_number}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </section>

            {/* Contact Footer Area */}
            <footer id="contact" className="bg-mahallu-dark text-white py-24">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-20">
                        <div className="col-span-1 lg:col-span-1.5 space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-mahallu-dark font-black text-xl shadow-lg">
                                    M
                                </div>
                                <span className="text-xl font-black text-white tracking-tight">MAHALLU <span className="text-mahallu-primary">PRO</span></span>
                            </div>
                            <p className="text-mahallu-light/60 font-medium leading-relaxed text-lg max-w-sm">
                                Dedicated to the social, spiritual, and systemic excellence of our mahallu community.
                            </p>
                        </div>

                        <div className="space-y-6">
                            <h4 className="text-lg font-black uppercase tracking-widest text-mahallu-primary">Quick Links</h4>
                            <ul className="space-y-4">
                                <li><Link href="/login" className="text-mahallu-light/80 hover:text-white font-bold transition-colors">Member Portal</Link></li>
                                <li><Link href="/login" className="text-mahallu-light/80 hover:text-white font-bold transition-colors">Admin Login</Link></li>
                                <li><Link href="#notice-board" className="text-mahallu-light/80 hover:text-white font-bold transition-colors">Latest Notices</Link></li>
                            </ul>
                        </div>

                        <div className="space-y-6 col-span-1 lg:col-span-1.5">
                            <h4 className="text-lg font-black uppercase tracking-widest text-mahallu-primary">Contact Us</h4>
                            <div className="space-y-5">
                                <div className="flex items-start gap-4">
                                    <div className="h-10 w-10 min-w-10 bg-white/10 rounded-lg flex items-center justify-center text-mahallu-primary">
                                        <MapPin size={20} />
                                    </div>
                                    <span className="font-bold text-mahallu-light/80 pt-1 text-lg">Central Juma Masjid Complex, Mahallu St, Kerala, IN</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 bg-white/10 rounded-lg flex items-center justify-center text-mahallu-primary">
                                        <Phone size={20} />
                                    </div>
                                    <span className="font-bold text-mahallu-light/80 text-lg">+91 0000 000 000</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 bg-white/10 rounded-lg flex items-center justify-center text-mahallu-primary">
                                        <Mail size={20} />
                                    </div>
                                    <span className="font-bold text-mahallu-light/80 text-lg">support@mahallupro.com</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-20 mt-20 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6">
                        <p className="text-mahallu-light/40 font-bold text-sm">© 2025 Mahallu Pro. All rights reserved.</p>
                        <div className="flex gap-8 text-sm font-bold text-mahallu-light/40">
                            <Link href="#" className="hover:text-mahallu-primary transition-colors">Privacy Policy</Link>
                            <Link href="#" className="hover:text-mahallu-primary transition-colors">Terms of Use</Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
