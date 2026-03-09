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
});

type SponsorshipFormValues = z.infer<typeof sponsorshipSchema>;

interface AddSponsorshipDialogProps {
    children?: React.ReactNode;
    onSuccess: () => void;
}

export function AddSponsorshipDialog({ children, onSuccess }: AddSponsorshipDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [families, setFamilies] = useState<Family[]>([]);

    const form = useForm<SponsorshipFormValues>({
        resolver: zodResolver(sponsorshipSchema),
        defaultValues: {
            family_id: '',
            project_name: '',
            total_amount: '',
        },
    });

    useEffect(() => {
        if (open) {
            fetchFamilies();
        }
    }, [open]);

    const fetchFamilies = async () => {
        const { data, error } = await supabase.from('families').select('*').order('house_name');
        if (!error && data) setFamilies(data);
    };

    const onSubmit = async (values: SponsorshipFormValues) => {
        setLoading(true);
        const { error } = await supabase
            .from('sponsorships')
            .insert([{
                ...values,
                total_amount: parseFloat(values.total_amount),
            }]);

        if (error) {
            alert(`Error: ${error.message}`);
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
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="h-11 rounded-lg">
                                                    <SelectValue placeholder="Select project" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="rounded-xl">
                                                <SelectItem value="Auditorium">Auditorium</SelectItem>
                                                <SelectItem value="Madrasa Hall">Madrasa Hall</SelectItem>
                                                <SelectItem value="Tile Work">Tile Work</SelectItem>
                                                <SelectItem value="Other">Other</SelectItem>
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
