'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Family, Member } from '@/types/database';
import {
    Search,
    Plus,
    MoreHorizontal,
    Eye,
    Edit,
    Trash2,
    Users,
    Home,
    Phone,
    MapPin,
    ChevronRight,
    Loader2
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { AddFamilyDialog } from '@/components/dashboard/add-family-dialog';
import { EditFamilyDialog } from '@/components/dashboard/edit-family-dialog';
import { FamilyMembersDialog } from '@/components/dashboard/family-members-dialog';
import { AddMemberDialog } from '@/components/dashboard/add-member-dialog';
import { BulkUploadDialog } from '@/components/dashboard/bulk-upload-dialog';
import { DeleteFamilyDialog } from '@/components/dashboard/delete-family-dialog';
import { HistoricalPaymentDialog } from '@/components/dashboard/historical-payment-dialog';
import { AddSponsorshipDialog } from '@/components/dashboard/add-sponsorship-dialog';
import { Upload, History, HandHeart } from 'lucide-react';

export default function DirectoryPage() {
    const [families, setFamilies] = useState<Family[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFamily, setSelectedFamily] = useState<Family | null>(null);
    const [isMembersOpen, setIsMembersOpen] = useState(false);
    const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isBulkOpen, setIsBulkOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isHistoricalOpen, setIsHistoricalOpen] = useState(false);
    const [isAddSponsorshipOpen, setIsAddSponsorshipOpen] = useState(false);

    const fetchFamilies = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('families')
                .select('*')
                .order('family_id', { ascending: true });

            if (error) throw error;
            
            const sortedData = (data || []).sort((a, b) => 
                (a.family_id || '').localeCompare(b.family_id || '', undefined, { numeric: true, sensitivity: 'base' })
            );
            setFamilies(sortedData);
        } catch (error: any) {
            console.error('Error fetching families:', error.message || error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFamilies();
    }, []);

    const filteredFamilies = families.filter(f =>
        f.house_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.family_id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleViewMembers = (family: Family) => {
        setSelectedFamily(family);
        setIsMembersOpen(true);
    };

    const handleAddMember = (family: Family) => {
        setSelectedFamily(family);
        setIsAddMemberOpen(true);
    };

    const handleEditDetails = (family: Family) => {
        setSelectedFamily(family);
        setIsEditOpen(true);
    };

    const handleDeleteFamily = (family: Family) => {
        setSelectedFamily(family);
        setIsDeleteOpen(true);
    };

    const handleHistoricalPayments = (family: Family) => {
        setSelectedFamily(family);
        setIsHistoricalOpen(true);
    };

    const handleAddSponsorship = (family: Family) => {
        setSelectedFamily(family);
        setIsAddSponsorshipOpen(true);
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="text-3xl font-bold tracking-tight text-mahallu-dark">Family Directory</h2>
                    <p className="text-muted-foreground">Manage and view households in the Mahallu community.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        className="rounded-xl h-11 px-4 border-slate-200 text-mahallu-dark hover:bg-mahallu-light hover:border-mahallu-primary/30"
                        onClick={() => setIsBulkOpen(true)}
                    >
                        <Upload className="h-4 w-4 mr-2 text-mahallu-primary" />
                        Upload CSV
                    </Button>
                    <AddFamilyDialog onSuccess={fetchFamilies}>
                        <Button className="bg-mahallu-primary hover:bg-mahallu-dark text-white rounded-xl h-11 px-6 shadow-sm flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            Add New Family
                        </Button>
                    </AddFamilyDialog>
                </div>
            </div>

            <div className="card-premium overflow-hidden">
                <div className="p-6 border-b bg-slate-50/50 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search house name or ID..."
                            className="pl-10 h-11 rounded-xl bg-white border-slate-200 focus:ring-mahallu-primary/20"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="font-medium text-mahallu-dark">{filteredFamilies.length}</span> families found
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow className="hover:bg-transparent border-slate-100">
                                <TableHead className="w-[150px] font-bold py-5 pl-8 text-mahallu-dark">Family ID</TableHead>
                                <TableHead className="font-bold py-5 text-mahallu-dark">House Name</TableHead>
                                <TableHead className="font-bold py-5 text-mahallu-dark">Address</TableHead>
                                <TableHead className="font-bold py-5 text-mahallu-dark">Contact</TableHead>
                                <TableHead className="text-right py-5 pr-8 font-bold text-mahallu-dark">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-64 text-center">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <Loader2 className="h-8 w-8 animate-spin text-mahallu-primary" />
                                            <p className="text-sm text-muted-foreground">Loading family records...</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredFamilies.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-64 text-center">
                                        <div className="flex flex-col items-center justify-center gap-4">
                                            <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                                <Home className="h-8 w-8" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="font-semibold text-mahallu-dark text-lg">No families found</p>
                                                <p className="text-sm text-muted-foreground">Try adjusting your search or add a new family.</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredFamilies.map((family) => (
                                    <TableRow
                                        key={family.id}
                                        className="group hover:bg-mahallu-light/30 transition-colors border-slate-50"
                                    >
                                        <TableCell className="font-bold py-4 pl-8">
                                            <Badge variant="outline" className="rounded-lg px-2.5 py-0.5 border-mahallu-primary/20 bg-mahallu-light/50 text-mahallu-primary font-mono text-xs">
                                                {family.family_id}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-semibold text-mahallu-dark py-4">
                                            {family.house_name}
                                        </TableCell>
                                        <TableCell className="text-slate-500 py-4 max-w-xs truncate">
                                            <div className="flex items-center gap-2">
                                                <MapPin className="h-3 w-3 flex-shrink-0 text-slate-400" />
                                                <span className="truncate">{family.address}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-slate-500 py-4">
                                            {family.contact_number ? (
                                                <div className="flex items-center gap-2">
                                                    <Phone className="h-3 w-3 flex-shrink-0 text-slate-400" />
                                                    <span>{family.contact_number}</span>
                                                </div>
                                            ) : '-'}
                                        </TableCell>
                                        <TableCell className="text-right py-4 pr-8" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-9 w-9 rounded-lg hover:bg-mahallu-light hover:text-mahallu-primary"
                                                    onClick={() => handleViewMembers(family)}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-48 rounded-xl p-1 shadow-premium border-slate-100">
                                                        <DropdownMenuItem onClick={() => handleAddMember(family)} className="rounded-lg gap-2 cursor-pointer">
                                                            <Plus className="h-4 w-4" /> Add Member
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleEditDetails(family)} className="rounded-lg gap-2 cursor-pointer">
                                                            <Edit className="h-4 w-4" /> Edit Details
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleAddSponsorship(family)} className="rounded-lg gap-2 cursor-pointer text-blue-600 focus:text-blue-700">
                                                            <HandHeart className="h-4 w-4" /> Add Sponsorship
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleHistoricalPayments(family)} className="rounded-lg gap-2 cursor-pointer text-emerald-600 focus:text-emerald-700">
                                                            <History className="h-4 w-4" /> Historical Payments
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleDeleteFamily(family)} className="rounded-lg gap-2 cursor-pointer text-destructive focus:text-destructive">
                                                            <Trash2 className="h-4 w-4" /> Delete Family
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                                <div className="ml-2">
                                                    <ChevronRight className="h-4 w-4 text-slate-300" />
                                                </div>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {selectedFamily && (
                <>
                    <FamilyMembersDialog
                        family={selectedFamily}
                        open={isMembersOpen}
                        onOpenChange={setIsMembersOpen}
                        onAddMember={() => setIsAddMemberOpen(true)}
                    />
                    <AddMemberDialog
                        family={selectedFamily}
                        open={isAddMemberOpen}
                        onOpenChange={setIsAddMemberOpen}
                        onSuccess={() => {
                            setIsAddMemberOpen(false);
                            setIsMembersOpen(true);
                        }}
                    />
                    <EditFamilyDialog
                        family={selectedFamily}
                        open={isEditOpen}
                        onOpenChange={setIsEditOpen}
                        onSuccess={() => {
                            fetchFamilies();
                            setIsEditOpen(false);
                        }}
                    />
                    <DeleteFamilyDialog
                        family={selectedFamily}
                        open={isDeleteOpen}
                        onOpenChange={setIsDeleteOpen}
                        onSuccess={() => {
                            fetchFamilies();
                            setIsDeleteOpen(false);
                        }}
                    />
                    <HistoricalPaymentDialog
                        family={selectedFamily}
                        open={isHistoricalOpen}
                        onOpenChange={setIsHistoricalOpen}
                        onSuccess={() => { }}
                    />
                    {isAddSponsorshipOpen && (
                        <div onClick={(e) => e.stopPropagation()}>
                            <AddSponsorshipDialog
                                onSuccess={() => setIsAddSponsorshipOpen(false)}
                                defaultFamilyId={selectedFamily.id}
                            >
                                <Dialog open={isAddSponsorshipOpen} onOpenChange={setIsAddSponsorshipOpen}>
                                    <DialogTrigger asChild><div /></DialogTrigger>
                                </Dialog>
                            </AddSponsorshipDialog>
                        </div>
                    )}
                </>
            )}

            {isBulkOpen && (
                <BulkUploadDialog
                    onSuccess={() => { fetchFamilies(); }}
                    onClose={() => setIsBulkOpen(false)}
                />
            )}
        </div>
    );
}
