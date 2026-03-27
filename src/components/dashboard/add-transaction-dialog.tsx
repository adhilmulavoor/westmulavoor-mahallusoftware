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
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Receipt, Search, Loader2, CheckCircle2, Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const transactionSchema = z.object({
    family_id: z.string().min(1, 'Family selection is required'),
    amount: z.string().min(1, 'Amount is required'),
    category: z.enum(['Monthly Subscription', 'Project Sponsorship', 'General Hadya', 'Legacy Arrears']),
    sponsorship_id: z.string().optional(),
    notes: z.string().optional(),
    transaction_date: z.string().min(1, 'Date is required'),
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

interface AddTransactionDialogProps {
    children?: React.ReactNode;
    onSuccess: () => void;
    defaultCategory?: 'Monthly Subscription' | 'Project Sponsorship' | 'General Hadya' | 'Legacy Arrears';
    defaultFamilyId?: string;
    defaultSponsorshipId?: string;
    fixedCategory?: boolean;
}

export function AddTransactionDialog({ children, onSuccess, defaultCategory, defaultFamilyId, defaultSponsorshipId, fixedCategory }: AddTransactionDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [families, setFamilies] = useState<Family[]>([]);
    const [sponsorships, setSponsorships] = useState<any[]>([]);
    const [fetchingFamilies, setFetchingFamilies] = useState(false);
    const [familyPopoverOpen, setFamilyPopoverOpen] = useState(false);

    // Multi-month state
    const [unpaidMonths, setUnpaidMonths] = useState<{ id: string; month: string; monthNum: number; year: number }[]>([]);
    const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
    const [selectedFamilyData, setSelectedFamilyData] = useState<any>(null);

    const form = useForm<TransactionFormValues>({
        resolver: zodResolver(transactionSchema) as any,
        defaultValues: {
            family_id: defaultFamilyId || '',
            amount: '',
            category: defaultCategory || 'Monthly Subscription',
            sponsorship_id: defaultSponsorshipId || '',
            notes: '',
            transaction_date: new Date().toISOString().split('T')[0],
        },
    });

    const category = form.watch('category');
    const selectedFamilyId = form.watch('family_id');

    useEffect(() => {
        if (open) {
            fetchFamilies();
            if (defaultFamilyId) form.setValue('family_id', defaultFamilyId);
            if (defaultCategory) form.setValue('category', defaultCategory);
            if (defaultSponsorshipId) form.setValue('sponsorship_id', defaultSponsorshipId);
        } else {
            // Reset on close
            setSelectedMonths([]);
            setUnpaidMonths([]);
            setSelectedFamilyData(null);
            form.reset({
                family_id: defaultFamilyId || '',
                amount: '',
                category: defaultCategory || 'Monthly Subscription',
                sponsorship_id: defaultSponsorshipId || '',
                notes: '',
                transaction_date: new Date().toISOString().split('T')[0],
            });
        }
    }, [open, defaultFamilyId, defaultCategory, defaultSponsorshipId, form]);

    useEffect(() => {
        if (category === 'Project Sponsorship' && selectedFamilyId) {
            fetchSponsorships(selectedFamilyId);
        }
        if (category === 'Monthly Subscription' && selectedFamilyId) {
            fetchUnpaidMonths(selectedFamilyId);
        } else {
            setUnpaidMonths([]);
            setSelectedMonths([]);
        }
    }, [category, selectedFamilyId]);

    // Update form amount automatically based on selected months for subscriptions
    useEffect(() => {
        if (category === 'Monthly Subscription' && selectedFamilyData?.subscription_amount) {
            form.setValue('amount', (selectedMonths.length * Number(selectedFamilyData.subscription_amount)).toString());
        }
    }, [selectedMonths, category, selectedFamilyData, form]);

    const fetchFamilies = async () => {
        setFetchingFamilies(true);
        const { data, error } = await supabase
            .from('families')
            .select('*');
        if (!error && data) {
            // Sort numerically by family_id
            const sorted = data.sort((a, b) =>
                (a.family_id || '').localeCompare(b.family_id || '', undefined, { numeric: true, sensitivity: 'base' })
            );
            setFamilies(sorted);
        }
        setFetchingFamilies(false);
    };

    const fetchSponsorships = async (familyId: string) => {
        const { data, error } = await supabase
            .from('sponsorships')
            .select('*')
            .eq('family_id', familyId);
        
        if (!error && data) {
            // Sort by status (non-completed first) then by name
            const sorted = data.sort((a, b) => {
                if (a.status !== 'Completed' && b.status === 'Completed') return -1;
                if (a.status === 'Completed' && b.status !== 'Completed') return 1;
                return a.project_name.localeCompare(b.project_name);
            });
            setSponsorships(sorted);
        }
    };

    const fetchUnpaidMonths = async (familyId: string) => {
        const { data: family } = await supabase.from('families').select('*').eq('id', familyId).single();
        if (!family) return;
        setSelectedFamilyData(family);

        const { data: txs } = await supabase.from('transactions')
            .select('payment_month, payment_year')
            .eq('family_id', familyId)
            .eq('category', 'Monthly Subscription');

        if (!family.subscription_start_date) return;

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
        setSelectedMonths([]);
    };

    const toggleMonth = (id: string) => {
        setSelectedMonths(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);
    };

    const selectedSponsorship = sponsorships.find(s => s.id === form.watch('sponsorship_id'));

    // Update amount when sponsorship is selected
    useEffect(() => {
        if (category === 'Project Sponsorship' && selectedSponsorship) {
            const remaining = Number(selectedSponsorship.total_amount) - Number(selectedSponsorship.paid_amount);
            if (remaining > 0) {
                form.setValue('amount', remaining.toString());
            }
        }
    }, [selectedSponsorship, category, form]);

    const onSubmit = async (values: TransactionFormValues) => {
        setLoading(true);

        if (values.category === 'Monthly Subscription') {
            if (selectedMonths.length === 0) {
                alert("Please select at least one unpaid month.");
                setLoading(false);
                return;
            }

            const totalAmount = parseFloat(values.amount);
            const amountPerMonth = totalAmount / selectedMonths.length;

            const inserts = selectedMonths.map(monthId => {
                const [year, month] = monthId.split('-');
                return {
                    family_id: values.family_id,
                    amount: amountPerMonth,
                    category: 'Monthly Subscription',
                    transaction_date: values.transaction_date,
                    notes: values.notes,
                    payment_month: parseInt(month),
                    payment_year: parseInt(year)
                };
            });

            const { error } = await supabase.from('transactions').insert(inserts);
            handleResult(error);
        } else {
            const insertData: any = {
                ...values,
                amount: parseFloat(values.amount),
                payment_month: null,
                payment_year: null,
            };

            if (values.category !== 'Project Sponsorship') {
                delete insertData.sponsorship_id;
            } else if (values.sponsorship_id) {
                 // Handle Sponsorship Automation
                 const amount = parseFloat(values.amount);
                 const { data: currentSponsorship, error: fetchErr } = await supabase
                     .from('sponsorships')
                     .select('paid_amount, total_amount')
                     .eq('id', values.sponsorship_id)
                     .single();

                 if (!fetchErr && currentSponsorship) {
                     const newPaid = Number(currentSponsorship.paid_amount) + amount;
                     const newStatus = newPaid >= Number(currentSponsorship.total_amount) ? 'Completed' : 'Partial';
                     
                     await supabase
                         .from('sponsorships')
                         .update({ paid_amount: newPaid, status: newStatus })
                         .eq('id', values.sponsorship_id);
                 }
            }

            const { error } = await supabase.from('transactions').insert([insertData]);
            handleResult(error);
        }
    };

    const handleResult = (error: any) => {
        if (error) {
            console.error('Error adding transaction:', error.message);
            alert(`Error adding transaction: ${error.message}`);
        } else {
            onSuccess();
            // Don't reset to empty strings if we have defaults
            form.reset({
                family_id: defaultFamilyId || '',
                amount: '',
                category: defaultCategory || 'Monthly Subscription',
                sponsorship_id: defaultSponsorshipId || '',
                notes: '',
                transaction_date: new Date().toISOString().split('T')[0],
            });
            setSelectedMonths([]);
            setOpen(false);
        }
        setLoading(false);
    };

    const selectedFamily = families.find(f => f.id === selectedFamilyId);

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
                            {/* Family Searchable Combobox */}
                            <FormField
                                control={form.control}
                                name="family_id"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel className="text-slate-600 font-semibold">House / Family</FormLabel>
                                        <Popover open={familyPopoverOpen} onOpenChange={setFamilyPopoverOpen}>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        className={cn(
                                                            "w-full h-11 justify-between rounded-lg border-slate-200 font-normal",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                        disabled={fetchingFamilies}
                                                    >
                                                        {selectedFamily
                                                            ? <span><span className="text-xs text-slate-400 font-mono mr-2">{selectedFamily.family_id}</span>{selectedFamily.house_name}</span>
                                                            : (fetchingFamilies ? "Loading families..." : "Search by ID or name...")}
                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[436px] p-0 rounded-xl shadow-premium border-slate-100" align="start">
                                                <Command>
                                                    <CommandInput placeholder="Search by family ID or name..." className="h-11" />
                                                    <CommandList className="max-h-64 scrollbar-hide">
                                                        <CommandEmpty>No family found.</CommandEmpty>
                                                        <CommandGroup>
                                                            {families.map((f) => (
                                                                <CommandItem
                                                                    key={f.id}
                                                                    value={`${f.family_id} ${f.house_name}`}
                                                                    onSelect={() => {
                                                                        field.onChange(f.id);
                                                                        setFamilyPopoverOpen(false);
                                                                    }}
                                                                    className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-slate-50"
                                                                >
                                                                    <Check
                                                                        className={cn(
                                                                            "h-4 w-4 shrink-0 text-mahallu-primary",
                                                                            field.value === f.id ? "opacity-100" : "opacity-0"
                                                                        )}
                                                                    />
                                                                    <span className="inline-flex items-center justify-center min-w-[2.5rem] h-6 px-1.5 rounded bg-slate-100 text-xs font-mono font-bold text-slate-500">
                                                                        {f.family_id}
                                                                    </span>
                                                                    <span className="text-sm text-slate-800 font-medium">{f.house_name}</span>
                                                                </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="category"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-600 font-semibold">Category</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={fixedCategory}>
                                            <FormControl>
                                                <SelectTrigger className={`h-11 rounded-lg border-slate-200 ${fixedCategory ? 'bg-slate-50 opacity-100 font-medium' : ''}`}>
                                                    <SelectValue placeholder="Select category" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="rounded-xl border-slate-100 shadow-premium">
                                                <SelectItem value="Monthly Subscription">മാസവരി</SelectItem>
                                                <SelectItem value="Project Sponsorship">Project Sponsorship</SelectItem>
                                                <SelectItem value="General Hadya">General Hadya (Donation)</SelectItem>
                                                <SelectItem value="Legacy Arrears">Legacy Arrears Payment</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {category === 'Monthly Subscription' && selectedFamilyId && (
                                <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                    <FormLabel className="text-slate-600 font-semibold flex justify-between">
                                        <span>കുടിശ്ശിക മാസങ്ങൾ തിരഞ്ഞെടുക</span>
                                        <span className="text-xs text-mahallu-primary font-bold">
                                            {selectedMonths.length} selected
                                        </span>
                                    </FormLabel>

                                    {unpaidMonths.length > 0 ? (
                                        <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-1 scrollbar-hide">
                                            {unpaidMonths.map(m => {
                                                const isSelected = selectedMonths.includes(m.id);
                                                return (
                                                    <button
                                                        type="button"
                                                        key={m.id}
                                                        onClick={() => toggleMonth(m.id)}
                                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${isSelected
                                                                ? 'bg-mahallu-primary text-white border-mahallu-primary shadow-md'
                                                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-mahallu-primary/50'
                                                            }`}
                                                    >
                                                        {m.month} {m.year}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    ) : (
                                        <div className="p-4 bg-emerald-50 text-emerald-600 rounded-xl text-sm font-medium border border-emerald-100 flex items-center gap-2">
                                            <CheckCircle2 className="h-4 w-4" /> എല്ലാ മാസത്തെയും മാസവരി അടച്ചു കഴിഞ്ഞു!
                                        </div>
                                    )}
                                </div>
                            )}

                            {category === 'Project Sponsorship' && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                                    <FormField
                                        control={form.control}
                                        name="sponsorship_id"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-slate-600 font-semibold text-xs uppercase tracking-wider">Target Project Commitment</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="h-11 rounded-lg border-slate-200 bg-slate-50/30">
                                                            <SelectValue placeholder={sponsorships.length > 0 ? "Select sponsorship" : "No active sponsorships found"} />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent className="rounded-xl border-slate-100 shadow-premium max-h-[250px]">
                                                        {sponsorships.map((s) => (
                                                            <SelectItem key={s.id} value={s.id} className="py-2.5">
                                                                <div className="flex flex-col">
                                                                    <span className="font-semibold">{s.project_name}</span>
                                                                    <span className="text-[10px] text-slate-400">
                                                                        {s.status} • Total ₹{s.total_amount}
                                                                    </span>
                                                                </div>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {selectedSponsorship && (
                                        <div className="grid grid-cols-3 gap-2 p-3.5 rounded-xl bg-slate-50 border border-slate-100 shadow-inner">
                                            <div className="flex flex-col">
                                                <span className="text-[9px] uppercase font-bold text-slate-400">Total</span>
                                                <span className="font-bold text-sm text-slate-700">₹{selectedSponsorship.total_amount}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[9px] uppercase font-bold text-slate-400">Paid So Far</span>
                                                <span className="font-bold text-sm text-mahallu-primary">₹{selectedSponsorship.paid_amount}</span>
                                            </div>
                                            <div className="flex flex-col border-l border-slate-200 pl-3">
                                                <span className="text-[9px] uppercase font-bold text-orange-500">Balance</span>
                                                <span className="font-black text-sm text-rose-600">₹{Number(selectedSponsorship.total_amount) - Number(selectedSponsorship.paid_amount)}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="amount"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-slate-600 font-semibold">ആകെ അടച്ച തുക (₹)</FormLabel>
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
                                    ) : 'Record Transaction'}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </div>
            </DialogContent>
        </Dialog >
    );
}
