'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
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
    Search,
    Phone,
    TrendingUp,
    HandCoins
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AddTransactionDialog } from '@/components/dashboard/add-transaction-dialog';

interface FamilySearchResult {
    id: string;
    family_id: string;
    house_name: string;
}

export default function ArrearCheckerPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<FamilySearchResult[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [family, setFamily] = useState<any>(null);
    const [member, setMember] = useState<any>(null);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [sponsorships, setSponsorships] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [arrearsInfo, setArrearsInfo] = useState<{
        totalPending: number;
        months: any[];
        lastPayment: any;
    } | null>(null);

    const dropdownRef = useRef<HTMLDivElement>(null);

    const fetchFamilyDetails = useCallback(async (familyIdToFetch: string) => {
        try {
            setLoading(true);
            setError(null);
            setFamily(null);
            setMember(null);
            setTransactions([]);
            setSponsorships([]);
            setArrearsInfo(null);
            setShowDropdown(false); // Hide dropdown after selection

            const { data: famData, error: famErr } = await supabase
                .from('families')
                .select('*, members(*)')
                .eq('id', familyIdToFetch)
                .single();

            if (famErr || !famData) {
                throw new Error('No family found with this ID.');
            }

            setFamily(famData);
            setMember(famData.members?.find((m: any) => m.is_head) || famData.members?.[0]);
            await fetchFinanceDetails(famData.id, famData);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleAutocompleteSearch = useCallback(async (query: string) => {
        if (query.length < 2) {
            setSearchResults([]);
            setShowDropdown(false);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('families')
                .select('id, family_id, house_name')
                .or(`family_id.ilike.%${query}%,house_name.ilike.%${query}%`)
                .limit(10);

            if (error) {
                console.error('Error fetching autocomplete results:', error);
                setSearchResults([]);
                setShowDropdown(false);
            } else {
                setSearchResults(data || []);
                setShowDropdown(true);
            }
        } catch (err) {
            console.error('Autocomplete search failed:', err);
            setSearchResults([]);
            setShowDropdown(false);
        }
    }, []);

    // Debounce the autocomplete search
    useEffect(() => {
        const handler = setTimeout(() => {
            if (searchQuery) {
                handleAutocompleteSearch(searchQuery);
            } else {
                setSearchResults([]);
                setShowDropdown(false);
            }
        }, 300); // 300ms debounce

        return () => {
            clearTimeout(handler);
        };
    }, [searchQuery, handleAutocompleteSearch]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleSelectFamily = (selectedFamily: FamilySearchResult) => {
        setSearchQuery(`${selectedFamily.family_id} - ${selectedFamily.house_name}`);
        fetchFamilyDetails(selectedFamily.id);
    };

    const fetchFinanceDetails = async (familyId: string, familyObj: any) => {
        const [txRes, spRes] = await Promise.all([
            supabase.from('transactions').select('*').eq('family_id', familyId).order('transaction_date', { ascending: false }),
            supabase.from('sponsorships').select('*').eq('family_id', familyId)
        ]);

        const txs = txRes.data || [];
        const sps = spRes.data || [];
        setTransactions(txs);
        setSponsorships(sps);
        calculateArrears(familyObj, txs);
    };

    const calculateArrears = (familyObj: any, txs: any[]) => {
        if (!familyObj.subscription_start_date || !familyObj.subscription_amount) {
            setArrearsInfo({ totalPending: 0, months: [], lastPayment: null });
            return;
        }

        const start = new Date(familyObj.subscription_start_date);
        const now = new Date();
        const monthlyRate = familyObj.subscription_amount;
        const legacyArrears = Number(familyObj.legacy_arrears) || 0;

        const totalMonths = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth()) + 1;
        const expectedTotal = totalMonths * monthlyRate + legacyArrears;

        const paidTotal = txs
            .filter(t => t.category === 'Monthly Subscription')
            .reduce((acc, t) => acc + Number(t.amount), 0);

        const totalPending = expectedTotal - paidTotal;

        const pendingMonths = [];
        let currentYear = start.getFullYear();
        let currentMonth = start.getMonth();

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
            months: pendingMonths.slice(-6), // Show last 6 pending months
            lastPayment: txs.find(t => t.category === 'Monthly Subscription')
        });
    };

    const totalSponsorshipPending = sponsorships.reduce((acc, s) => acc + (Number(s.total_amount) - Number(s.paid_amount)), 0);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-mahallu-dark">കുടിശ്ശിക പരിശോധന</h2>
                <p className="text-muted-foreground">Admin tool to verify member pending amounts and sponsorship status.</p>
            </div>

            {/* Search Box */}
            <Card className="border-emerald-100 shadow-lg rounded-[24px] overflow-visible">
                <form onSubmit={(e) => e.preventDefault()}>
                    <CardHeader className="bg-emerald-50/50 pb-6">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Search className="h-5 w-5 text-emerald-600" />
                            Search Family
                        </CardTitle>
                        <CardDescription>Enter Family ID or House Name to check their financial status.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="relative" ref={dropdownRef}>
                            <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                            <Input
                                className="pl-10 h-12 rounded-xl text-lg"
                                placeholder="e.g. F001 or House Name"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onFocus={() => searchQuery.length >= 2 && setSearchResults.length > 0 && setShowDropdown(true)}
                            />
                            {showDropdown && searchResults.length > 0 && (
                                <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-xl shadow-lg mt-2 max-h-60 overflow-y-auto">
                                    {searchResults.map((result) => (
                                        <div
                                            key={result.id}
                                            className="p-3 cursor-pointer hover:bg-gray-100 flex justify-between items-center"
                                            onClick={() => handleSelectFamily(result)}
                                        >
                                            <span className="font-medium text-slate-800">{result.house_name}</span>
                                            <Badge variant="secondary" className="text-xs font-semibold">{result.family_id}</Badge>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        {error && (
                            <p className="text-rose-500 text-sm mt-3 font-medium flex items-center gap-1">
                                <AlertCircle size={14} /> {error}
                            </p>
                        )}
                    </CardContent>
                </form>
            </Card>

            {loading && (
                <div className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-3">
                        <Skeleton className="h-32 rounded-3xl" />
                        <Skeleton className="h-32 rounded-3xl" />
                        <Skeleton className="h-32 rounded-3xl" />
                    </div>
                    <Skeleton className="h-96 rounded-[32px]" />
                </div>
            )}

            {!loading && family && (
                <div className="space-y-8">
                    {/* Result Summary */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-mahallu-primary/10 flex items-center justify-center text-mahallu-primary">
                                <Search size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-800">{family.house_name}</h3>
                                <p className="text-sm text-muted-foreground">Family ID: {family.family_id} • Head: {member?.name}</p>
                            </div>
                        </div>
                        <Badge className="bg-mahallu-primary/10 text-mahallu-primary border-mahallu-primary/20 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
                            Found Result
                        </Badge>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {/* Monthly Arrears Card */}
                        <Card className="border-emerald-100 shadow-sm overflow-hidden group rounded-3xl">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">മാസവരി കുടിശ്ശിക</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-black text-emerald-600">₹{arrearsInfo?.totalPending.toLocaleString() || '0'}</div>
                                <p className="text-xs text-muted-foreground mt-1 font-medium">മാസവരി കുടിശ്ശികങ്ങള്</p>
                            </CardContent>
                            {arrearsInfo && arrearsInfo.totalPending > 0 && (
                                <CardFooter className="bg-emerald-50/50 border-t border-emerald-100 p-4">
                                    <AddTransactionDialog 
                                        onSuccess={() => fetchFinanceDetails(family.id, family)}
                                        defaultCategory="Monthly Subscription"
                                        fixedCategory={true}
                                        defaultFamilyId={family.id}
                                    >
                                        <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold gap-2 shadow-lg shadow-emerald-200 transition-all active:scale-[0.98]">
                                            <HandCoins className="h-4 w-4" />
                                            മാസവരി രേഖപ്പെടുത്തുക
                                        </Button>
                                    </AddTransactionDialog>
                                </CardFooter>
                            )}
                        </Card>

                        {/* Sponsorship Pending Card */}
                        <Card className="border-blue-100 shadow-sm overflow-hidden group rounded-3xl">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Sponsorship Pending</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-black text-blue-600">₹{totalSponsorshipPending.toLocaleString()}</div>
                                <p className="text-xs text-muted-foreground mt-1 font-medium">from {sponsorships.length} projects</p>
                            </CardContent>
                            {totalSponsorshipPending > 0 && (
                                <CardFooter className="bg-blue-50/50 border-t border-blue-100 p-4">
                                    <AddTransactionDialog 
                                        onSuccess={() => fetchFinanceDetails(family.id, family)}
                                        defaultCategory="Project Sponsorship"
                                        fixedCategory={true}
                                        defaultFamilyId={family.id}
                                    >
                                        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold gap-2 shadow-lg shadow-blue-200 transition-all active:scale-[0.98]">
                                            <HandCoins className="h-4 w-4" />
                                            Record Sponsorship
                                        </Button>
                                    </AddTransactionDialog>
                                </CardFooter>
                            )}
                        </Card>

                        {/* Combined Total Card */}
                        <Card className="border-amber-100 shadow-sm overflow-hidden group rounded-3xl">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Combined Total</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-black text-amber-600">₹{((arrearsInfo?.totalPending || 0) + totalSponsorshipPending).toLocaleString()}</div>
                                <p className="text-xs text-muted-foreground mt-1 font-medium">total due amount</p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-7">
                        {/* Breakdown Column */}
                        <Card className="lg:col-span-4 border-slate-100 shadow-xl rounded-[24px]">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Clock className="h-5 w-5 text-mahallu-primary" />
                                    മാസവരി കുടിശ്ശിക വിവരങ്ങൾ
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {arrearsInfo?.months && arrearsInfo.months.length > 0 ? (
                                    <div className="space-y-3">
                                        {arrearsInfo.months.map((m, i) => (
                                            <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100/50 group hover:bg-white hover:border-emerald-200 transition-all">
                                                <div>
                                                    <p className="font-bold text-slate-700">{m.month} {m.year}</p>
                                                    <p className="text-xs text-muted-foreground">മാസവരി</p>
                                                </div>
                                                <Badge className="bg-rose-50 text-rose-600 border-none px-3 font-black">₹{family.subscription_amount}</Badge>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-10 grayscale opacity-40">
                                        <CheckCircle2 className="h-12 w-12 text-emerald-500 mb-2" />
                                        <p className="font-bold text-slate-600">All months paid up!</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Active Sponsorships Column */}
                        <Card className="lg:col-span-3 border-slate-100 shadow-xl rounded-[24px]">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CreditCard className="h-5 w-5 text-blue-600" />
                                    Active Sponsorships
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {sponsorships.length > 0 ? (
                                    sponsorships.map((s, i) => {
                                        const pending = Number(s.total_amount) - Number(s.paid_amount);
                                        return (
                                            <div key={i} className="p-4 rounded-2xl bg-blue-50/30 border border-blue-100/50 flex flex-col gap-3">
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <h4 className="font-bold text-slate-800 text-sm uppercase">{s.project_name}</h4>
                                                        <p className="text-xs text-slate-500">Paid: ₹{Number(s.paid_amount).toLocaleString()}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm font-black text-blue-700">₹{pending.toLocaleString()}</p>
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase">Pending</p>
                                                    </div>
                                                </div>
                                                {pending > 0 && (
                                                    <AddTransactionDialog 
                                                        onSuccess={() => fetchFinanceDetails(family.id, family)}
                                                        defaultCategory="Project Sponsorship"
                                                        fixedCategory={true}
                                                        defaultFamilyId={family.id}
                                                        defaultSponsorshipId={s.id}
                                                    >
                                                        <Button variant="outline" size="sm" className="w-full rounded-xl text-[10px] font-bold h-8 border-blue-200 text-blue-700 hover:bg-blue-50 transition-all hover:border-blue-400">
                                                            <HandCoins className="h-3.5 w-3.5 mr-1.5" />
                                                            Collect for {s.project_name}
                                                        </Button>
                                                    </AddTransactionDialog>
                                                )}
                                            </div>
                                        );
                                    })
                                ) : (
                                    <p className="text-sm text-center text-muted-foreground py-10">No active sponsorships.</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
}
