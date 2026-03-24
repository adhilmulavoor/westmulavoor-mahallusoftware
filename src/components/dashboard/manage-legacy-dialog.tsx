'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Family } from '@/types/database';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Receipt, History, Edit3 } from 'lucide-react';

interface ManageLegacyDialogProps {
    children?: React.ReactNode;
    family: Family;
    onSuccess: () => void;
}

export function ManageLegacyDialog({ children, family, onSuccess }: ManageLegacyDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('payment');

    // State for Adjust Amount
    const [newAmount, setNewAmount] = useState((family.legacy_arrears || 0).toString());

    // State for Record Payment
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
    const [notes, setNotes] = useState('');

    const handleAdjust = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const val = parseFloat(newAmount);
        
        if (isNaN(val) || val < 0) {
            alert('Please enter a valid amount.');
            setLoading(false);
            return;
        }

        const { error } = await supabase
            .from('families')
            .update({ legacy_arrears: val })
            .eq('id', family.id);

        if (error) alert(`Error: ${error.message}`);
        else {
            onSuccess();
            setOpen(false);
        }
        setLoading(false);
    };

    const handlePayment = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const amount = parseFloat(paymentAmount);
        
        if (isNaN(amount) || amount <= 0) {
            alert('Please enter a valid payment amount.');
            setLoading(false);
            return;
        }

        const currentLegacy = Number(family.legacy_arrears) || 0;
        const remainingLegacy = Math.max(0, currentLegacy - amount);

        // 1. Update legacy arrears
        const { error: updateError } = await supabase
            .from('families')
            .update({ legacy_arrears: remainingLegacy })
            .eq('id', family.id);

        if (updateError) {
            alert(`Error updating arrears: ${updateError.message}`);
            setLoading(false);
            return;
        }

        // 2. Insert Transaction Record
        const { error: txError } = await supabase
            .from('transactions')
            .insert([{
                family_id: family.id,
                amount: amount,
                category: 'Legacy Arrears',
                transaction_date: paymentDate,
                notes: notes || 'Legacy Arrears Clearance'
            }]);

        if (txError) {
            alert(`Error recording transaction: ${txError.message}`);
        } else {
            onSuccess();
            setPaymentAmount('');
            setNotes('');
            setOpen(false);
        }
        setLoading(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {children && <DialogTrigger asChild>{children}</DialogTrigger>}
            <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-none shadow-premium-hover rounded-2xl">
                <div className="bg-mahallu-dark p-6 text-white relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 opacity-10">
                        <History size={100} />
                    </div>
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold tracking-tight">Legacy Arrears</DialogTitle>
                        <DialogDescription className="text-mahallu-light/70 mt-1">
                            {family.house_name} ({family.family_id})
                        </DialogDescription>
                    </DialogHeader>
                    <div className="mt-4 p-3 bg-white/10 rounded-xl border border-white/10 flex justify-between items-center">
                        <span className="text-sm font-medium text-mahallu-light">Current Legacy Balance:</span>
                        <span className="font-bold text-xl text-rose-300">₹{Number(family.legacy_arrears || 0).toLocaleString()}</span>
                    </div>
                </div>

                <div className="p-6 bg-slate-50">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-6 h-12 bg-slate-100/80 p-1 rounded-xl">
                            <TabsTrigger value="payment" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-sm font-semibold">
                                <Receipt className="h-4 w-4 mr-2" />
                                Record Payment
                            </TabsTrigger>
                            <TabsTrigger value="adjust" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-sm font-semibold">
                                <Edit3 className="h-4 w-4 mr-2" />
                                Update Amount
                            </TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="payment" className="mt-0 space-y-4">
                            <form onSubmit={handlePayment} className="space-y-4 bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                                <div className="space-y-1.5">
                                    <Label className="text-slate-600 font-semibold">Amount Received (₹)</Label>
                                    <Input 
                                        type="number" 
                                        placeholder="e.g. 500" 
                                        className="h-11 rounded-lg border-emerald-200 bg-emerald-50/50 focus-visible:ring-emerald-500"
                                        value={paymentAmount}
                                        onChange={(e) => setPaymentAmount(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-slate-600 font-semibold">Date</Label>
                                    <Input 
                                        type="date" 
                                        className="h-11 rounded-lg border-slate-200"
                                        value={paymentDate}
                                        onChange={(e) => setPaymentDate(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-slate-600 font-semibold">Notes (Optional)</Label>
                                    <Input 
                                        placeholder="Additional details..." 
                                        className="h-11 rounded-lg border-slate-200"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                    />
                                </div>
                                <Button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-11 rounded-xl text-sm font-bold shadow-md mt-2">
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Receipt className="h-4 w-4 mr-2" />}
                                    Process & Reduce Total
                                </Button>
                            </form>
                        </TabsContent>
                        
                        <TabsContent value="adjust" className="mt-0 space-y-4">
                            <form onSubmit={handleAdjust} className="space-y-4 bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                                <div className="p-3 bg-amber-50 text-amber-700 rounded-lg text-xs leading-relaxed border border-amber-100 mb-2">
                                    <strong>Note:</strong> Modifying the amount here will directly change the total legacy arrears without generating a payment receipt. Use this for corrections.
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-slate-600 font-semibold">New Total Legacy Amount (₹)</Label>
                                    <Input 
                                        type="number" 
                                        className="h-11 rounded-lg border-slate-200"
                                        value={newAmount}
                                        onChange={(e) => setNewAmount(e.target.value)}
                                    />
                                </div>
                                <Button type="submit" variant="outline" disabled={loading} className="w-full text-mahallu-dark border-slate-200 hover:bg-slate-50 h-11 rounded-xl text-sm font-bold shadow-sm mt-2">
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : 'Save Adustment'}
                                </Button>
                            </form>
                        </TabsContent>
                    </Tabs>
                </div>
            </DialogContent>
        </Dialog>
    );
}
