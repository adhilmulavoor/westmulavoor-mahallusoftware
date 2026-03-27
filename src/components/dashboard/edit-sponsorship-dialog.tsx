'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/lib/supabase';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Pencil, Loader2, AlertCircle, Trash2, History, IndianRupee } from 'lucide-react';
import { toast } from 'sonner';
import { Sponsorship, Transaction } from '@/types/database';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

const sponsorshipSchema = z.object({
    project_name: z.string().min(2, 'Project name is required'),
    total_amount: z.string().min(1, 'Total amount is required'),
    paid_amount: z.string().min(1, 'Paid amount is required'),
});

type SponsorshipFormValues = z.infer<typeof sponsorshipSchema>;

interface EditSponsorshipDialogProps {
    sponsorship: Sponsorship;
    onSuccess: () => void;
}

export function EditSponsorshipDialog({ sponsorship, onSuccess }: EditSponsorshipDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [fetchingTx, setFetchingTx] = useState(false);

    const form = useForm<SponsorshipFormValues>({
        resolver: zodResolver(sponsorshipSchema),
        defaultValues: {
            project_name: sponsorship.project_name,
            total_amount: sponsorship.total_amount.toString(),
            paid_amount: sponsorship.paid_amount.toString(),
        },
    });

    useEffect(() => {
        if (open) {
            fetchTransactions();
            form.reset({
                project_name: sponsorship.project_name,
                total_amount: sponsorship.total_amount.toString(),
                paid_amount: sponsorship.paid_amount.toString(),
            });
        }
    }, [open, sponsorship]);

    const fetchTransactions = async () => {
        setFetchingTx(true);
        try {
            const { data, error } = await supabase
                .from('transactions')
                .select('*')
                .eq('sponsorship_id', sponsorship.id)
                .order('transaction_date', { ascending: false });
            
            if (error) throw error;
            setTransactions(data || []);
        } catch (error) {
            console.error('Error fetching transactions:', error);
        } finally {
            setFetchingTx(false);
        }
    };

    const handleDeleteTransaction = async (tx: Transaction) => {
        if (!confirm(`Are you sure you want to delete this payment of ₹${tx.amount}? This will also reduce the Total Paid balance of the sponsorship.`)) return;

        try {
            setLoading(true);
            // 1. Delete transaction
            const { error: txErr } = await supabase
                .from('transactions')
                .delete()
                .eq('id', tx.id);
            
            if (txErr) throw txErr;

            // 2. Update sponsorship paid_amount
            const newPaid = Math.max(0, Number(sponsorship.paid_amount) - Number(tx.amount));
            const newStatus = newPaid >= Number(sponsorship.total_amount) ? 'Completed' : (newPaid > 0 ? 'Partial' : 'Pending');

            const { error: spErr } = await supabase
                .from('sponsorships')
                .update({ 
                    paid_amount: newPaid,
                    status: newStatus
                })
                .eq('id', sponsorship.id);
            
            if (spErr) throw spErr;

            toast.success('Payment deleted and balance updated');
            fetchTransactions();
            onSuccess(); // Refresh the main list
        } catch (error: any) {
            toast.error(error.message || 'Failed to delete transaction');
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = async (values: SponsorshipFormValues) => {
        setLoading(true);
        try {
            const total = parseFloat(values.total_amount);
            const paid = parseFloat(values.paid_amount);
            
            let status: 'Pending' | 'Partial' | 'Completed' = 'Pending';
            if (paid >= total) {
                status = 'Completed';
            } else if (paid > 0) {
                status = 'Partial';
            }

            const { error } = await supabase
                .from('sponsorships')
                .update({
                    project_name: values.project_name,
                    total_amount: total,
                    paid_amount: paid,
                    status: status
                })
                .eq('id', sponsorship.id);

            if (error) throw error;

            toast.success('Sponsorship updated successfully');
            setOpen(false);
            onSuccess();
        } catch (error: any) {
            toast.error(error.message || 'Failed to update sponsorship');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-mahallu-primary">
                    <Pencil className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] rounded-[24px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                        <History className="h-5 w-5 text-mahallu-primary" />
                        Edit Sponsorship & History
                    </DialogTitle>
                    <DialogDescription>
                        Correct general details or remove mistaken payments below.
                    </DialogDescription>
                </DialogHeader>

                <Alert className="bg-amber-50 border-amber-200 text-amber-800 rounded-xl">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <AlertTitle className="text-sm font-bold">Important</AlertTitle>
                    <AlertDescription className="text-xs">
                        Manual adjustments to "Total Paid" do not change transaction history. To fix a specific entry, delete it from the Payment History section below.
                    </AlertDescription>
                </Alert>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
                        <div className="grid grid-cols-1 gap-4">
                            <FormField
                                control={form.control}
                                name="project_name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-600 font-semibold text-xs tracking-wider uppercase">Project Name</FormLabel>
                                        <FormControl>
                                            <Input {...field} className="h-11 rounded-lg border-slate-200" />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="total_amount"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-slate-600 font-semibold text-xs tracking-wider uppercase">Total Pledge (₹)</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} className="h-11 rounded-lg border-slate-200" />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="paid_amount"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-slate-600 font-semibold text-xs tracking-wider uppercase">Manual Paid Reset (₹)</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} className="h-11 rounded-lg border-slate-200" />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end pt-2">
                            <Button
                                type="submit"
                                disabled={loading}
                                className="bg-mahallu-primary hover:bg-mahallu-dark text-white rounded-xl px-6 h-10 shadow-lg text-sm"
                            >
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Update Summary
                            </Button>
                        </div>
                    </form>
                </Form>

                <Separator className="my-6" />

                <div className="space-y-4">
                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <IndianRupee className="h-4 w-4 text-mahallu-primary" />
                        Linked Payment History
                    </h4>
                    
                    {fetchingTx ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
                        </div>
                    ) : transactions.length === 0 ? (
                        <p className="text-xs text-center text-slate-400 py-8 bg-slate-50 rounded-xl border border-dashed">
                            No transaction records linked to this sponsorship.
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {transactions.map((tx) => (
                                <div key={tx.id} className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/50 border border-slate-100 group hover:border-blue-200 transition-colors">
                                    <div>
                                        <p className="font-bold text-sm text-slate-700">₹{Number(tx.amount).toLocaleString()}</p>
                                        <p className="text-[10px] text-slate-400 font-medium">{new Date(tx.transaction_date).toLocaleDateString()} • Ref: #{tx.receipt_number}</p>
                                        {tx.notes && <p className="text-[10px] text-slate-400 italic mt-0.5">{tx.notes}</p>}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        disabled={loading}
                                        onClick={() => handleDeleteTransaction(tx)}
                                        className="h-8 w-8 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <DialogFooter className="mt-8 border-t pt-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setOpen(false)}
                        className="rounded-xl w-full"
                    >
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
