'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Receipt, Search, Loader2 } from 'lucide-react';

const transactionSchema = z.object({
    family_id: z.string().min(1, 'Family selection is required'),
    amount: z.string().min(1, 'Amount is required'),
    category: z.enum(['Monthly Subscription', 'Donation', 'Zakat', 'Construction', 'Other', 'Sponsorship']),
    sponsorship_id: z.string().optional(),
    notes: z.string().optional(),
    transaction_date: z.string().min(1, 'Date is required'),
    payment_month: z.string().optional(),
    payment_year: z.string().optional(),
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

interface AddTransactionDialogProps {
    children?: React.ReactNode;
    onSuccess: () => void;
}

export function AddTransactionDialog({ children, onSuccess }: AddTransactionDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [families, setFamilies] = useState<Family[]>([]);
    const [sponsorships, setSponsorships] = useState<any[]>([]);
    const [fetchingFamilies, setFetchingFamilies] = useState(false);

    const form = useForm<TransactionFormValues>({
        resolver: zodResolver(transactionSchema),
        defaultValues: {
            family_id: '',
            amount: '',
            category: 'Monthly Subscription',
            notes: '',
            transaction_date: new Date().toISOString().split('T')[0],
            payment_month: (new Date().getMonth() + 1).toString(),
            payment_year: new Date().getFullYear().toString(),
        },
    });

    const category = form.watch('category');
    const selectedFamily = form.watch('family_id');

    useEffect(() => {
        if (open) {
            fetchFamilies();
        }
    }, [open]);

    useEffect(() => {
        if (category === 'Sponsorship' && selectedFamily) {
            fetchSponsorships(selectedFamily);
        }
    }, [category, selectedFamily]);

    const fetchFamilies = async () => {
        setFetchingFamilies(true);
        const { data, error } = await supabase
            .from('families')
            .select('*')
            .order('house_name');
        if (!error && data) setFamilies(data);
        setFetchingFamilies(false);
    };

    const fetchSponsorships = async (familyId: string) => {
        const { data, error } = await supabase
            .from('sponsorships')
            .select('*')
            .eq('family_id', familyId)
            .neq('status', 'Completed');
        if (!error && data) setSponsorships(data);
    };

    const onSubmit = async (values: TransactionFormValues) => {
        setLoading(true);
        const insertData: any = {
            ...values,
            amount: parseFloat(values.amount),
            payment_month: values.category === 'Monthly Subscription' ? parseInt(values.payment_month || '0') : null,
            payment_year: values.category === 'Monthly Subscription' ? parseInt(values.payment_year || '0') : null,
        };

        if (values.category !== 'Sponsorship') {
            delete insertData.sponsorship_id;
        }

        const { error } = await supabase
            .from('transactions')
            .insert([insertData]);

        if (error) {
            console.error('Error adding transaction:', error.message);
            alert(`Error adding transaction: ${error.message}`);
        } else {
            onSuccess();
            form.reset();
            setOpen(false);
        }
        setLoading(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {children && <DialogTrigger asChild>{children}</DialogTrigger>}
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-premium-hover rounded-2xl">
                <div className="bg-mahallu-dark p-8 text-white relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 opacity-10">
                        <Receipt size={120} />
                    </div>
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold tracking-tight">Record Payment</DialogTitle>
                        <DialogDescription className="text-mahallu-light/70 text-base mt-1">
                            Generate a new receipt and record the transaction.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="p-8 bg-white max-h-[70vh] overflow-y-auto scrollbar-hide">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                            <FormField
                                control={form.control}
                                name="family_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-600 font-semibold">House / Family</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="h-11 rounded-lg border-slate-200">
                                                    <SelectValue placeholder={fetchingFamilies ? "Loading families..." : "Select family"} />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="rounded-xl border-slate-100 shadow-premium">
                                                {families.map((family) => (
                                                    <SelectItem key={family.id} value={family.id}>
                                                        {family.house_name} ({family.family_id})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="amount"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-slate-600 font-semibold">Amount (₹)</FormLabel>
                                            <FormControl>
                                                <Input type="number" placeholder="500" className="h-11 rounded-lg border-slate-200" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="transaction_date"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-slate-600 font-semibold">Date</FormLabel>
                                            <FormControl>
                                                <Input type="date" className="h-11 rounded-lg border-slate-200" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="category"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-600 font-semibold">Category</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="h-11 rounded-lg border-slate-200">
                                                    <SelectValue placeholder="Select category" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="rounded-xl border-slate-100 shadow-premium">
                                                <SelectItem value="Monthly Subscription">Monthly Subscription (Masappadi)</SelectItem>
                                                <SelectItem value="Donation">General Donation</SelectItem>
                                                <SelectItem value="Zakat">Zakat</SelectItem>
                                                <SelectItem value="Sponsorship">Sponsorship Payment</SelectItem>
                                                <SelectItem value="Construction">Construction Fund</SelectItem>
                                                <SelectItem value="Other">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {category === 'Monthly Subscription' && (
                                <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                                    <FormField
                                        control={form.control}
                                        name="payment_month"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-slate-600 font-semibold">For Month</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="h-11 rounded-lg border-slate-200">
                                                            <SelectValue placeholder="Select month" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent className="rounded-xl border-slate-100 shadow-premium">
                                                        {[
                                                            'January', 'February', 'March', 'April', 'May', 'June',
                                                            'July', 'August', 'September', 'October', 'November', 'December'
                                                        ].map((month, i) => (
                                                            <SelectItem key={month} value={(i + 1).toString()}>{month}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="payment_year"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-slate-600 font-semibold">For Year</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="h-11 rounded-lg border-slate-200">
                                                            <SelectValue placeholder="Select year" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent className="rounded-xl border-slate-100 shadow-premium">
                                                        {[2024, 2025, 2026, 2027].map((year) => (
                                                            <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            )}

                            {category === 'Sponsorship' && (
                                <FormField
                                    control={form.control}
                                    name="sponsorship_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-slate-600 font-semibold">Select Project Sponsorship</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="h-11 rounded-lg border-slate-200">
                                                        <SelectValue placeholder={sponsorships.length > 0 ? "Select sponsorship" : "No active sponsorships"} />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="rounded-xl border-slate-100 shadow-premium">
                                                    {sponsorships.map((s) => (
                                                        <SelectItem key={s.id} value={s.id}>
                                                            {s.project_name} (₹{s.total_amount - s.paid_amount} remaining)
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}

                            <FormField
                                control={form.control}
                                name="notes"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-600 font-semibold">Notes (Optional)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Additional details..." className="h-11 rounded-lg border-slate-200" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="pt-2">
                                <Button type="submit" disabled={loading} className="w-full bg-mahallu-primary hover:bg-mahallu-dark text-white h-12 rounded-xl text-base font-semibold shadow-md">
                                    {loading ? (
                                        <span className="flex items-center gap-2">
                                            <Loader2 className="h-4 w-4 animate-spin" /> Recording...
                                        </span>
                                    ) : 'Generate Receipt'}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </div>
            </DialogContent>
        </Dialog >
    );
}
