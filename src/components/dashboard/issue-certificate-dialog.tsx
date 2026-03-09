'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/lib/supabase';
import { Member } from '@/types/database';
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
import { FileBadge, Search, Loader2 } from 'lucide-react';

const certificateSchema = z.object({
    certificate_id: z.string().min(1, 'Certificate ID is required'),
    member_id: z.string().min(1, 'Member selection is required'),
    type: z.enum(['Marriage', 'Death', 'NOC', 'Membership']),
    issue_date: z.string().min(1, 'Issue date is required'),
    purpose: z.string().optional(),
});

type CertificateFormValues = z.infer<typeof certificateSchema>;

interface IssueCertificateDialogProps {
    children?: React.ReactNode;
    onSuccess: () => void;
}

export function IssueCertificateDialog({ children, onSuccess }: IssueCertificateDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [members, setMembers] = useState<Member[]>([]);
    const [fetchingMembers, setFetchingMembers] = useState(false);

    const form = useForm<CertificateFormValues>({
        resolver: zodResolver(certificateSchema),
        defaultValues: {
            certificate_id: `CERT-${Math.floor(1000 + Math.random() * 9000)}-${new Date().getFullYear()}`,
            member_id: '',
            type: 'Membership',
            issue_date: new Date().toISOString().split('T')[0],
            purpose: '',
        },
    });

    useEffect(() => {
        if (open) {
            fetchMembers();
        }
    }, [open]);

    const fetchMembers = async () => {
        setFetchingMembers(true);
        const { data, error } = await supabase
            .from('members')
            .select('*')
            .order('name');
        if (!error && data) setMembers(data);
        setFetchingMembers(false);
    };

    const onSubmit = async (values: CertificateFormValues) => {
        setLoading(true);
        const { error } = await supabase
            .from('certificates')
            .insert([{
                certificate_id: values.certificate_id,
                member_id: values.member_id,
                type: values.type,
                issue_date: values.issue_date,
                data: { purpose: values.purpose },
            }]);

        if (error) {
            console.error('Error issuing certificate:', error.message);
            alert(`Error issuing certificate: ${error.message}`);
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
                        <FileBadge size={120} />
                    </div>
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold tracking-tight">Issue Certificate</DialogTitle>
                        <DialogDescription className="text-mahallu-light/70 text-base mt-1">
                            Generate and register a new community certificate.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="p-8 bg-white max-h-[70vh] overflow-y-auto scrollbar-hide">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                            <FormField
                                control={form.control}
                                name="certificate_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-600 font-semibold">Certificate ID</FormLabel>
                                        <FormControl>
                                            <Input placeholder="CERT-1234-2024" className="h-11 rounded-lg border-slate-200" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="member_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-600 font-semibold">Community Member</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="h-11 rounded-lg border-slate-200">
                                                    <SelectValue placeholder={fetchingMembers ? "Loading members..." : "Select member"} />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="rounded-xl border-slate-100 shadow-premium">
                                                {members.map((member) => (
                                                    <SelectItem key={member.id} value={member.id}>
                                                        {member.name} ({member.member_id})
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
                                    name="type"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-slate-600 font-semibold">Type</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="h-11 rounded-lg border-slate-200">
                                                        <SelectValue placeholder="Select type" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="rounded-xl border-slate-100 shadow-premium">
                                                    <SelectItem value="Membership">Membership</SelectItem>
                                                    <SelectItem value="Marriage">Marriage</SelectItem>
                                                    <SelectItem value="Death">Death</SelectItem>
                                                    <SelectItem value="NOC">NOC</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="issue_date"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-slate-600 font-semibold">Issue Date</FormLabel>
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
                                name="purpose"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-600 font-semibold">Purpose (Optional)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g., Higher Education, Passport" className="h-11 rounded-lg border-slate-200" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="pt-2">
                                <Button type="submit" disabled={loading} className="w-full bg-mahallu-primary hover:bg-mahallu-dark text-white h-12 rounded-xl text-base font-semibold shadow-md">
                                    {loading ? (
                                        <span className="flex items-center gap-2">
                                            <Loader2 className="h-4 w-4 animate-spin" /> Issuing...
                                        </span>
                                    ) : 'Issue Certificate'}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
