'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/lib/supabase';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
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
import { Checkbox } from '@/components/ui/checkbox';
import { UserPlus } from 'lucide-react';

const memberSchema = z.object({
    member_id: z.string().min(2, 'Unique ID is required'),
    name: z.string().min(1, 'Name is required'),
    relation_to_head: z.string().min(1, 'Relation is required'),
    dob: z.string().optional(),
    blood_group: z.string().optional(),
    occupation: z.string().optional(),
    education: z.string().optional(),
    is_head: z.boolean().default(false),
});

type MemberFormValues = z.infer<typeof memberSchema>;

interface AddMemberDialogProps {
    family: { id: string; house_name: string } | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function AddMemberDialog({ family, open, onOpenChange, onSuccess }: AddMemberDialogProps) {
    const [loading, setLoading] = useState(false);

    const form = useForm<MemberFormValues>({
        resolver: zodResolver(memberSchema),
        defaultValues: {
            member_id: '',
            name: '',
            relation_to_head: 'Child',
            dob: '',
            blood_group: '',
            occupation: '',
            education: '',
            is_head: false,
        },
    });

    const onSubmit = async (values: MemberFormValues) => {
        if (!family?.id) return;
        setLoading(true);

        // Normalize empty strings to null for optional database fields
        const payload = {
            ...values,
            family_id: family.id,
            dob: values.dob || null,
            blood_group: values.blood_group || null,
            occupation: values.occupation || null,
            education: values.education || null,
        };

        const { error } = await supabase
            .from('members')
            .insert([payload]);

        if (error) {
            console.error('Error adding member:', error.message || error);
            alert(`Error adding member: ${error.message || 'Duplicate ID or database error'}`);
        } else {
            onSuccess();
            form.reset();
            onOpenChange(false);
        }
        setLoading(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-premium-hover rounded-2xl">
                <div className="bg-mahallu-dark p-8 text-white relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 opacity-10">
                        <UserPlus size={120} />
                    </div>
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold tracking-tight">Add Family Member</DialogTitle>
                        <DialogDescription className="text-mahallu-light/70 text-base flex items-center gap-2 mt-1">
                            Registering for: {family?.house_name || 'Selected Family'}
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="p-8 bg-white max-h-[70vh] overflow-y-auto scrollbar-hide">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="member_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-slate-600 font-semibold">Member ID</FormLabel>
                                            <FormControl>
                                                <Input placeholder="M-101" className="h-11 rounded-lg border-slate-200" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-slate-600 font-semibold">Full Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Member Name" className="h-11 rounded-lg border-slate-200" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="relation_to_head"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-600 font-semibold">Relation to Head</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="h-11 rounded-lg border-slate-200">
                                                    <SelectValue placeholder="Select relation" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="rounded-xl border-slate-100 shadow-premium">
                                                <SelectItem value="Head">Head of Family</SelectItem>
                                                <SelectItem value="Spouse">Spouse</SelectItem>
                                                <SelectItem value="Child">Child</SelectItem>
                                                <SelectItem value="Parent">Parent</SelectItem>
                                                <SelectItem value="Sibling">Sibling</SelectItem>
                                                <SelectItem value="Other">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="dob"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-slate-600 font-semibold">Date of Birth</FormLabel>
                                            <FormControl>
                                                <Input type="date" className="h-11 rounded-lg border-slate-200" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="blood_group"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-slate-600 font-semibold">Blood Group</FormLabel>
                                            <FormControl>
                                                <Input placeholder="O+ve" className="h-11 rounded-lg border-slate-200" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="is_head"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-xl border border-slate-100 bg-slate-50/50 p-4 transition-colors hover:border-mahallu-primary/20">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                                className="h-5 w-5 rounded border-slate-300 data-[state=checked]:bg-mahallu-primary"
                                            />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel className="text-sm font-semibold text-mahallu-dark cursor-pointer">
                                                Is this person the Head of Family?
                                            </FormLabel>
                                            <p className="text-xs text-muted-foreground">This helps in organizing hierarchy and certificates.</p>
                                        </div>
                                    </FormItem>
                                )}
                            />

                            <div className="pt-2">
                                <Button type="submit" disabled={loading} className="w-full bg-mahallu-primary hover:bg-mahallu-dark text-white h-12 rounded-xl text-base font-semibold shadow-md">
                                    {loading ? 'Adding Member...' : 'Register Member'}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
