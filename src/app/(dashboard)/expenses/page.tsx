'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Expense } from '@/types/database';
import {
    Search,
    Plus,
    Receipt,
    Calendar,
    Edit,
    Trash2,
    Loader2,
    TrendingDown,
    Filter,
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
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function ExpensesPage() {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

    // Form states
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState<Expense['category']>('Utilities');
    const [description, setDescription] = useState('');
    const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);

    const fetchExpenses = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('expenses')
                .select('*')
                .order('expense_date', { ascending: false });

            if (error) throw error;
            setExpenses(data || []);
        } catch (error: any) {
            console.error('Error fetching expenses:', error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchExpenses();
    }, []);

    const resetForm = () => {
        setAmount('');
        setCategory('Utilities');
        setDescription('');
        setExpenseDate(new Date().toISOString().split('T')[0]);
        setEditingExpense(null);
    };

    const handleEdit = (expense: Expense) => {
        setEditingExpense(expense);
        setAmount(expense.amount.toString());
        setCategory(expense.category);
        setDescription(expense.description || '');
        setExpenseDate(expense.expense_date);
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const expenseData = {
                amount: parseFloat(amount),
                category,
                description: description || null,
                expense_date: expenseDate,
                updated_at: new Date().toISOString(),
            };

            if (editingExpense) {
                const { error } = await supabase
                    .from('expenses')
                    .update(expenseData)
                    .eq('id', editingExpense.id);
                if (error) throw error;
                alert('Expense updated successfully');
            } else {
                const { error } = await supabase
                    .from('expenses')
                    .insert([expenseData]);
                if (error) throw error;
                alert('Expense recorded successfully');
            }

            setIsDialogOpen(false);
            resetForm();
            fetchExpenses();
        } catch (error: any) {
            alert('Error: ' + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this expense record?')) return;

        try {
            const { error } = await supabase
                .from('expenses')
                .delete()
                .eq('id', id);

            if (error) throw error;
            alert('Expense deleted successfully');
            fetchExpenses();
        } catch (error: any) {
            alert('Error: ' + error.message);
        }
    };

    const filteredExpenses = expenses.filter(e =>
        e.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="text-3xl font-bold tracking-tight text-mahallu-dark">Expense Tracking</h2>
                    <p className="text-muted-foreground">Monitor and manage all outgoings and masjid expenses.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="hidden md:flex flex-col items-end mr-4">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Filtered</span>
                        <span className="text-xl font-bold text-rose-600">₹{totalExpenses.toLocaleString()}</span>
                    </div>
                    <Button
                        onClick={() => { resetForm(); setIsDialogOpen(true); }}
                        className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl h-11 px-6 shadow-premium transition-all hover:scale-[1.02] flex items-center gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        Record Expense
                    </Button>
                </div>
            </div>

            {/* Content Area */}
            <div className="card-premium overflow-hidden">
                <div className="p-6 border-b bg-slate-50/50 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by description or category..."
                            className="pl-10 h-11 rounded-xl bg-white border-slate-200"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-white border-slate-200 text-slate-500 px-3 py-1.5 h-11 flex items-center gap-2 rounded-xl font-medium">
                            <Filter className="h-4 w-4" />
                            All Categories
                        </Badge>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow className="hover:bg-transparent border-slate-100">
                                <TableHead className="font-bold py-5 pl-8 text-mahallu-dark">Date</TableHead>
                                <TableHead className="font-bold py-5 text-mahallu-dark">Category</TableHead>
                                <TableHead className="font-bold py-5 text-mahallu-dark">Description</TableHead>
                                <TableHead className="font-bold py-5 text-mahallu-dark text-right">Amount</TableHead>
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
                            ) : filteredExpenses.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-64 text-center text-muted-foreground">
                                        No expense records found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredExpenses.map((expense) => (
                                    <TableRow key={expense.id} className="hover:bg-slate-50/50 border-slate-50 transition-colors">
                                        <TableCell className="py-5 pl-8">
                                            <div className="flex items-center gap-2 text-slate-600 font-medium">
                                                <Calendar className="h-4 w-4 text-slate-400" />
                                                {new Date(expense.expense_date).toLocaleDateString()}
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-5">
                                            <Badge className={`
                                                px-3 py-1 rounded-lg border-none font-bold text-[10px] uppercase tracking-wider
                                                ${expense.category === 'Utilities' ? 'bg-blue-100 text-blue-700' :
                                                    expense.category === 'Maintenance' ? 'bg-amber-100 text-amber-700' :
                                                        expense.category === 'Salaries' ? 'bg-indigo-100 text-indigo-700' :
                                                            expense.category === 'Charity' ? 'bg-emerald-100 text-emerald-700' :
                                                                'bg-slate-100 text-slate-700'}
                                            `}>
                                                {expense.category}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="py-5">
                                            <span className="text-mahallu-dark font-medium">{expense.description || '-'}</span>
                                        </TableCell>
                                        <TableCell className="py-5 text-right font-bold text-rose-600">
                                            <div className="flex items-center justify-end gap-1">
                                                <TrendingDown className="h-3.5 w-3.5" />
                                                ₹{expense.amount.toLocaleString()}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right py-5 pr-8">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button size="icon" variant="ghost" onClick={() => handleEdit(expense)} className="h-9 w-9 text-slate-400 hover:text-mahallu-primary">
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button size="icon" variant="ghost" onClick={() => handleDelete(expense.id)} className="h-9 w-9 text-slate-400 hover:text-rose-500">
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

            {/* Expense Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[500px] rounded-3xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                            <Receipt className="h-6 w-6 text-rose-600" />
                            {editingExpense ? 'Edit Expense Record' : 'Record New Expense'}
                        </DialogTitle>
                        <DialogDescription>
                            Enter the details of the outgoing payment or masjid expense.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                        <div className="grid gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="amount" className="font-bold">Amount (₹)</Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    placeholder="0.00"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="h-11 rounded-xl text-lg font-bold text-rose-600"
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
                                            <SelectItem value="Utilities">Utilities</SelectItem>
                                            <SelectItem value="Maintenance">Maintenance</SelectItem>
                                            <SelectItem value="Salaries">Salaries</SelectItem>
                                            <SelectItem value="Events">Events</SelectItem>
                                            <SelectItem value="Charity">Charity</SelectItem>
                                            <SelectItem value="Office">Office</SelectItem>
                                            <SelectItem value="Other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="date" className="font-bold">Expense Date</Label>
                                    <Input
                                        id="date"
                                        type="date"
                                        value={expenseDate}
                                        onChange={(e) => setExpenseDate(e.target.value)}
                                        className="h-11 rounded-xl"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description" className="font-bold">Description / Notes</Label>
                                <Textarea
                                    id="description"
                                    placeholder="e.g. Monthly electricity bill for masjid"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="min-h-[100px] rounded-2xl resize-none"
                                />
                            </div>
                        </div>

                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-xl h-11 px-6">
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl h-11 px-8 shadow-premium"
                            >
                                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                {editingExpense ? 'Update Record' : 'Record Expense'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
