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
import { Briefcase, Loader2 } from 'lucide-react';

const sponsorshipSchema = z.object({
    family_id: z.string().min(1, 'Family selection is required'),
    project_name: z.string().min(1, 'Project name is required'),
    total_amount: z.string().min(1, 'Total amount is required'),
    paid_amount: z.string().optional(),
});

type SponsorshipFormValues = z.infer<typeof sponsorshipSchema>;

interface AddSponsorshipDialogProps {
    children?: React.ReactNode;
    onSuccess: () => void;
    defaultFamilyId?: string;
}

export function AddSponsorshipDialog({ children, onSuccess, defaultFamilyId }: AddSponsorshipDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [families, setFamilies] = useState<Family[]>([]);
    const [projects, setProjects] = useState<any[]>([]);

    const form = useForm<SponsorshipFormValues>({
        resolver: zodResolver(sponsorshipSchema) as any,
        defaultValues: {
            family_id: defaultFamilyId || '',
            project_name: '',
            total_amount: '',
            paid_amount: '',
        },
    });

    useEffect(() => {
        if (open) {
            fetchFamilies();
            fetchProjects();
            if (defaultFamilyId) {
                form.setValue('family_id', defaultFamilyId);
            }
        }
    }, [open, defaultFamilyId, form]);

    const fetchFamilies = async () => {
        const { data, error } = await supabase.from('families').select('*').order('house_name');
        if (!error && data) setFamilies(data);
    };

    const fetchProjects = async () => {
        const { data, error } = await supabase.from('sponsorship_projects').select('*').eq('is_active', true).order('name');
        if (!error && data) setProjects(data);
    };

    const onSubmit = async (values: SponsorshipFormValues) => {
        setLoading(true);
        const total = parseFloat(values.total_amount);
        const paid = values.paid_amount ? parseFloat(values.paid_amount) : 0;
        
        let status = 'Pending';
        if (paid > 0 && paid < total) status = 'Partial';
        if (paid >= total) status = 'Completed';

        // 1. Insert Sponsorship
        const { data: spData, error: spError } = await supabase
            .from('sponsorships')
            .insert([{
                family_id: values.family_id,
                project_name: values.project_name,
                total_amount: total,
                paid_amount: paid,
                status: status
            }])
            .select()
            .single();

        if (spError) {
            alert(`Error creating sponsorship: ${spError.message}`);
            setLoading(false);
            return;
        }

        // 2. If historical amount is paid, insert transaction
        if (paid > 0 && spData) {
            const now = new Date().toISOString();
            const { error: txError } = await supabase
                .from('transactions')
                .insert([{
                    family_id: values.family_id,
                    amount: paid,
                    category: 'Sponsorship',
                    sponsorship_id: spData.id,
                    transaction_date: now.split('T')[0],
                    notes: 'Historical Record (Onboarding)'
                }]);
            
            if (txError) {
                console.error("Historical transaction error", txError);
                // We don't abort since sponsorship was created, but we could notify
            }
        }

        onSuccess();
        form.reset();
        setOpen(false);
        setLoading(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {children && <DialogTrigger asChild onClick={() => setOpen(true)}>{children}</DialogTrigger>}
            <DialogContent className="sm:max-w-[450px] p-0 border-none shadow-premium rounded-2xl overflow-hidden">
                <div className="bg-mahallu-dark p-8 text-white">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">New Sponsorship</DialogTitle>
                        <DialogDescription className="text-mahallu-light/70 text-base">
                            Record a commitment for a specific project.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="p-8 bg-white">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                            <FormField
                                control={form.control}
                                name="family_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-600 font-semibold">House / Family</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="h-11 rounded-lg">
                                                    <SelectValue placeholder="Select family" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="rounded-xl">
                                                {families.map((f) => (
                                                    <SelectItem key={f.id} value={f.id}>{f.house_name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="project_name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-600 font-semibold">Project (e.g., Auditorium, Madrasa)</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="h-11 rounded-lg">
                                                    <SelectValue placeholder="Select project" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="rounded-xl">
                                                {projects.map(p => (
                                                    <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
                                                ))}
                                                {projects.length === 0 && (
                                                    <SelectItem value="none" disabled>No active projects</SelectItem>
                                                )}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="total_amount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-600 font-semibold">Committed Amount (₹)</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="10000" className="h-11 rounded-lg" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="paid_amount"
                                render={({ field }) => (
                                    <FormItem className="pt-2 border-t border-slate-100">
                                        <div className="flex flex-col gap-1">
                                            <FormLabel className="text-slate-600 font-semibold flex items-center gap-2">
                                                Already Paid Amount (₹) <span className="text-xs font-normal text-slate-400 border border-slate-200 px-1.5 py-0.5 rounded bg-slate-50">Optional</span>
                                            </FormLabel>
                                            <p className="text-[13px] text-muted-foreground leading-tight">
                                                If this is a historical commitment that was partially or fully paid, enter the amount here.
                                            </p>
                                        </div>
                                        <FormControl>
                                            <Input type="number" placeholder="e.g. 5000" className="h-11 rounded-lg bg-emerald-50/50 border-emerald-100 placeholder:text-emerald-300 focus-visible:ring-emerald-500" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <Button type="submit" disabled={loading} className="w-full bg-mahallu-primary hover:bg-mahallu-dark text-white h-12 rounded-xl font-bold">
                                {loading ? <Loader2 className="animate-spin" /> : 'Record Commitment'}
                            </Button>
                        </form>
                    </Form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
