'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Certificate, Member } from '@/types/database';
import {
    Search,
    Plus,
    FileBadge,
    Calendar,
    Filter,
    Download,
    Loader2,
    FileText,
    User,
    ChevronRight,
    SearchX
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
import { IssueCertificateDialog } from '@/components/dashboard/issue-certificate-dialog';
import { generateCertificatePDF } from '@/lib/pdf-service';

interface CertificateWithMember extends Certificate {
    members: Member;
}

export default function CertificatesPage() {
    const [certificates, setCertificates] = useState<CertificateWithMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchCertificates = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('certificates')
                .select(`
                    *,
                    members (*)
                `)
                .order('issue_date', { ascending: false });

            if (error) throw error;
            setCertificates(data || []);
        } catch (error: any) {
            console.error('Error fetching certificates:', error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCertificates();
    }, []);

    const filteredCertificates = certificates.filter(c =>
        c.members?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.certificate_id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="text-3xl font-bold tracking-tight text-mahallu-dark">Certificate Registry</h2>
                    <p className="text-muted-foreground">Manage and issue official community documents and records.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="rounded-xl h-11 px-4 border-slate-200">
                        <Download className="h-4 w-4 mr-2" />
                        Export Registry
                    </Button>
                    <IssueCertificateDialog onSuccess={fetchCertificates}>
                        <Button className="bg-mahallu-primary hover:bg-mahallu-dark text-white rounded-xl h-11 px-6 shadow-sm flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            Issue Certificate
                        </Button>
                    </IssueCertificateDialog>
                </div>
            </div>

            {/* Banner / Stats Area (optional but looks good for premium feel) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {['Marriage', 'Death', 'NOC', 'Membership'].map((type) => (
                    <div key={type} className="card-premium p-4 flex items-center gap-4 hover:border-mahallu-primary/20 transition-all cursor-default">
                        <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-mahallu-dark/60">
                            <FileBadge className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase">{type}</p>
                            <p className="text-xl font-bold text-mahallu-dark">
                                {certificates.filter(c => c.type === type).length}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Registry Table */}
            <div className="card-premium overflow-hidden">
                <div className="p-6 border-b bg-slate-50/50 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Find by member name or certificate ID..."
                            className="pl-10 h-11 rounded-xl bg-white border-slate-200 focus:ring-mahallu-primary/20"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="rounded-lg h-9">
                            <Filter className="h-4 w-4 mr-2" />
                            Filter Records
                        </Button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow className="hover:bg-transparent border-slate-100">
                                <TableHead className="w-[180px] font-bold py-5 pl-8 text-mahallu-dark">Certificate ID</TableHead>
                                <TableHead className="font-bold py-5 text-mahallu-dark">Member Name</TableHead>
                                <TableHead className="font-bold py-5 text-mahallu-dark">Type</TableHead>
                                <TableHead className="font-bold py-5 text-mahallu-dark">Issue Date</TableHead>
                                <TableHead className="text-right py-5 pr-8 font-bold text-mahallu-dark">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-64 text-center">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <Loader2 className="h-8 w-8 animate-spin text-mahallu-primary" />
                                            <p className="text-sm text-muted-foreground">Loading certificate registry...</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredCertificates.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-64 text-center">
                                        <div className="flex flex-col items-center justify-center gap-4">
                                            <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                                <SearchX className="h-8 w-8" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="font-semibold text-mahallu-dark text-lg">No certificates found</p>
                                                <p className="text-sm text-muted-foreground">Issue your first official document above.</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredCertificates.map((cert) => (
                                    <TableRow key={cert.id} className="group hover:bg-mahallu-light/30 transition-colors border-slate-50">
                                        <TableCell className="font-mono text-xs font-bold py-4 pl-8 text-slate-500 uppercase tracking-tighter">
                                            {cert.certificate_id}
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                                    <User className="h-4 w-4" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-mahallu-dark">{cert.members?.name || 'Unknown Member'}</span>
                                                    <span className="text-xs text-muted-foreground">{cert.members?.member_id}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <Badge
                                                variant="outline"
                                                className={`rounded-lg px-2.5 py-0.5 font-medium text-xs ${cert.type === 'Marriage' ? 'bg-pink-50 text-pink-700 border-pink-100' :
                                                    cert.type === 'Death' ? 'bg-slate-50 text-slate-700 border-slate-200' :
                                                        cert.type === 'NOC' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                            'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                    }`}
                                            >
                                                {cert.type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="py-4 text-slate-500">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-3.5 w-3.5" />
                                                {new Date(cert.issue_date).toLocaleDateString()}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right py-4 pr-8">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-9 gap-2 rounded-lg hover:bg-mahallu-primary hover:text-white transition-colors"
                                                onClick={() => generateCertificatePDF(cert, cert.members)}
                                            >
                                                <FileText className="h-4 w-4" />
                                                Print Certificate
                                                <ChevronRight className="h-4 w-4 ml-1 opacity-50" />
                                            </Button>
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
