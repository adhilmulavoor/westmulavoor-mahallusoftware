'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Sponsorship, SponsorshipProject, Family } from '@/types/database';
import {
    Plus,
    HandHeart,
    HandCoins,
    TrendingUp,
    MoreHorizontal,
    Edit,
    Trash2,
    CheckCircle2,
    Ban
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
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { AddTransactionDialog } from '@/components/dashboard/add-transaction-dialog';
import { AddSponsorshipDialog } from '@/components/dashboard/add-sponsorship-dialog';
import { EditSponsorshipDialog } from '@/components/dashboard/edit-sponsorship-dialog';

export default function SponsorshipsPage() {
    const [projects, setProjects] = useState<SponsorshipProject[]>([]);
    const [sponsorships, setSponsorships] = useState<(Sponsorship & { families: { house_name: string } })[]>([]);
    const [loading, setLoading] = useState(true);

    // New project modal state
    const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
    const [projectName, setProjectName] = useState('');
    const [projectDesc, setProjectDesc] = useState('');

    // Transaction modal state
    const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
    const [selectedFamilyId, setSelectedFamilyId] = useState<string>('');
    const [selectedSponsorshipId, setSelectedSponsorshipId] = useState<string>('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch projects
            const { data: projData, error: projErr } = await supabase
                .from('sponsorship_projects')
                .select('*')
                .order('created_at', { ascending: false });
            if (projErr) throw projErr;
            setProjects(projData || []);

            // Fetch pledges with family details (in case we need to show recent assigned)
            const { data: sponData, error: sponErr } = await supabase
                .from('sponsorships')
                .select('*, families(house_name, family_id)');
            if (sponErr) throw sponErr;
            const sortedSpon = (sponData as any || []).sort((a: any, b: any) => 
                (a.families?.family_id || '').localeCompare(b.families?.family_id || '', undefined, { numeric: true, sensitivity: 'base' })
            );
            setSponsorships(sortedSpon);
        } catch (error: any) {
            console.error('Error fetching sponsorships data:', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateProject = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { error } = await supabase.from('sponsorship_projects').insert([{
                name: projectName,
                description: projectDesc
            }]);
            if (error) throw error;
            setIsProjectModalOpen(false);
            setProjectName('');
            setProjectDesc('');
            fetchData();
        } catch (error: any) {
            alert('Failed to create project: ' + error.message);
        }
    };

    const toggleProjectStatus = async (project: SponsorshipProject) => {
        try {
            const { error } = await supabase
                .from('sponsorship_projects')
                .update({ is_active: !project.is_active })
                .eq('id', project.id);
            if (error) throw error;
            fetchData();
        } catch (error: any) {
            console.error('Failed to update project status:', error.message);
        }
    };

    const deleteProject = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete the project '${name}'? Assure no sponsorships are tied to it.`)) return;
        try {
            const { error } = await supabase.from('sponsorship_projects').delete().eq('id', id);
            if (error) throw error;
            fetchData();
        } catch (error: any) {
            alert(`Could not delete project: ${error.message} (Likely due to linked sponsorships)`);
        }
    };

    const handleCollectPayment = (sponsorship: any) => {
        setSelectedFamilyId(sponsorship.family_id);
        setSelectedSponsorshipId(sponsorship.id);
        setIsTransactionModalOpen(true);
    };

    // KPI Calculations
    const totalPledged = sponsorships.reduce((sum, s) => sum + Number(s.total_amount), 0);
    const totalCollected = sponsorships.reduce((sum, s) => sum + Number(s.paid_amount), 0);
    const totalPending = totalPledged - totalCollected;
    const activeProjectsCount = projects.filter(p => p.is_active).length;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="text-3xl font-bold tracking-tight text-mahallu-dark">Sponsorships</h2>
                    <p className="text-muted-foreground">Manage custom projects and track overall pledges and collections.</p>
                </div>
                <div className="flex items-center gap-3">
                    <AddSponsorshipDialog onSuccess={fetchData}>
                        <Button variant="outline" className="rounded-xl h-11 px-6 border-slate-200 bg-white hover:bg-slate-50 flex items-center gap-2 text-mahallu-dark shadow-sm">
                            <HandHeart className="h-4 w-4" />
                            Add Sponsorship
                        </Button>
                    </AddSponsorshipDialog>
                    <Dialog open={isProjectModalOpen} onOpenChange={setIsProjectModalOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-mahallu-primary hover:bg-mahallu-dark text-white rounded-xl h-11 px-6 shadow-sm flex items-center gap-2">
                                <Plus className="h-4 w-4" />
                                New Project
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[450px] p-0 border-none shadow-premium rounded-2xl overflow-hidden">
                            <div className="bg-mahallu-dark p-6 text-white">
                                <DialogHeader>
                                    <DialogTitle className="text-2xl font-bold">Add Project</DialogTitle>
                                    <DialogDescription className="text-mahallu-light/70 text-sm">
                                        Create a new sponsorship project for families to pledge to.
                                    </DialogDescription>
                                </DialogHeader>
                            </div>
                            <form onSubmit={handleCreateProject} className="p-6 bg-white space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">Project Name</label>
                                    <Input 
                                        required
                                        placeholder="e.g., Madrasa Hall Renovation" 
                                        className="h-11 rounded-lg"
                                        value={projectName}
                                        onChange={(e) => setProjectName(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">Description (Optional)</label>
                                    <Input 
                                        placeholder="Brief description..." 
                                        className="h-11 rounded-lg"
                                        value={projectDesc}
                                        onChange={(e) => setProjectDesc(e.target.value)}
                                    />
                                </div>
                                <Button type="submit" className="w-full bg-mahallu-primary hover:bg-mahallu-dark text-white h-11 rounded-xl font-bold mt-2">
                                    Create Project Record
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid gap-6 md:grid-cols-4">
                <Card className="border-slate-100 shadow-sm rounded-2xl overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 bg-slate-50 border-b border-slate-100">
                        <CardTitle className="text-sm font-bold text-slate-500 uppercase">Active Projects</CardTitle>
                        <HandHeart className="h-4 w-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="text-3xl font-black text-mahallu-dark">{activeProjectsCount}</div>
                    </CardContent>
                </Card>
                <Card className="border-slate-100 shadow-sm rounded-2xl overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 bg-emerald-50 border-b border-emerald-100">
                        <CardTitle className="text-sm font-bold text-emerald-700 uppercase">Total Pledged</CardTitle>
                        <TrendingUp className="h-4 w-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="text-3xl font-black text-emerald-700">₹{totalPledged.toLocaleString()}</div>
                    </CardContent>
                </Card>
                <Card className="border-slate-100 shadow-sm rounded-2xl overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 bg-blue-50 border-b border-blue-100">
                        <CardTitle className="text-sm font-bold text-blue-700 uppercase">Collected</CardTitle>
                        <HandCoins className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="text-3xl font-black text-blue-700">₹{totalCollected.toLocaleString()}</div>
                        <div className="text-sm text-blue-600/70 font-semibold">{totalPledged > 0 ? ((totalCollected/totalPledged)*100).toFixed(1) : 0}% Realized</div>
                    </CardContent>
                </Card>
                <Card className="border-slate-100 shadow-sm rounded-2xl overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 bg-amber-50 border-b border-amber-100">
                        <CardTitle className="text-sm font-bold text-amber-700 uppercase">Pending</CardTitle>
                        <TrendingUp className="h-4 w-4 text-amber-600 rotate-180" />
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="text-3xl font-black text-amber-700">₹{totalPending.toLocaleString()}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Projects Table */}
            <div className="card-premium overflow-hidden mt-8">
                <div className="p-6 border-b bg-slate-50/50 flex flex-col items-start justify-between">
                    <h3 className="text-lg font-bold text-mahallu-dark">Project Management</h3>
                    <p className="text-sm text-slate-500 mt-1">These projects will be available for families to pledge towards.</p>
                </div>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow className="hover:bg-transparent border-slate-100">
                                <TableHead className="w-[200px] font-bold py-5 pl-8 text-mahallu-dark">Project Name</TableHead>
                                <TableHead className="font-bold py-5 text-mahallu-dark">Description</TableHead>
                                <TableHead className="font-bold py-5 text-mahallu-dark">Status</TableHead>
                                <TableHead className="text-right py-5 pr-8 font-bold text-mahallu-dark">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading && projects.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-48 text-center text-slate-400">Loading projects...</TableCell>
                                </TableRow>
                            ) : projects.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-48 text-center text-slate-400">No custom projects created yet.</TableCell>
                                </TableRow>
                            ) : (
                                projects.map((p) => (
                                    <TableRow key={p.id} className="hover:bg-mahallu-light/30 transition-colors border-slate-50">
                                        <TableCell className="font-bold py-4 pl-8 text-slate-800">{p.name}</TableCell>
                                        <TableCell className="text-slate-500 py-4 max-w-sm truncate">{p.description || '-'}</TableCell>
                                        <TableCell className="py-4">
                                            {p.is_active ? 
                                                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none">Active</Badge> : 
                                                <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-200 border-none">Disabled</Badge>
                                            }
                                        </TableCell>
                                        <TableCell className="text-right py-4 pr-8">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-40 rounded-xl p-1 shadow-premium border-slate-100">
                                                    <DropdownMenuItem onClick={() => toggleProjectStatus(p)} className="rounded-lg gap-2 cursor-pointer">
                                                        {p.is_active ? <Ban className="h-4 w-4 text-amber-600"/> : <CheckCircle2 className="h-4 w-4 text-emerald-600"/> }
                                                        {p.is_active ? 'Disable' : 'Enable'}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => deleteProject(p.id, p.name)} className="rounded-lg gap-2 cursor-pointer text-destructive focus:text-destructive">
                                                        <Trash2 className="h-4 w-4" /> Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
            
            {/* Recent Pledges Table */}
            <div className="card-premium overflow-hidden mt-8">
                 <div className="p-6 border-b bg-slate-50/50 flex flex-col items-start justify-between">
                    <h3 className="text-lg font-bold text-mahallu-dark">Recent Pledges & Assignments</h3>
                    <p className="text-sm text-slate-500 mt-1">To add a new pledge for a family, go to the Directory and use the action menu on a household.</p>
                </div>
                <div className="overflow-x-auto">
                     <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow className="hover:bg-transparent border-slate-100">
                                <TableHead className="font-bold py-5 pl-8 text-mahallu-dark">Date Assigned</TableHead>
                                <TableHead className="font-bold py-5 text-mahallu-dark">Family</TableHead>
                                <TableHead className="font-bold py-5 text-mahallu-dark">Project</TableHead>
                                <TableHead className="font-bold py-5 text-right text-mahallu-dark">Financials</TableHead>
                                <TableHead className="font-bold py-5 pr-8 text-right text-mahallu-dark">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading && sponsorships.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-48 text-center text-slate-400">Loading assignments...</TableCell>
                                </TableRow>
                            ) : sponsorships.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-48 text-center text-slate-400">No pledges assigned yet.</TableCell>
                                </TableRow>
                            ) : (
                                sponsorships.map((s) => (
                                    <TableRow key={s.id} className="hover:bg-mahallu-light/30 transition-colors border-slate-50">
                                        <TableCell className="text-sm text-slate-500 py-4 pl-8">{new Date(s.created_at).toLocaleDateString()}</TableCell>
                                        <TableCell className="font-bold text-slate-800 py-4">{s.families?.house_name}</TableCell>
                                        <TableCell className="font-semibold text-mahallu-dark py-4">{s.project_name}</TableCell>
                                        <TableCell className="text-right py-4">
                                            <div className="flex flex-col items-end">
                                                <span className="font-bold text-slate-800">₹{Number(s.total_amount).toLocaleString()}</span>
                                                <span className="text-xs text-blue-600 bg-blue-50 px-2 rounded-full font-semibold">₹{Number(s.paid_amount).toLocaleString()} Paid</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right py-4 pr-8">
                                            <div className="flex items-center justify-end gap-2">
                                                {Number(s.paid_amount) < Number(s.total_amount) ? (
                                                    <AddTransactionDialog
                                                        onSuccess={fetchData}
                                                        defaultCategory="Project Sponsorship"
                                                        fixedCategory={true}
                                                        defaultFamilyId={s.family_id}
                                                        defaultSponsorshipId={s.id}
                                                    >
                                                        <Button 
                                                            variant="outline" 
                                                            size="sm" 
                                                            className="rounded-lg border-blue-200 text-blue-700 hover:bg-blue-50"
                                                        >
                                                            <HandCoins className="h-4 w-4 mr-2" />
                                                            Collect
                                                        </Button>
                                                    </AddTransactionDialog>
                                                ) : (
                                                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none">Completed</Badge>
                                                )}
                                                <EditSponsorshipDialog 
                                                    sponsorship={s} 
                                                    onSuccess={fetchData} 
                                                />
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
    );
}
