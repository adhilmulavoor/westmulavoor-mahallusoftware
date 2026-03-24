'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import {
    CreditCard,
    Wallet,
    Calendar,
    ArrowUpRight,
    Clock,
    History,
    Info,
    AlertCircle,
    CheckCircle2,
    IndianRupee,
    User
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export default function MemberDetailsPage() {
    const { user, role, loading: authLoading } = useAuth();
    const [family, setFamily] = useState<any>(null);
    const [member, setMember] = useState<any>(null);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [sponsorships, setSponsorships] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [arrearsInfo, setArrearsInfo] = useState<{
        totalPending: number;
        months: any[];
        lastPayment: any;
    } | null>(null);

    useEffect(() => {
        if (!authLoading && user) {
            fetchMemberData();
        }
    }, [user, authLoading]);

    const fetchMemberData = async () => {
        try {
            setLoading(true);
            // Get Family ID from user email (family_id@mahallu.local)
            const familyId = user?.email?.split('@')[0]?.toUpperCase();

            if (!familyId) throw new Error('Family ID not found in session');

            // Find Family by family_id
            const { data: famData, error: famErr } = await supabase
                .from('families')
                .select('*, members(*)')
                .eq('family_id', familyId)
                .single();

            if (famErr || !famData) throw new Error('Family not found for this ID');

            setFamily(famData);
            setMember(famData.members?.find((m: any) => m.is_head) || famData.members?.[0]);
            await processFinanceData(famData.id, famData);
        } catch (err) {
            console.error('Error fetching member data:', err);
        } finally {
            setLoading(false);
        }
    };

    const processFinanceData = async (familyId: string, familyObj: any) => {
        // 2. Fetch Transactions & Sponsorships
        const [txRes, spRes] = await Promise.all([
            supabase.from('transactions').select('*').eq('family_id', familyId).order('transaction_date', { ascending: false }),
            supabase.from('sponsorships').select('*').eq('family_id', familyId)
        ]);

        const txs = txRes.data || [];
        const sps = spRes.data || [];
        setTransactions(txs);
        setSponsorships(sps);

        // 3. Calculate Arrears
        calculateArrears(familyObj, txs);
    };

    const calculateArrears = (familyObj: any, txs: any[]) => {
        if (!familyObj.subscription_start_date || !familyObj.subscription_amount) return;

        const start = new Date(familyObj.subscription_start_date);
        const now = new Date();
        const monthlyRate = familyObj.subscription_amount;
        const legacyArrears = familyObj.legacy_arrears || 0;

        // Total months between start date and now
        const totalMonths = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth()) + 1;
        const expectedTotal = totalMonths * monthlyRate + legacyArrears;

        // Paid Total (Monthly Subscriptions only)
        const paidTotal = txs
            .filter(t => t.category === 'Monthly Subscription')
            .reduce((acc, t) => acc + Number(t.amount), 0);

        const totalPending = expectedTotal - paidTotal;

        // Determine specific months pending (approximate)
        const pendingMonths = [];
        let currentYear = start.getFullYear();
        let currentMonth = start.getMonth();

        // This is a simple logic: we find which months have been paid via Transaction records (payment_month/payment_year)
        const paidMonthsSet = new Set(
            txs.filter(t => t.category === 'Monthly Subscription' && t.payment_month && t.payment_year)
                .map(t => `${t.payment_year}-${t.payment_month}`)
        );

        for (let i = 0; i < totalMonths; i++) {
            const key = `${currentYear}-${currentMonth + 1}`;
            if (!paidMonthsSet.has(key)) {
                pendingMonths.push({
                    month: new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date(currentYear, currentMonth)),
                    year: currentYear
                });
            }
            currentMonth++;
            if (currentMonth > 11) {
                currentMonth = 0;
                currentYear++;
            }
        }

        setArrearsInfo({
            totalPending: Math.max(0, totalPending),
            months: pendingMonths.slice(-6), // Show recent 6 pending months
            lastPayment: txs.find(t => t.category === 'Monthly Subscription')
        });
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-12 w-1/3" />
                <div className="grid gap-6 md:grid-cols-3">
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                </div>
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    if (!family) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <AlertCircle className="h-16 w-16 text-slate-300 mb-4" />
                <h2 className="text-2xl font-bold text-slate-700">Profile Not Linked</h2>
                <p className="text-slate-500 max-w-md mt-2">
                    We couldn't find a family profile linked to your phone number.
                    Please contact the Mahallu office to verify your details.
                </p>
            </div>
        );
    }

    const totalSponsorshipPending = sponsorships.reduce((acc, s) => acc + (s.total_amount - s.paid_amount), 0);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-mahallu-dark">
                        {role === 'member' ? 'Dashboard' : 'Member Details'}
                    </h2>
                    <p className="text-muted-foreground">
                        {role === 'member'
                            ? `Welcome back! Here is your current financial status for ${family.house_name}.`
                            : `Detailed financial status and arrears overview for ${family.house_name}.`
                        }
                    </p>
                </div>
                <Badge variant="outline" className="w-fit px-4 py-1.5 rounded-full border-mahallu-primary/30 text-mahallu-primary font-bold">
                    ID: {family.family_id}
                </Badge>
            </div>
            {/* Summary Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card className="border-emerald-100 shadow-sm overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                        <Wallet size={80} className="text-emerald-600" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Monthly Arrears</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-emerald-600">₹{arrearsInfo?.totalPending.toLocaleString() || '0'}</div>
                        <p className="text-xs text-muted-foreground mt-1 font-medium">pending subscription dues</p>
                    </CardContent>
                </Card>

                <Card className="border-blue-100 shadow-sm overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                        <IndianRupee size={80} className="text-blue-600" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Sponsorship Pending</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-blue-600">₹{totalSponsorshipPending.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground mt-1 font-medium">from {sponsorships.length} active projects</p>
                    </CardContent>
                </Card>

                <Card className="border-amber-100 shadow-sm overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                        <History size={80} className="text-amber-600" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Last Payment</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-600">
                            {arrearsInfo?.lastPayment ? `₹${Number(arrearsInfo.lastPayment.amount).toLocaleString()}` : 'No Record'}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 font-medium">
                            {arrearsInfo?.lastPayment ? new Date(arrearsInfo.lastPayment.transaction_date).toLocaleDateString() : 'no transaction found'}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-7">
                {/* Details Breakdown */}
                <Card className="lg:col-span-4 border-slate-100 shadow-xl rounded-[24px]">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-mahallu-primary" />
                            Pending Arrears Breakdown
                        </CardTitle>
                        <CardDescription>Estimated months remaining since membership started.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {arrearsInfo?.months && arrearsInfo.months.length > 0 ? (
                            <div className="space-y-3">
                                {arrearsInfo.months.map((m, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100/50 group hover:bg-white hover:border-emerald-200 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-slate-400 font-bold text-xs border">
                                                {i + 1}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-700">{m.month} {m.year}</p>
                                                <p className="text-xs text-muted-foreground">Monthly Subscription Fee</p>
                                            </div>
                                        </div>
                                        <Badge className="bg-rose-50 text-rose-600 border-none px-3 font-black">₹{family.subscription_amount}</Badge>
                                    </div>
                                ))}
                                {arrearsInfo.months.length >= 6 && (
                                    <p className="text-center text-xs text-muted-foreground pt-4">+ more previous months</p>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-10 grayscale opacity-40">
                                <CheckCircle2 className="h-12 w-12 text-emerald-500 mb-2" />
                                <p className="font-bold text-slate-600">All months paid up!</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Sponsorships */}
                <Card className="lg:col-span-3 border-slate-100 shadow-xl rounded-[24px]">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5 text-blue-600" />
                            Active Sponsorships
                        </CardTitle>
                        <CardDescription>Pending balances for committed projects.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {sponsorships.length > 0 ? (
                            sponsorships.map((s, i) => {
                                const pending = s.total_amount - s.paid_amount;
                                const progress = (s.paid_amount / s.total_amount) * 100;
                                return (
                                    <div key={i} className="p-5 rounded-3xl bg-blue-50/30 border border-blue-100/50 space-y-3">
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-black text-slate-800 uppercase tracking-tight text-sm">{s.project_name}</h4>
                                            <Badge className={pending === 0 ? 'bg-emerald-500' : 'bg-blue-600'}>
                                                {pending === 0 ? 'Paid' : 'Active'}
                                            </Badge>
                                        </div>
                                        <div className="space-y-1.5">
                                            <div className="flex justify-between text-xs font-bold text-slate-500">
                                                <span>Progress</span>
                                                <span>{Math.round(progress)}%</span>
                                            </div>
                                            <div className="h-2 w-full bg-blue-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-blue-600 transition-all" style={{ width: `${progress}%` }} />
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-end pt-2">
                                            <div>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Remaining</p>
                                                <p className="text-lg font-black text-blue-700">₹{pending.toLocaleString()}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Total</p>
                                                <p className="text-sm font-bold text-slate-600">₹{s.total_amount.toLocaleString()}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <p className="text-sm text-center text-muted-foreground py-10">No active sponsorships.</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Info Box */}
            <div className="bg-mahallu-dark rounded-[32px] p-8 text-white relative overflow-hidden">
                <div className="absolute -right-10 -bottom-10 h-48 w-48 bg-white/5 rounded-full blur-3xl" />
                <div className="flex gap-6 items-center">
                    <div className="h-16 w-16 bg-white/10 rounded-2xl flex items-center justify-center text-mahallu-primary">
                        <Info size={32} />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-xl font-bold">Important Information</h3>
                        <p className="text-mahallu-light/60 text-sm leading-relaxed max-w-2xl">
                            The arrears shown above are calculated based on your membership start date.
                            Legacy arrears from previous years are also included in the total pending amount.
                            If you notice any discrepancies, please present your receipts at the office.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
