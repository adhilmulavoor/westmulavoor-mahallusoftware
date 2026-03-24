'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { CommitteeMember } from '@/types/database';
import {
    Search,
    Plus,
    User,
    ShieldCheck,
    Phone,
    Edit,
    Trash2,
    Loader2,
    GripVertical,
    Eye,
    EyeOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';

export default function CommitteePage() {
    const [members, setMembers] = useState<CommitteeMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingMember, setEditingMember] = useState<CommitteeMember | null>(null);

    // Form states
    const [name, setName] = useState('');
    const [designation, setDesignation] = useState('');
    const [contactNumber, setContactNumber] = useState('');
    const [displayOrder, setDisplayOrder] = useState(0);
    const [isActive, setIsActive] = useState(true);

    const fetchMembers = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('committee_members')
                .select('*')
                .order('display_order', { ascending: true });

            if (error) throw error;
            setMembers(data || []);
        } catch (error: any) {
            console.error('Error fetching committee members:', error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMembers();
    }, []);

    const resetForm = () => {
        setName('');
        setDesignation('');
        setContactNumber('');
        setDisplayOrder(members.length > 0 ? members[members.length - 1].display_order + 10 : 10);
        setIsActive(true);
        setEditingMember(null);
    };

    const handleEdit = (member: CommitteeMember) => {
        setEditingMember(member);
        setName(member.name);
        setDesignation(member.designation);
        setContactNumber(member.contact_number || '');
        setDisplayOrder(member.display_order);
        setIsActive(member.is_active);
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const memberData = {
                name,
                designation,
                contact_number: contactNumber || null,
                display_order: Number(displayOrder),
                is_active: isActive,
            };

            if (editingMember) {
                const { error } = await supabase
                    .from('committee_members')
                    .update(memberData)
                    .eq('id', editingMember.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('committee_members')
                    .insert([memberData]);
                if (error) throw error;
            }

            setIsDialogOpen(false);
            resetForm();
            fetchMembers();
        } catch (error: any) {
            alert('Error: ' + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to remove this committee member?')) return;

        try {
            const { error } = await supabase
                .from('committee_members')
                .delete()
                .eq('id', id);

            if (error) throw error;
            fetchMembers();
        } catch (error: any) {
            alert('Error: ' + error.message);
        }
    };

    const toggleStatus = async (member: CommitteeMember) => {
        try {
            const { error } = await supabase
                .from('committee_members')
                .update({ is_active: !member.is_active })
                .eq('id', member.id);

            if (error) throw error;
            fetchMembers();
        } catch (error: any) {
            alert('Error: ' + error.message);
        }
    };

    const filteredMembers = members.filter(m =>
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.designation.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="text-3xl font-bold tracking-tight text-mahallu-dark">Committee Management</h2>
                    <p className="text-muted-foreground">Manage the leadership team shown on the landing page.</p>
                </div>
                <Button
                    onClick={() => { resetForm(); setIsDialogOpen(true); }}
                    className="bg-mahallu-dark hover:bg-black text-white rounded-xl h-11 px-6 shadow-premium transition-all hover:scale-[1.02] flex items-center gap-2"
                >
                    <Plus className="h-4 w-4" />
                    Add Member
                </Button>
            </div>

            {/* Content Area */}
            <div className="card-premium overflow-hidden">
                <div className="p-6 border-b bg-slate-50/50 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name or position..."
                            className="pl-10 h-11 rounded-xl bg-white border-slate-200"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow className="hover:bg-transparent border-slate-100">
                                <TableHead className="w-[80px] text-center font-bold py-5 pl-8 text-mahallu-dark">Order</TableHead>
                                <TableHead className="font-bold py-5 text-mahallu-dark">Member</TableHead>
                                <TableHead className="font-bold py-5 text-mahallu-dark text-center">Contact</TableHead>
                                <TableHead className="font-bold py-5 text-mahallu-dark text-center">Status</TableHead>
                                <TableHead className="text-right py-5 pr-8 font-bold text-mahallu-dark">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-64 text-center">
                                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-mahallu-primary" />
                                    </TableCell>
                                </TableRow>
                            ) : filteredMembers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-64 text-center text-muted-foreground">
                                        No committee members found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredMembers.map((member) => (
                                    <TableRow key={member.id} className="hover:bg-slate-50/50 border-slate-50 transition-colors">
                                        <TableCell className="py-5 pl-8 text-center font-bold text-slate-400">
                                            {member.display_order}
                                        </TableCell>
                                        <TableCell className="py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 bg-mahallu-light rounded-xl flex items-center justify-center text-mahallu-primary">
                                                    <User className="h-5 w-5" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-mahallu-dark">{member.name}</span>
                                                    <span className="text-xs text-mahallu-primary font-bold uppercase tracking-wider">{member.designation}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-5 text-center">
                                            {member.contact_number ? (
                                                <div className="inline-flex items-center gap-2 text-slate-600 font-medium">
                                                    <Phone className="h-3.5 w-3.5" />
                                                    {member.contact_number}
                                                </div>
                                            ) : (
                                                <span className="text-slate-300">N/A</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="py-5 text-center">
                                            <button onClick={() => toggleStatus(member)} className="focus:outline-none">
                                                {member.is_active ? (
                                                    <Badge className="bg-emerald-100 text-emerald-700 border-none px-3 py-1 flex items-center gap-1.5 cursor-pointer hover:bg-emerald-200">
                                                        <Eye className="h-3 w-3" /> Active
                                                    </Badge>
                                                ) : (
                                                    <Badge className="bg-slate-100 text-slate-500 border-none px-3 py-1 flex items-center gap-1.5 cursor-pointer hover:bg-slate-200">
                                                        <EyeOff className="h-3 w-3" /> Hidden
                                                    </Badge>
                                                )}
                                            </button>
                                        </TableCell>
                                        <TableCell className="text-right py-5 pr-8">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button size="icon" variant="ghost" onClick={() => handleEdit(member)} className="h-9 w-9 text-slate-400 hover:text-mahallu-primary">
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button size="icon" variant="ghost" onClick={() => handleDelete(member.id)} className="h-9 w-9 text-slate-400 hover:text-rose-500">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Member Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[500px] rounded-3xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                            <ShieldCheck className="h-6 w-6 text-mahallu-primary" />
                            {editingMember ? 'Edit Member' : 'New Committee Member'}
                        </DialogTitle>
                        <DialogDescription>
                            Add or update membership details for the leadership team.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                        <div className="grid gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="font-bold">Full Name</Label>
                                <Input
                                    id="name"
                                    placeholder="e.g. Abdullah bin Ahmed"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="h-11 rounded-xl"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="designation" className="font-bold">Designation (Position)</Label>
                                <Input
                                    id="designation"
                                    placeholder="e.g. President / Secretary"
                                    value={designation}
                                    onChange={(e) => setDesignation(e.target.value)}
                                    className="h-11 rounded-xl"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="contactNumber" className="font-bold">Contact Number</Label>
                                    <Input
                                        id="contactNumber"
                                        placeholder="+91 0000 000000"
                                        value={contactNumber}
                                        onChange={(e) => setContactNumber(e.target.value)}
                                        className="h-11 rounded-xl"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="displayOrder" className="font-bold">Display Order</Label>
                                    <Input
                                        id="displayOrder"
                                        type="number"
                                        value={displayOrder}
                                        onChange={(e) => setDisplayOrder(Number(e.target.value))}
                                        className="h-11 rounded-xl"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="font-bold">Public Visiblity</Label>
                                <div className="flex gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <input
                                            type="radio"
                                            name="visibility"
                                            checked={isActive}
                                            onChange={() => setIsActive(true)}
                                            className="w-4 h-4 accent-mahallu-primary"
                                        />
                                        <span className="text-sm font-semibold group-hover:text-mahallu-primary transition-colors">Visible</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <input
                                            type="radio"
                                            name="visibility"
                                            checked={!isActive}
                                            onChange={() => setIsActive(false)}
                                            className="w-4 h-4 accent-mahallu-primary"
                                        />
                                        <span className="text-sm font-semibold group-hover:text-rose-500 transition-colors">Hidden</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-xl h-11 px-6">
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="bg-mahallu-dark hover:bg-black text-white rounded-xl h-11 px-8 shadow-premium"
                            >
                                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                {editingMember ? 'Save Changes' : 'Add Member'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
