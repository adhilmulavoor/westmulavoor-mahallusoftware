'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Member } from '@/types/database';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Plus, User, Trash2, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface FamilyMembersDialogProps {
    family: { id: string; house_name: string } | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onAddMember: () => void;
}

export function FamilyMembersDialog({ family, open, onOpenChange, onAddMember }: FamilyMembersDialogProps) {
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchMembers = useCallback(async () => {
        if (!family?.id) return;
        setLoading(true);
        const { data, error } = await supabase
            .from('members')
            .select('*')
            .eq('family_id', family.id)
            .order('is_head', { ascending: false });

        if (error) {
            console.error('Error fetching members:', error);
        } else {
            setMembers(data || []);
        }
        setLoading(false);
    }, [family?.id]);

    useEffect(() => {
        if (open && family?.id) {
            fetchMembers();
        }
    }, [open, family?.id, fetchMembers]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden border-none shadow-premium-hover rounded-2xl">
                <div className="bg-mahallu-dark p-8 text-white relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 opacity-10">
                        <Users size={120} />
                    </div>
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold tracking-tight">Family Members</DialogTitle>
                        <DialogDescription className="text-mahallu-light/70 text-base flex items-center gap-2 mt-1">
                            <User className="h-4 w-4" />
                            {family?.house_name || 'Residents List'}
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="p-8 space-y-6 bg-white min-h-[400px]">
                    <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-mahallu-light flex items-center justify-center text-mahallu-primary">
                                <Users className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Total Residents</p>
                                <p className="text-xl font-bold text-mahallu-dark">{members.length}</p>
                            </div>
                        </div>
                        <Button
                            onClick={onAddMember}
                            className="bg-mahallu-primary hover:bg-mahallu-dark text-white rounded-lg px-4 h-10 shadow-sm flex items-center gap-2"
                        >
                            <Plus className="h-4 w-4" /> Add Member
                        </Button>
                    </div>

                    <div className="rounded-xl border border-slate-100 overflow-hidden">
                        <Table>
                            <TableHeader className="bg-slate-50">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="py-4 pl-6">Name</TableHead>
                                    <TableHead className="py-4">Relation</TableHead>
                                    <TableHead className="hidden sm:table-cell py-4">Occupation</TableHead>
                                    <TableHead className="text-right py-4 pr-6">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-48 text-center">
                                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                                <div className="h-5 w-5 border-2 border-mahallu-primary border-t-transparent rounded-full animate-spin" />
                                                <p className="text-sm">Loading members...</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : members.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-48 text-center text-muted-foreground">
                                            <div className="flex flex-col items-center gap-2">
                                                <Users className="h-8 w-8 opacity-20" />
                                                <p>No members added yet.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    members.map((member) => (
                                        <TableRow key={member.id} className="group hover:bg-slate-50 transition-colors">
                                            <TableCell className="py-4 pl-6">
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-mahallu-dark">{member.name}</span>
                                                    {member.is_head && (
                                                        <Badge variant="outline" className="w-fit text-[10px] py-0 border-mahallu-primary/20 bg-mahallu-light text-mahallu-primary mt-0.5">
                                                            Family Head
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm text-slate-600">{member.relation_to_head || '-'}</TableCell>
                                            <TableCell className="hidden sm:table-cell text-sm text-slate-500">
                                                {member.occupation || '-'}
                                            </TableCell>
                                            <TableCell className="text-right py-4 pr-6">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-destructive hover:bg-destructive/5 rounded-lg">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
