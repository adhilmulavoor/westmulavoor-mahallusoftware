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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Users } from 'lucide-react';

const familySchema = z.object({
    family_id: z.string().min(2, 'Unique ID is required (e.g., MAH-1001)'),
    house_name: z.string().min(1, 'House name is required'),
    address: z.string().min(5, 'Address is required'),
    contact_number: z.string().optional(),
    subscription_amount: z.coerce.number().min(0).default(100),
    legacy_arrears: z.coerce.number().min(0).default(0),
    subscription_start_date: z.string().default('2025-01-01'),
});

type FamilyFormValues = z.infer<typeof familySchema>;

interface AddFamilyDialogProps {
    children?: React.ReactNode;
    onSuccess: () => void;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function AddFamilyDialog({ children, onSuccess, open: externalOpen, onOpenChange: setExternalOpen }: AddFamilyDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const open = externalOpen ?? internalOpen;
    const onOpenChange = setExternalOpen ?? setInternalOpen;

    const form = useForm<FamilyFormValues>({
        resolver: zodResolver(familySchema) as any,
        defaultValues: {
            family_id: '',
            house_name: '',
            address: '',
            contact_number: '',
            subscription_amount: 100,
            legacy_arrears: 0,
            subscription_start_date: '2025-01-01',
        },
    });

    const onSubmit = async (values: FamilyFormValues) => {
        setLoading(true);
        const { error } = await supabase
            .from('families')
            .insert([values]);

        if (error) {
            console.error('Error adding family:', error.message || error);
            alert(`Error adding family: ${error.message || 'Duplicate ID or database error'}`);
        } else {
            onSuccess();
            form.reset();
            onOpenChange(false);
        }
        setLoading(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {children && <DialogTrigger asChild>{children}</DialogTrigger>}
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-premium-hover rounded-2xl">
                <div className="bg-mahallu-dark p-8 text-white relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 opacity-10">
                        <Users size={120} />
                    </div>
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold tracking-tight">Add New Household</DialogTitle>
                        <DialogDescription className="text-mahallu-light/70 text-base">
                            Create a new family record in the Mahallu directory.
                        </DialogDescription>
                    </DialogHeader>
                </div>
                <div className="p-8 bg-white">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                            <FormField
                                control={form.control}
                                name="family_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Family Unique ID</FormLabel>
                                        <FormControl>
                                            <Input placeholder="MAH-1001" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="house_name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>House Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Green Villa" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="address"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Address</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Mahallu Street, Calicut" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="contact_number"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Contact Number</FormLabel>
                                        <FormControl>
                                            <Input placeholder="+91 98765 43210" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="subscription_amount"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Monthly Rate (₹)</FormLabel>
                                            <FormControl>
                                                <Input type="number" placeholder="100" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="legacy_arrears"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Legacy Arrears (Pre-2025)</FormLabel>
                                            <FormControl>
                                                <Input type="number" placeholder="0" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <FormField
                                control={form.control}
                                name="subscription_start_date"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Subscription Start Date</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="pt-4">
                                <Button type="submit" disabled={loading} className="w-full bg-mahallu-primary hover:bg-mahallu-dark text-white h-12 rounded-xl text-base font-semibold transition-all shadow-md">
                                    {loading ? 'Saving Record...' : 'Register Family'}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
