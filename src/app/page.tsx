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

export const revalidate = 60;

export default async function LandingPage() {
    const { data: noticesData } = await supabase
        .from('public_notices')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

    const notices = noticesData || [];

    const { data: committeeData } = await supabase
        .from('committee_members')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

    const committee = committeeData || [];

    return (
        <div className="min-h-screen bg-slate-50 overflow-x-hidden">
            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-center">
                    <Link href="/" className="flex items-center gap-3 sm:gap-4 hover:opacity-80 transition-opacity">
                        <div className="relative h-12 w-12 sm:h-14 sm:w-14 flex-shrink-0 rounded-full overflow-hidden shadow-sm border border-slate-100">
                            <Image src="/logo.png" alt="Mahallu Management Logo" fill className="object-cover" />
                        </div>
                        <span className="text-[18px] sm:text-2xl font-black text-slate-800 tracking-tight whitespace-nowrap">WEST MULAVOOR <span className="text-mahallu-primary">MAHALL</span></span>
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
                        <div className="order-2 lg:order-1 space-y-8 max-w-2xl animate-in fade-in slide-in-from-left-8 duration-700">
                            <Badge className="bg-emerald-50 text-emerald-800 border border-emerald-100 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest flex w-fit items-center gap-2">
                                <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
                                OFFICIAL WEST MULAVOOR MAHALL PORTAL
                            </Badge>

                            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-[#1a5b40] leading-[1.05] tracking-tighter">
                                Empowering Our <br />
                                Community Care.
                            </h1>

                            <p className="text-base sm:text-lg text-slate-700 leading-relaxed font-medium max-w-xl">
                                Seamlessly manage accounts, memberships, and community welfare for West Mulavoor Mahall with our digital platform. Building a stronger, more connected community.
                            </p>

                            <div className="flex flex-col gap-3 w-full max-w-md">
                                <div className="flex flex-col sm:flex-row flex-wrap items-center gap-4 pt-2">
                                    <Link href="/login?type=admin" className="w-full sm:w-auto flex-1">
                                        <Button size="lg" className="h-14 px-6 text-base font-bold rounded-xl bg-[#1d8253] hover:bg-[#166841] text-white w-full transition-all shadow-md">
                                            Admin Login <ShieldCheck className="ml-2 h-5 w-5" />
                                        </Button>
                                    </Link>
                                    <Link href="/login?type=member" className="w-full sm:w-auto flex-1">
                                        <Button size="lg" className="h-14 px-6 text-base font-bold rounded-xl bg-white border border-emerald-200 text-emerald-800 hover:bg-emerald-50 w-full transition-all shadow-sm">
                                            Member Login <User className="ml-2 h-5 w-5" />
                                        </Button>
                                    </Link>
                                </div>

                                <div className="pt-3 text-[13px] font-semibold text-slate-400 text-center w-full">
                                    Created by <a href="https://www.instagram.com/ad.x_il/" target="_blank" rel="noopener noreferrer" className="font-bold text-mahallu-primary hover:text-[#1d8253] transition-colors">adhilmulavoor</a>
                                </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-start gap-3 sm:gap-12 pt-6 w-full">
                                <div>
                                    <div className="text-2xl sm:text-3xl font-black text-slate-900">200+</div>
                                    <div className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">FAMILIES</div>
                                </div>
                                <div className="h-8 w-[2px] bg-slate-200" />
                                <div>
                                    <div className="text-2xl sm:text-3xl font-black text-slate-900">1.0k</div>
                                    <div className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">MEMBERS</div>
                                </div>
                                <div className="h-8 w-[2px] bg-slate-200" />
                                <div>
                                    <div className="text-2xl sm:text-3xl font-black text-slate-900">5k+</div>
                                    <div className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">RECORDS</div>
                                </div>
                            </div>
                        </div>

                        <div className="order-1 lg:order-2 relative animate-in fade-in slide-in-from-right-8 duration-1000 delay-200 h-[300px] sm:h-[400px] lg:h-[600px] w-full">
                            <div className="relative h-full w-full rounded-[24px] md:rounded-[40px] overflow-hidden shadow-[0_32px_64px_-16px_rgba(5,150,105,0.25)] border-[6px] md:border-[12px] border-white">
                                <Image
                                    src="/masjid-new-v2.jpg"
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
                        {notices.length === 0 ? (
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
                        {committee.length === 0 ? (
                            <div className="col-span-full py-20 text-center space-y-4 bg-white rounded-[40px] border border-dashed border-slate-200">
                                <Users className="h-12 w-12 text-slate-300 mx-auto" />
                                <h3 className="text-xl font-black text-slate-400">Committee details coming soon</h3>
                            </div>
                        ) : (
                            committee.map((member) => (
                                <div key={member.id} className="group p-8 sm:py-12 rounded-[32px] bg-white border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 text-center flex flex-col justify-center min-h-[160px]">
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
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12 lg:gap-8 border-none outline-none">
                        <div className="space-y-6">
                            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity w-fit">
                                <div className="relative h-12 w-12 flex-shrink-0 rounded-full overflow-hidden shadow-lg border border-white/20 bg-white">
                                    <Image src="/logo.png" alt="Mahallu Management Logo" fill className="object-cover" />
                                </div>
                                <span className="text-xl leading-[1.1] font-black text-white tracking-tight">WEST MULAVOOR <br className="lg:hidden" /><span className="text-mahallu-primary">MAHALL</span></span>
                            </Link>
                            <p className="text-mahallu-light/60 font-medium leading-relaxed text-base max-w-sm">
                                Dedicated to the social, spiritual, and systemic excellence of our mahallu community.
                            </p>
                        </div>

                        <div className="space-y-6 lg:mx-auto">
                            <h4 className="text-lg font-black uppercase tracking-widest text-mahallu-primary">Quick Links</h4>
                            <ul className="space-y-4">
                                <li><Link href="/" className="text-mahallu-light/80 hover:text-white font-bold transition-colors">Home</Link></li>
                                <li><Link href="#notice-board" className="text-mahallu-light/80 hover:text-white font-bold transition-colors">Notice Board</Link></li>
                                <li><Link href="#committee" className="text-mahallu-light/80 hover:text-white font-bold transition-colors">Committee Members</Link></li>
                                <li><Link href="/login" className="text-emerald-400 hover:text-emerald-300 font-bold transition-colors">Login Portal &rarr;</Link></li>
                            </ul>
                        </div>

                        <div className="space-y-6 lg:justify-self-end">
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

                    <div className="pt-20 mt-20 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-8 md:gap-6">
                        <p className="text-mahallu-light/40 font-bold text-sm flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
                            <span>© 2025 Mahallu Pro. All rights reserved.</span>
                            <span className="hidden sm:inline text-white/20">|</span>
                            <span>Powered by <a href="https://www.instagram.com/ad.x_il/" target="_blank" rel="noopener noreferrer" className="text-mahallu-primary hover:text-white transition-colors">adhilmulavoor</a></span>
                        </p>
                        <div className="flex gap-6 sm:gap-8 text-sm font-bold text-mahallu-light/40">
                            <Link href="#" className="hover:text-mahallu-primary transition-colors">Privacy Policy</Link>
                            <Link href="#" className="hover:text-mahallu-primary transition-colors">Terms of Use</Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
