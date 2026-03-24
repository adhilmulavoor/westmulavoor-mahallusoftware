'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { PublicNotice } from '@/types/database';
import {
    Search,
    Plus,
    Megaphone,
    Clock,
    Edit,
    Trash2,
    Loader2,
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
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function NoticesPage() {
    const [notices, setNotices] = useState<PublicNotice[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingNotice, setEditingNotice] = useState<PublicNotice | null>(null);

    // Form states
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState<'General' | 'Event' | 'Urgent' | 'Information'>('General');
    const [content, setContent] = useState('');
    const [isActive, setIsActive] = useState(true);

    const fetchNotices = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('public_notices')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setNotices(data || []);
        } catch (error: any) {
            console.error('Error fetching notices:', error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotices();
    }, []);

    const resetForm = () => {
        setTitle('');
        setCategory('General');
        setContent('');
        setIsActive(true);
        setEditingNotice(null);
    };

    const handleEdit = (notice: PublicNotice) => {
        setEditingNotice(notice);
        setTitle(notice.title);
        setCategory(notice.category);
        setContent(notice.content);
        setIsActive(notice.is_active);
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const noticeData = {
                title,
                category,
                content,
                is_active: isActive,
                updated_at: new Date().toISOString(),
            };

            if (editingNotice) {
                const { error } = await supabase
                    .from('public_notices')
                    .update(noticeData)
                    .eq('id', editingNotice.id);
                if (error) throw error;
                alert('Notice updated successfully');
            } else {
                const { error } = await supabase
                    .from('public_notices')
                    .insert([noticeData]);
                if (error) throw error;
                alert('Notice created successfully');
            }

            setIsDialogOpen(false);
            resetForm();
            fetchNotices();
        } catch (error: any) {
            alert('Error: ' + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this notice?')) return;

        try {
            const { error } = await supabase
                .from('public_notices')
                .delete()
                .eq('id', id);

            if (error) throw error;
            alert('Notice deleted successfully');
            fetchNotices();
        } catch (error: any) {
            alert('Error: ' + error.message);
        }
    };

    const toggleStatus = async (notice: PublicNotice) => {
        try {
            const { error } = await supabase
                .from('public_notices')
                .update({ is_active: !notice.is_active })
                .eq('id', notice.id);

            if (error) throw error;
            fetchNotices();
        } catch (error: any) {
            alert('Error: ' + error.message);
        }
    };

    const filteredNotices = notices.filter(n =>
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="text-3xl font-bold tracking-tight text-mahallu-dark">Public Announcements</h2>
                    <p className="text-muted-foreground">Manage notices and news displayed on the public landing page.</p>
                </div>
                <Button
                    onClick={() => { resetForm(); setIsDialogOpen(true); }}
                    className="bg-mahallu-primary hover:bg-mahallu-dark text-white rounded-xl h-11 px-6 shadow-sm flex items-center gap-2"
                >
                    <Plus className="h-4 w-4" />
                    New Announcement
                </Button>
            </div>

            {/* Content Area */}
            <div className="card-premium overflow-hidden">
                <div className="p-6 border-b bg-slate-50/50 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search notices..."
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
                                <TableHead className="font-bold py-5 pl-8 text-mahallu-dark">Status</TableHead>
                                <TableHead className="font-bold py-5 text-mahallu-dark">Announcement</TableHead>
                                <TableHead className="font-bold py-5 text-mahallu-dark">Category</TableHead>
                                <TableHead className="font-bold py-5 text-mahallu-dark">Date</TableHead>
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
                            ) : filteredNotices.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-64 text-center text-muted-foreground">
                                        No announcements found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredNotices.map((notice) => (
                                    <TableRow key={notice.id} className="hover:bg-slate-50/50 border-slate-50 transition-colors">
                                        <TableCell className="py-5 pl-8">
                                            <button onClick={() => toggleStatus(notice)} className="focus:outline-none">
                                                {notice.is_active ? (
                                                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none px-3 py-1 flex items-center gap-1.5 cursor-pointer">
                                                        <Eye className="h-3 w-3" /> Active
                                                    </Badge>
                                                ) : (
                                                    <Badge className="bg-slate-100 text-slate-500 hover:bg-slate-200 border-none px-3 py-1 flex items-center gap-1.5 cursor-pointer">
                                                        <EyeOff className="h-3 w-3" /> Hidden
                                                    </Badge>
                                                )}
                                            </button>
                                        </TableCell>
                                        <TableCell className="py-5">
                                            <div className="flex flex-col max-w-md">
                                                <span className="font-bold text-mahallu-dark">{notice.title}</span>
                                                <span className="text-xs text-slate-500 line-clamp-1">{notice.content}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-5">
                                            <Badge variant="outline" className={`
                                                px-2.5 py-0.5 font-bold uppercase text-[10px] tracking-wider
                                                ${notice.category === 'Urgent' ? 'border-rose-200 text-rose-600 bg-rose-50' :
                                                    notice.category === 'Event' ? 'border-blue-200 text-blue-600 bg-blue-50' :
                                                        'border-emerald-200 text-mahallu-primary bg-emerald-50'}
                                            `}>
                                                {notice.category}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="py-5 text-slate-500 text-sm">
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-3.5 w-3.5" />
                                                {new Date(notice.created_at).toLocaleDateString()}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right py-5 pr-8">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button size="icon" variant="ghost" onClick={() => handleEdit(notice)} className="h-9 w-9 text-slate-400 hover:text-mahallu-primary">
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button size="icon" variant="ghost" onClick={() => handleDelete(notice.id)} className="h-9 w-9 text-slate-400 hover:text-rose-500">
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

            {/* Announcement Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[600px] rounded-3xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                            <Megaphone className="h-6 w-6 text-mahallu-primary" />
                            {editingNotice ? 'Edit Announcement' : 'New Announcement'}
                        </DialogTitle>
                        <DialogDescription>
                            Create or update notices that will be displayed on the public homepage.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                        <div className="grid gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="title" className="font-bold">Title</Label>
                                <Input
                                    id="title"
                                    placeholder="e.g. Eid Prayers Information"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="h-11 rounded-xl"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="category" className="font-bold">Category</Label>
                                    <Select
                                        value={category}
                                        onValueChange={(v: any) => setCategory(v)}
                                    >
                                        <SelectTrigger className="h-11 rounded-xl">
                                            <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="General">General</SelectItem>
                                            <SelectItem value="Event">Event</SelectItem>
                                            <SelectItem value="Urgent">Urgent</SelectItem>
                                            <SelectItem value="Information">Information</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="status" className="font-bold">Public Status</Label>
                                    <Select
                                        value={isActive ? 'true' : 'false'}
                                        onValueChange={(v) => setIsActive(v === 'true')}
                                    >
                                        <SelectTrigger className="h-11 rounded-xl">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="true">Published (Visible)</SelectItem>
                                            <SelectItem value="false">Draft (Hidden)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="content" className="font-bold">Content</Label>
                                <Textarea
                                    id="content"
                                    placeholder="Enter the detailed announcement text..."
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    className="min-h-[150px] rounded-2xl resize-none"
                                    required
                                />
                            </div>
                        </div>

                        <DialogFooter className="pt-4 gap-2 sm:gap-0">
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-xl h-11 px-6">
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="bg-mahallu-primary hover:bg-mahallu-dark text-white rounded-xl h-11 px-8 shadow-premium shadow-mahallu-primary/20"
                            >
                                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                {editingNotice ? 'Update Announcement' : 'Post Announcement'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
