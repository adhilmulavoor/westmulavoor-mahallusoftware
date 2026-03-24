'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Family } from '@/types/database';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, History, CheckCircle2, DollarSign, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface HistoricalPaymentDialogProps {
    family: Family | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function HistoricalPaymentDialog({ family, open, onOpenChange, onSuccess }: HistoricalPaymentDialogProps) {
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [unpaidMonths, setUnpaidMonths] = useState<{ id: string; month: string; monthNum: number; year: number }[]>([]);
    const [paidMonths, setPaidMonths] = useState<{ txId: string; id: string; month: string; monthNum: number; year: number }[]>([]);
    const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
    const [sponsorships, setSponsorships] = useState<any[]>([]);
    const [sponsorAmounts, setSponsorAmounts] = useState<Record<string, string>>({});

    useEffect(() => {
        if (open && family) {
            fetchData();
        } else {
            setSelectedMonths([]);
            setUnpaidMonths([]);
            setSponsorships([]);
        }
    }, [open, family]);

    const fetchData = async () => {
        if (!family) return;
        setFetching(true);

        try {
            // Fetch Transactions for Subscription Logic
            const { data: txs } = await supabase.from('transactions')
                .select('id, payment_month, payment_year')
                .eq('family_id', family.id)
                .eq('category', 'Monthly Subscription');

            // Calculate Unpaid Months
            if (family.subscription_start_date) {
                const start = new Date(family.subscription_start_date);
                const now = new Date();
                const totalMonths = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth()) + 1;

                const paidSet = new Set((txs || []).map(t => `${t.payment_year}-${t.payment_month}`));
                const pending = [];

                let currentYear = start.getFullYear();
                let currentMonth = start.getMonth();

                for (let i = 0; i < totalMonths; i++) {
                    const key = `${currentYear}-${currentMonth + 1}`;
                    if (!paidSet.has(key)) {
                        pending.push({
                            id: key,
                            month: new Intl.DateTimeFormat('en-US', { month: 'short' }).format(new Date(currentYear, currentMonth)),
                            monthNum: currentMonth + 1,
                            year: currentYear
                        });
                    }
                    currentMonth++;
                    if (currentMonth > 11) {
                        currentMonth = 0;
                        currentYear++;
                    }
                }

                setUnpaidMonths(pending);
                
                const paidList = (txs || []).map(t => ({
                    txId: t.id,
                    id: `${t.payment_year}-${t.payment_month}`,
                    month: new Intl.DateTimeFormat('en-US', { month: 'short' }).format(new Date(t.payment_year, t.payment_month - 1)),
                    monthNum: t.payment_month,
                    year: t.payment_year
                })).sort((a, b) => b.year - a.year || b.monthNum - a.monthNum);
                setPaidMonths(paidList);
            }

            // Fetch Active Sponsorships
            const { data: sps } = await supabase.from('sponsorships')
                .select('*')
                .eq('family_id', family.id)
                .neq('status', 'Completed');

            setSponsorships(sps || []);

        } catch (error) {
            console.error("Error fetching historical data", error);
        } finally {
            setFetching(false);
        }
    };

    const toggleMonth = (id: string) => {
        setSelectedMonths(prev =>
            prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
        );
    };

    const handleSubmitMonths = async () => {
        if (!family || selectedMonths.length === 0) return;
        setLoading(true);

        try {
            const amountPerMonth = Number(family.subscription_amount) || 0;
            const now = new Date().toISOString();

            const inserts = selectedMonths.map(monthId => {
                const [year, month] = monthId.split('-');
                return {
                    family_id: family.id,
                    amount: amountPerMonth,
                    category: 'Monthly Subscription',
                    transaction_date: now.split('T')[0],
                    notes: 'Historical Record (Onboarding)',
                    payment_month: parseInt(month),
                    payment_year: parseInt(year)
                };
            });

            const { error } = await supabase.from('transactions').insert(inserts);
            if (error) throw error;

            // Re-fetch to update UI instantly without closing
            await fetchData();
            setSelectedMonths([]);

        } catch (error: any) {
            console.error('Error saving historical months:', error);
            alert(`Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleDeletePaidMonth = async (txId: string) => {
        if (!confirm('Are you sure you want to remove this paid month? It will be marked as unpaid again.')) return;
        setLoading(true);
        try {
            const { error } = await supabase.from('transactions').delete().eq('id', txId);
            if (error) throw error;
            await fetchData();
        } catch (error: any) {
            console.error('Error removing paid month:', error);
            alert(`Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkSponsorshipPaid = async (sponsorship: any) => {
        if (!family) return;
        
        const stringVal = sponsorAmounts[sponsorship.id];
        const pendingValue = Number(sponsorship.total_amount) - Number(sponsorship.paid_amount);
        const finalAmount = stringVal ? Number(stringVal) : pendingValue;

        if (finalAmount <= 0) return;

        setLoading(true);

        try {
            const newPaidAmount = Number(sponsorship.paid_amount) + finalAmount;
            const newStatus = newPaidAmount >= Number(sponsorship.total_amount) ? 'Completed' : 'Active';
            const now = new Date().toISOString();

            // 1. Update Sponsorship Status
            const { error: spError } = await supabase
                .from('sponsorships')
                .update({
                    paid_amount: newPaidAmount,
                    status: newStatus
                })
                .eq('id', sponsorship.id);

            if (spError) throw spError;

            // 2. Insert Transaction Record
            const { error: txError } = await supabase
                .from('transactions')
                .insert([{
                    family_id: family.id,
                    amount: finalAmount,
                    category: 'Sponsorship',
                    sponsorship_id: sponsorship.id,
                    transaction_date: now.split('T')[0],
                    notes: 'Historical Record (Onboarding)'
                }]);

            if (txError) throw txError;

            setSponsorAmounts(prev => ({ ...prev, [sponsorship.id]: '' }));

            await fetchData();

        } catch (error: any) {
            console.error('Error saving historical sponsorship:', error);
            alert(`Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    if (!family) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden border-none shadow-premium-hover rounded-2xl h-[80vh] flex flex-col">
                <div className="bg-mahallu-dark p-6 text-white relative flex-shrink-0">
                    <div className="absolute -right-4 -top-4 opacity-10">
                        <History size={100} />
                    </div>
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold tracking-tight">Mark Historical Payments</DialogTitle>
                        <DialogDescription className="text-mahallu-light/80 text-sm mt-1 max-w-sm">
                            Fast onboarding tool to mark past Masavari or Sponsorships as paid for <span className="text-white font-bold">{family.house_name}</span>.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="p-6 bg-slate-50 flex-1 overflow-y-auto space-y-8">
                    {fetching ? (
                        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                            <Loader2 className="h-8 w-8 animate-spin mb-4" />
                            <p>Loading historical data...</p>
                        </div>
                    ) : (
                        <>
                            {/* Masavari Section */}
                            <section className="space-y-4">
                                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                                        Masavari (Monthly Subscriptions)
                                    </h3>
                                    <Badge variant="outline" className="bg-white border-slate-200 text-slate-600">
                                        ₹{family.subscription_amount}/mo
                                    </Badge>
                                </div>

                                {unpaidMonths.length > 0 ? (
                                    <div className="space-y-4">
                                        <p className="text-sm text-muted-foreground bg-amber-50 text-amber-800 p-3 rounded-xl border border-amber-100">
                                            Select the months that the member has previously paid. They will be marked as "Historical Record".
                                        </p>
                                        <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1 scrollbar-hide">
                                            {unpaidMonths.map(m => {
                                                const isSelected = selectedMonths.includes(m.id);
                                                return (
                                                    <button
                                                        type="button"
                                                        key={m.id}
                                                        onClick={() => toggleMonth(m.id)}
                                                        className={`px-3 py-2 border rounded-xl text-sm font-bold transition-all ${isSelected
                                                                ? 'bg-emerald-600 text-white border-emerald-700 shadow-md transform scale-105'
                                                                : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50'
                                                            }`}
                                                    >
                                                        {m.month} {m.year}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                        <div className="flex justify-end pt-2">
                                            <Button
                                                onClick={handleSubmitMonths}
                                                disabled={selectedMonths.length === 0 || loading}
                                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                            >
                                                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                                                Mark {selectedMonths.length} Months Paid
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-white p-6 rounded-2xl border border-slate-100 text-center">
                                        <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-2 opacity-50" />
                                        <p className="text-slate-500 font-medium">All pending Masavari months are indicated as paid.</p>
                                    </div>
                                )}

                                {paidMonths.length > 0 && (
                                    <div className="mt-6 pt-4 border-t border-slate-200">
                                        <h4 className="text-sm font-semibold text-slate-500 mb-3 flex justify-between items-center">
                                            <span>Already Paid Months</span>
                                            <span className="text-xs font-normal text-slate-400">Click × to remove</span>
                                        </h4>
                                        <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1 scrollbar-hide">
                                            {paidMonths.map(m => (
                                                <div
                                                    key={m.txId}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 bg-white rounded-lg shadow-sm"
                                                >
                                                    <span className="text-sm font-medium text-slate-600">{m.month} {m.year}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeletePaidMonth(m.txId)}
                                                        className="text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full p-0.5 transition-colors"
                                                        title="Remove this mistaken paid month"
                                                    >
                                                        <X className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </section>

                            {/* Sponsorships Section */}
                            <section className="space-y-4">
                                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                        <DollarSign className="h-5 w-5 text-blue-600" />
                                        Active Sponsorships
                                    </h3>
                                </div>

                                {sponsorships.length > 0 ? (
                                    <div className="space-y-3">
                                        {sponsorships.map(s => {
                                            const pending = Number(s.total_amount) - Number(s.paid_amount);
                                            return (
                                                <Card key={s.id} className="border-slate-200 shadow-sm rounded-2xl overflow-hidden">
                                                    <CardContent className="p-4 flex items-center justify-between gap-4">
                                                        <div>
                                                            <h4 className="font-bold text-slate-800">{s.project_name}</h4>
                                                            <div className="text-sm text-slate-500 mt-0.5 flex items-center gap-3">
                                                                <span>Total: <b className="text-slate-700">₹{s.total_amount}</b></span>
                                                                <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded font-bold">
                                                                    Pending: ₹{pending}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <div className="relative w-28">
                                                                <span className="absolute left-2.5 top-1.5 text-slate-500 text-sm font-medium">₹</span>
                                                                <Input 
                                                                    type="number" 
                                                                    placeholder={pending.toString()}
                                                                    className="h-8 pl-6 pr-2 text-right font-medium"
                                                                    value={sponsorAmounts[s.id] ?? ''}
                                                                    onChange={(e) => setSponsorAmounts(prev => ({...prev, [s.id]: e.target.value}))}
                                                                />
                                                            </div>
                                                            <Button
                                                                variant="outline"
                                                                disabled={loading}
                                                                onClick={() => handleMarkSponsorshipPaid(s)}
                                                                className="h-8 text-blue-700 border-blue-200 hover:bg-blue-50 hover:border-blue-300 font-bold text-xs"
                                                            >
                                                                {loading ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : null}
                                                                Record
                                                            </Button>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            )
                                        })}
                                    </div>
                                ) : (
                                    <div className="bg-white p-6 rounded-2xl border border-slate-100 text-center">
                                        <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-2 opacity-50" />
                                        <p className="text-slate-500 font-medium">No active pending sponsorships.</p>
                                    </div>
                                )}
                            </section>
                        </>
                    )}
                </div>

                <div className="p-4 bg-white border-t border-slate-100 flex justify-end flex-shrink-0">
                    <Button variant="ghost" className="rounded-xl px-6" onClick={() => { onSuccess(); onOpenChange(false); }}>
                        Close Window
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
