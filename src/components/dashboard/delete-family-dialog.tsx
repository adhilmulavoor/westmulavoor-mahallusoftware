'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Family } from '@/types/database';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, Loader2 } from 'lucide-react';

interface DeleteFamilyDialogProps {
    family: Family | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function DeleteFamilyDialog({ family, open, onOpenChange, onSuccess }: DeleteFamilyDialogProps) {
    const [loading, setLoading] = useState(false);

    const handleDelete = async () => {
        if (!family) return;
        setLoading(true);

        try {
            // Sequential deletion to avoid foreign key constraints if CASCADE is not configured
            await supabase.from('transactions').delete().eq('family_id', family.id);
            await supabase.from('sponsorships').delete().eq('family_id', family.id);
            await supabase.from('members').delete().eq('family_id', family.id);

            const { error } = await supabase.from('families').delete().eq('id', family.id);
            if (error) throw error;

            onSuccess();
        } catch (error: any) {
            console.error('Error deleting family:', error);
            alert(`Error deleting family: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    if (!family) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader className="flex flex-col items-center gap-2 sm:text-center mt-4">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-100">
                        <AlertCircle className="h-8 w-8 text-rose-600" />
                    </div>
                    <DialogTitle className="text-xl">Delete Family</DialogTitle>
                    <DialogDescription className="text-center font-medium">
                        Are you sure you want to permanently delete <span className="text-slate-800 font-bold">{family.house_name}</span>?
                        <br /><br />
                        <span className="text-rose-600 font-bold bg-rose-50 px-2 py-1 rounded inline-block">
                            This will also delete all members, transactions, and sponsorships associated with this family. This action cannot be undone.
                        </span>
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="mt-6 flex gap-2 sm:justify-center">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={loading}
                        className="bg-rose-600 hover:bg-rose-700 font-bold"
                    >
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Delete Permanently
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
