'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Family, Transaction, Sponsorship } from '@/types/database';
import {
    Search,
    CreditCard,
    AlertCircle,
    Calendar,
    ArrowUpRight,
    Loader2,
    Users,
    TrendingUp,
    IndianRupee,
    Briefcase
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AddSponsorshipDialog } from '@/components/dashboard/add-sponsorship-dialog';
import { Plus } from 'lucide-react';

export default function PendingPage() {
    const [sponsorships, setSponsorships] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchData = async () => {
        try {
            setLoading(true);

            // Fetch Sponsorships
            const { data: sponsorData, error: sponsorError } = await supabase
                .from('sponsorships')
                .select('*, families(*)');

            if (sponsorError) throw sponsorError;
            setSponsorships(sponsorData || []);

        } catch (error: any) {
            console.error('Error fetching pending data:', error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredSponsorships = sponsorships.filter(s =>
        s.families?.house_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.project_name?.toLowerCase().includes(searchQuery.toLowerCase())
    ).filter(s => s.total_amount - s.paid_amount > 0).sort((a, b) => 
        (a.families?.family_id || '').localeCompare(b.families?.family_id || '', undefined, { numeric: true, sensitivity: 'base' })
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="text-3xl font-bold tracking-tight text-mahallu-dark">Project Arrears</h2>
                    <p className="text-muted-foreground">Monitor outstanding commitments for specific projects and sponsorships.</p>
                </div>
                <div className="flex items-center gap-3">
                    <AddSponsorshipDialog onSuccess={fetchData}>
                        <Button className="bg-mahallu-dark hover:bg-black text-white rounded-xl h-11 px-6 shadow-premium transition-all hover:scale-[1.02]">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Sponsorship
                        </Button>
                    </AddSponsorshipDialog>
                    <Button variant="outline" className="rounded-xl h-11 px-4 border-slate-200" onClick={fetchData}>
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                </div>
            </div>

            <div className="space-y-6">
                {/* Sponsoring Summary Card */}
                <div className="card-premium p-8 border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50/30 to-transparent">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600">
                            <Briefcase className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider">Total Project Arrears</p>
                            <h3 className="text-3xl font-bold text-slate-900">₹{sponsorships.filter(s => s.total_amount - s.paid_amount > 0).reduce((sum, s) => sum + (s.total_amount - s.paid_amount), 0).toLocaleString()}</h3>
                        </div>
                    </div>
                </div>

                {/* Sponsorships Table */}
                <div className="card-premium overflow-hidden">
                    <div className="p-6 border-b bg-slate-50/50">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by family or project..."
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
                                    <TableHead className="font-bold py-5 pl-8 text-mahallu-dark">Project / Commitment</TableHead>
                                    <TableHead className="font-bold py-5 text-mahallu-dark">House / Family</TableHead>
                                    <TableHead className="font-bold py-5 text-mahallu-dark text-center">Total</TableHead>
                                    <TableHead className="font-bold py-5 text-mahallu-dark text-center">Remaining</TableHead>
                                    <TableHead className="text-right py-5 pr-8 font-bold text-mahallu-dark">Progress</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-64 text-center">
                                            <Loader2 className="h-8 w-8 animate-spin mx-auto text-mahallu-primary" />
                                        </TableCell>
                                    </TableRow>
                                ) : filteredSponsorships.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-64 text-center text-muted-foreground">
                                            No outstanding sponsorships found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredSponsorships.map((s) => (
                                        <TableRow key={s.id} className="hover:bg-slate-50/50 border-slate-50 transition-colors">
                                            <TableCell className="py-5 pl-8">
                                                <span className="font-bold text-mahallu-dark">{s.project_name}</span>
                                            </TableCell>
                                            <TableCell className="py-5">
                                                <div className="flex flex-col">
                                                    <span className="font-semibold">{s.families.house_name}</span>
                                                    <span className="text-xs text-slate-500">{s.families.family_id}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-5 text-center font-medium">
                                                ₹{Number(s.total_amount).toLocaleString()}
                                            </TableCell>
                                            <TableCell className="py-5 text-center">
                                                <span className="font-black text-blue-600">
                                                    ₹{(s.total_amount - s.paid_amount).toLocaleString()}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right py-5 pr-8">
                                                <div className="flex items-center justify-end gap-2">
                                                    <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-blue-500"
                                                            style={{ width: `${(s.paid_amount / s.total_amount) * 100}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-500">
                                                        {Math.round((s.paid_amount / s.total_amount) * 100)}%
                                                    </span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>
        </div>
    );
}
