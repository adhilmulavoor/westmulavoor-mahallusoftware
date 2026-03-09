'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Family, Transaction, Sponsorship } from '@/types/database';
import {
    Search,
    CreditCard,
    AlertCircle,
    Calendar,
    ArrowUpRight,
    Loader2,
    Users,
    TrendingUp,
    IndianRupee,
    Briefcase
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AddSponsorshipDialog } from '@/components/dashboard/add-sponsorship-dialog';
import { AddTransactionDialog } from '@/components/dashboard/add-transaction-dialog';
import { Plus } from 'lucide-react';

interface FamilyWithArrears extends Family {
    total_paid: number;
    expected_total: number;
    arrears: number;
    last_payment_date: string | null;
    payment_status: { month: number; year: number; isPaid: boolean }[];
}

export default function PendingPage() {
    const [families, setFamilies] = useState<FamilyWithArrears[]>([]);
    const [sponsorships, setSponsorships] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed

    const fetchData = async () => {
        try {
            setLoading(true);

            // Fetch Families and their Subscription Transactions
            const { data: familiesData, error: familyError } = await supabase
                .from('families')
                .select('*');

            if (familyError) throw familyError;

            const { data: txData, error: txError } = await supabase
                .from('transactions')
                .select('*')
                .eq('category', 'Monthly Subscription');

            if (txError) throw txError;

            // Fetch Sponsorships
            const { data: sponsorData, error: sponsorError } = await supabase
                .from('sponsorships')
                .select('*, families(*)');

            if (!sponsorError) setSponsorships(sponsorData || []);

            // Calculate Arrears for each family
            const now = new Date();
            const currentYear = now.getFullYear();
            const currentMonth = now.getMonth(); // 0-indexed

            const processedFamilies = (familiesData || []).map(family => {
                const familyTx = (txData || []).filter(tx => tx.family_id === family.id);
                const totalPaid = familyTx.reduce((sum, tx) => sum + Number(tx.amount), 0);

                // Advanced calculation from subscription_start_date
                const startDate = new Date(family.subscription_start_date || '2025-01-01');
                const endDate = new Date();
                const paymentStatus: { month: number; year: number; isPaid: boolean }[] = [];

                let checkDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
                while (checkDate <= endDate) {
                    const m = checkDate.getMonth() + 1;
                    const y = checkDate.getFullYear();
                    // Match by payment_month/year or fallback to checking if any payment covers this month (simple logic for old data)
                    const isPaid = familyTx.some(tx =>
                        (tx.payment_month === m && tx.payment_year === y)
                    );
                    paymentStatus.push({ month: m, year: y, isPaid });
                    checkDate.setMonth(checkDate.getMonth() + 1);
                }

                const unpaidMonths = paymentStatus.filter(p => !p.isPaid).length;
                const arrears = unpaidMonths * (Number(family.subscription_amount) || 0);

                return {
                    ...family,
                    total_paid: totalPaid,
                    expected_total: paymentStatus.length * (Number(family.subscription_amount) || 0),
                    arrears: arrears,
                    last_payment_date: familyTx.length > 0 ? familyTx[0].transaction_date : null,
                    payment_status: paymentStatus
                };
            }).filter(f => f.arrears > 0).sort((a, b) => b.arrears - a.arrears);

            setFamilies(processedFamilies);

        } catch (error: any) {
            console.error('Error fetching pending data:', error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredFamilies = families.filter(f =>
        f.house_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.family_id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredSponsorships = sponsorships.filter(s =>
        s.families.house_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.project_name.toLowerCase().includes(searchQuery.toLowerCase())
    ).filter(s => s.total_amount - s.paid_amount > 0);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="text-3xl font-bold tracking-tight text-mahallu-dark">Pending Payments</h2>
                    <p className="text-muted-foreground">Monitor collections and outstanding dues from members.</p>
                </div>
                <div className="flex items-center gap-3">
                    <AddSponsorshipDialog onSuccess={fetchData}>
                        <Button className="bg-mahallu-dark hover:bg-black text-white rounded-xl h-11 px-6 shadow-premium transition-all hover:scale-[1.02]">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Sponsorship
                        </Button>
                    </AddSponsorshipDialog>
                    <Button variant="outline" className="rounded-xl h-11 px-4 border-slate-200" onClick={fetchData}>
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Refresh Data
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="monthly" className="space-y-6">
                <TabsList className="bg-slate-100 p-1 rounded-xl h-12 w-full md:w-auto">
                    <TabsTrigger value="monthly" className="rounded-lg px-6 h-10 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        Monthly Arrears (Masappadi)
                    </TabsTrigger>
                    <TabsTrigger value="sponsoring" className="rounded-lg px-6 h-10 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        Sponsorship Dues
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="monthly" className="space-y-6">
                    {/* Monthly Collection Summary Card */}
                    <div className="card-premium p-8 border-l-4 border-l-rose-500 bg-gradient-to-r from-rose-50/30 to-transparent">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600">
                                <AlertCircle className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-rose-600 uppercase tracking-wider">Total Monthly Arrears</p>
                                <h3 className="text-3xl font-bold text-slate-900">₹{families.reduce((sum, f) => sum + f.arrears, 0).toLocaleString()}</h3>
                            </div>
                        </div>
                    </div>

                    {/* Arrears Table */}
                    <div className="card-premium overflow-hidden">
                        <div className="p-6 border-b bg-slate-50/50 flex flex-col md:flex-row gap-4 justify-between">
                            <div className="relative w-full md:w-96">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by house or member ID..."
                                    className="pl-10 h-11 rounded-xl bg-white border-slate-200"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-slate-50/50">
                                    <TableRow className="hover:bg-transparent border-slate-100">
                                        <TableHead className="font-bold py-5 pl-8 text-mahallu-dark">House / Family</TableHead>
                                        <TableHead className="font-bold py-5 text-mahallu-dark">Payment History ({currentYear})</TableHead>
                                        <TableHead className="font-bold py-5 text-mahallu-dark text-center">Pending</TableHead>
                                        <TableHead className="text-right py-5 pr-8 font-bold text-mahallu-dark">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-64 text-center">
                                                <div className="flex flex-col items-center justify-center gap-2">
                                                    <Loader2 className="h-8 w-8 animate-spin text-mahallu-primary" />
                                                    <p className="text-sm text-muted-foreground">Calculating arrears...</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredFamilies.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-64 text-center">
                                                <div className="flex flex-col items-center justify-center gap-2">
                                                    <CreditCard className="h-8 w-8 text-slate-300" />
                                                    <p className="font-semibold">No arrears found</p>
                                                    <p className="text-sm text-muted-foreground text-center max-w-[200px]">All monthly payments are up to date.</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredFamilies.map((family) => (
                                            <TableRow key={family.id} className="hover:bg-slate-50/50 border-slate-50 transition-colors">
                                                <TableCell className="py-5 pl-8">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-mahallu-dark">{family.house_name}</span>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 uppercase">{family.family_id}</span>
                                                            <span className="text-[10px] text-slate-400">Rate: ₹{family.subscription_amount}</span>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-5">
                                                    <div className="flex gap-1.5 flex-wrap max-w-[300px]">
                                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => {
                                                            const isPaid = family.payment_status?.some(p => p.month === m && p.year === currentYear);
                                                            const isFuture = new Date(currentYear, m - 1, 1) > new Date();
                                                            const monthName = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'][m - 1];

                                                            return (
                                                                <div
                                                                    key={m}
                                                                    title={`${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m - 1]} ${currentYear}: ${isPaid ? 'Paid' : 'Pending'}`}
                                                                    className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold transition-all ${isPaid
                                                                        ? 'bg-mahallu-primary/20 text-mahallu-primary'
                                                                        : isFuture
                                                                            ? 'bg-slate-50 text-slate-300 border border-slate-100'
                                                                            : 'bg-rose-50 text-rose-500 border border-rose-100 shadow-sm'
                                                                        }`}
                                                                >
                                                                    {monthName}
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-5 text-center">
                                                    <div className="flex flex-col items-center">
                                                        <span className="font-black text-rose-600">₹{family.arrears.toLocaleString()}</span>
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                                            {family.payment_status.filter(p => !p.isPaid).length} months due
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right py-5 pr-8">
                                                    <AddTransactionDialog onSuccess={fetchData}>
                                                        <Button variant="ghost" size="sm" className="h-9 px-4 rounded-lg hover:bg-mahallu-primary hover:text-white group border border-dashed border-slate-200 hover:border-solid">
                                                            Collect
                                                            <IndianRupee className="h-3.5 w-3.5 ml-2 group-hover:scale-110 transition-transform" />
                                                        </Button>
                                                    </AddTransactionDialog>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="sponsoring" className="space-y-6">
                    {/* Sponsoring Summary Card */}
                    <div className="card-premium p-8 border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50/30 to-transparent">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600">
                                <Briefcase className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider">Total Sponsorship Dues</p>
                                <h3 className="text-3xl font-bold text-slate-900">₹{sponsorships.reduce((sum, s) => sum + (s.total_amount - s.paid_amount), 0).toLocaleString()}</h3>
                            </div>
                        </div>
                    </div>

                    {/* Sponsorships Table */}
                    <div className="card-premium overflow-hidden">
                        <div className="p-6 border-b bg-slate-50/50">
                            <div className="relative w-full md:w-96">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by family or project..."
                                    className="pl-10 h-11 rounded-xl bg-white border-slate-200"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-slate-50/50">
                                    <TableRow className="hover:bg-transparent border-slate-100">
                                        <TableHead className="font-bold py-5 pl-8 text-mahallu-dark">Project / Commitment</TableHead>
                                        <TableHead className="font-bold py-5 text-mahallu-dark">House / Family</TableHead>
                                        <TableHead className="font-bold py-5 text-mahallu-dark text-center">Total</TableHead>
                                        <TableHead className="font-bold py-5 text-mahallu-dark text-center">Remaining</TableHead>
                                        <TableHead className="text-right py-5 pr-8 font-bold text-mahallu-dark">Progress</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-64 text-center">
                                                <Loader2 className="h-8 w-8 animate-spin mx-auto text-mahallu-primary" />
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredSponsorships.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-64 text-center text-muted-foreground">
                                                No outstanding sponsorships found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredSponsorships.map((s) => (
                                            <TableRow key={s.id} className="hover:bg-slate-50/50 border-slate-50 transition-colors">
                                                <TableCell className="py-5 pl-8">
                                                    <span className="font-bold text-mahallu-dark">{s.project_name}</span>
                                                </TableCell>
                                                <TableCell className="py-5">
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold">{s.families.house_name}</span>
                                                        <span className="text-xs text-slate-500">{s.families.family_id}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-5 text-center font-medium">
                                                    ₹{Number(s.total_amount).toLocaleString()}
                                                </TableCell>
                                                <TableCell className="py-5 text-center">
                                                    <span className="font-black text-blue-600">
                                                        ₹{(s.total_amount - s.paid_amount).toLocaleString()}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right py-5 pr-8">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-blue-500"
                                                                style={{ width: `${(s.paid_amount / s.total_amount) * 100}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-xs font-bold text-slate-500">
                                                            {Math.round((s.paid_amount / s.total_amount) * 100)}%
                                                        </span>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
