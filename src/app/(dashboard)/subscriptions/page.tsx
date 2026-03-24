'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Family } from '@/types/database';
import {
    Search,
    CreditCard,
    AlertCircle,
    Calendar,
    Loader2,
    IndianRupee,
    TrendingUp,
    History
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { AddTransactionDialog } from '@/components/dashboard/add-transaction-dialog';
import { ManageLegacyDialog } from '@/components/dashboard/manage-legacy-dialog';

interface FamilyWithArrears extends Family {
    total_paid: number;
    expected_total: number;
    arrears: number;
    last_payment_date: string | null;
    payment_status: { month: number; year: number; isPaid: boolean }[];
}

export default function SubscriptionsPage() {
    const [families, setFamilies] = useState<FamilyWithArrears[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

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

            // Create a map for faster transaction lookups
            const txByFamily = new Map();
            (txData || []).forEach(tx => {
                if (!txByFamily.has(tx.family_id)) {
                    txByFamily.set(tx.family_id, []);
                }
                txByFamily.get(tx.family_id).push(tx);
            });

            // Calculate Arrears for each family
            const processedFamilies = (familiesData || []).map(family => {
                const familyTx = txByFamily.get(family.id) || [];
                const paidSet = new Set(familyTx.map((tx: any) => `${tx.payment_year}-${tx.payment_month}`));

                // Advanced calculation from subscription_start_date
                const startDate = new Date(family.subscription_start_date || '2025-01-01');
                const endDate = new Date();
                const paymentStatus: { month: number; year: number; isPaid: boolean }[] = [];

                let checkDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
                while (checkDate <= endDate) {
                    const m = checkDate.getMonth() + 1;
                    const y = checkDate.getFullYear();
                    const isPaid = paidSet.has(`${y}-${m}`);
                    paymentStatus.push({ month: m, year: y, isPaid });
                    checkDate.setMonth(checkDate.getMonth() + 1);
                }

                const unpaidMonths = paymentStatus.filter(p => !p.isPaid).length;
                const monthlyArrears = unpaidMonths * (Number(family.subscription_amount) || 0);
                const legacyArrears = Number(family.legacy_arrears) || 0;
                const totalArrears = legacyArrears + monthlyArrears;

                return {
                    ...family,
                    total_paid: familyTx.reduce((sum: number, tx: any) => sum + Number(tx.amount), 0),
                    expected_total: (paymentStatus.length * (Number(family.subscription_amount) || 0)) + legacyArrears,
                    arrears: totalArrears,
                    last_payment_date: familyTx.length > 0 ? familyTx[0].transaction_date : null,
                    payment_status: paymentStatus
                };
            }).filter(f => f.arrears > 0).sort((a, b) => 
                (a.family_id || '').localeCompare(b.family_id || '', undefined, { numeric: true, sensitivity: 'base' })
            );

            setFamilies(processedFamilies);

        } catch (error: any) {
            console.error('Error fetching subscription data:', error.message);
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

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="text-3xl font-bold tracking-tight text-mahallu-dark">Monthly Subscriptions</h2>
                    <p className="text-muted-foreground">Track and collect monthly Masappadi payments from households.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="rounded-xl h-11 px-6 border-slate-200" onClick={fetchData}>
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Refresh Status
                    </Button>
                </div>
            </div>

            {/* Arrears Summary Card */}
            <div className="card-premium p-8 border-l-4 border-l-mahallu-primary bg-gradient-to-r from-mahallu-light/30 to-transparent">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-mahallu-primary/10 flex items-center justify-center text-mahallu-primary">
                        <AlertCircle className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-mahallu-primary uppercase tracking-wider">Total Outstanding Subscriptions</p>
                        <h3 className="text-3xl font-bold text-slate-900">₹{families.reduce((sum, f) => sum + f.arrears, 0).toLocaleString()}</h3>
                    </div>
                </div>
            </div>

            {/* List Table */}
            <div className="card-premium overflow-hidden">
                <div className="p-6 border-b bg-slate-50/50 flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search house or ID..."
                            className="pl-10 h-11 rounded-xl bg-white border-slate-200 shadow-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-400 uppercase">View History:</span>
                        <Select value={selectedYear.toString()} onValueChange={(v: string) => setSelectedYear(parseInt(v))}>
                            <SelectTrigger className="w-28 h-10 rounded-xl border-slate-200 bg-white">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-slate-100 shadow-premium">
                                {[2024, 2025, 2026, 2027].map((y) => (
                                    <SelectItem key={y} value={y.toString()}>{y} Year</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow className="hover:bg-transparent border-slate-100">
                                <TableHead className="font-bold py-5 pl-8 text-mahallu-dark">House / Family</TableHead>
                                <TableHead className="font-bold py-5 text-mahallu-dark">Payment Grid ({selectedYear})</TableHead>
                                <TableHead className="font-bold py-5 text-mahallu-dark text-center">Arrears Balance</TableHead>
                                <TableHead className="text-right py-5 pr-8 font-bold text-mahallu-dark">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-64 text-center">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <Loader2 className="h-8 w-8 animate-spin text-mahallu-primary" />
                                            <p className="text-sm text-muted-foreground">Loading subscriptions...</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredFamilies.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-64 text-center">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <CreditCard className="h-8 w-8 text-slate-300" />
                                            <p className="font-semibold">All caught up!</p>
                                            <p className="text-sm text-muted-foreground">No pending subscriptions for this criteria.</p>
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
                                                    const isPaid = family.payment_status?.some(p => p.month === m && p.year === selectedYear);
                                                    const isFuture = new Date(selectedYear, m - 1, 1) > new Date();
                                                    const monthName = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'][m - 1];

                                                    return (
                                                        <div
                                                            key={m}
                                                            title={`${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m - 1]} ${selectedYear}: ${isPaid ? 'Paid' : 'Pending'}`}
                                                            className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold transition-all ${isPaid
                                                                ? 'bg-mahallu-primary text-white shadow-sm'
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
                                                <div className="flex flex-col items-center gap-0.5 mt-1">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                                        {family.payment_status.filter(p => !p.isPaid).length} months due
                                                    </span>
                                                    {Number(family.legacy_arrears) > 0 && (
                                                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-rose-200 text-rose-500 bg-rose-50/50">
                                                            Incl. ₹{family.legacy_arrears} Legacy
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right py-5 pr-8">
                                            <div className="flex items-center justify-end gap-2">
                                                <ManageLegacyDialog family={family} onSuccess={fetchData}>
                                                    <Button variant="ghost" size="icon" title="Manage Legacy Arrears" className="h-9 w-9 text-slate-400 hover:text-rose-500 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-colors">
                                                        <History className="h-4 w-4" />
                                                    </Button>
                                                </ManageLegacyDialog>
                                                <AddTransactionDialog 
                                                    onSuccess={fetchData}
                                                    defaultCategory="Monthly Subscription"
                                                    defaultFamilyId={family.id}
                                                    fixedCategory={true}
                                                >
                                                    <Button variant="ghost" size="sm" className="h-9 px-4 rounded-lg hover:bg-mahallu-primary hover:text-white group border border-dashed border-slate-200 hover:border-solid">
                                                        Collect
                                                        <IndianRupee className="h-3.5 w-3.5 ml-2 group-hover:scale-110 transition-transform" />
                                                    </Button>
                                                </AddTransactionDialog>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}
