'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Transaction, Family } from '@/types/database';
import {
    Search,
    Plus,
    Receipt,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    Filter,
    Download,
    Loader2,
    Home
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
import { AddTransactionDialog } from '@/components/dashboard/add-transaction-dialog';
import { generateReceiptPDF } from '@/lib/pdf-service';

interface TransactionWithFamily extends Transaction {
    families: Family;
}

export default function FinancesPage() {
    const [transactions, setTransactions] = useState<TransactionWithFamily[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [totalRevenue, setTotalRevenue] = useState(0);

    const fetchTransactions = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('transactions')
                .select(`
                    *,
                    families (*)
                `)
                .order('transaction_date', { ascending: false });

            if (error) throw error;
            setTransactions(data || []);

            const total = (data || []).reduce((acc, curr) => acc + Number(curr.amount), 0);
            setTotalRevenue(total);
        } catch (error: any) {
            console.error('Error fetching transactions:', error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, []);

    const exportCSV = () => {
        const header = ['Receipt #', 'House Name', 'Family ID', 'Category', 'Date', 'Amount'];
        const rows = filteredTransactions.map(tx => [
            tx.receipt_number,
            tx.families.house_name,
            tx.families.family_id,
            tx.category,
            new Date(tx.transaction_date).toLocaleDateString(),
            `₹${Number(tx.amount).toLocaleString()}`
        ]);
        const csv = [header, ...rows].map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mahallu_ledger_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const filteredTransactions = transactions.filter(t =>
        t.families.house_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.receipt_number.toString().includes(searchQuery)
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="text-3xl font-bold tracking-tight text-mahallu-dark">Financial Ledger</h2>
                    <p className="text-muted-foreground">Monitor subscriptions, donations, and community funds.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="rounded-xl h-11 px-4 border-slate-200" onClick={exportCSV}>
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </Button>
                    <AddTransactionDialog onSuccess={fetchTransactions}>
                        <Button className="bg-mahallu-primary hover:bg-mahallu-dark text-white rounded-xl h-11 px-6 shadow-sm flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            Record Payment
                        </Button>
                    </AddTransactionDialog>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card-premium p-6 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <div className="h-12 w-12 rounded-2xl bg-mahallu-light flex items-center justify-center text-mahallu-primary">
                            <ArrowUpRight className="h-6 w-6" />
                        </div>
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100 rounded-lg">
                            +12% vs last month
                        </Badge>
                    </div>
                    <div className="mt-4">
                        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Collection</p>
                        <h3 className="text-3xl font-bold text-mahallu-dark mt-1">₹{totalRevenue.toLocaleString()}</h3>
                    </div>
                </div>

                <div className="card-premium p-6 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                            <Receipt className="h-6 w-6" />
                        </div>
                    </div>
                    <div className="mt-4">
                        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Transactions</p>
                        <h3 className="text-3xl font-bold text-mahallu-dark mt-1">{transactions.length}</h3>
                    </div>
                </div>

                <div className="card-premium p-6 flex flex-col justify-between border-l-4 border-l-mahallu-primary">
                    <div className="flex items-center justify-between">
                        <div className="h-12 w-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600">
                            <Calendar className="h-6 w-6" />
                        </div>
                    </div>
                    <div className="mt-4">
                        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Recent Target</p>
                        <h3 className="text-3xl font-bold text-mahallu-dark mt-1">₹75,000</h3>
                    </div>
                </div>
            </div>

            {/* Ledger Table */}
            <div className="card-premium overflow-hidden">
                <div className="p-6 border-b bg-slate-50/50 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Find receipt or house..."
                            className="pl-10 h-11 rounded-xl bg-white border-slate-200 focus:ring-mahallu-primary/20"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="rounded-lg h-9">
                            <Filter className="h-4 w-4 mr-2" />
                            Filter
                        </Button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow className="hover:bg-transparent border-slate-100">
                                <TableHead className="w-[120px] font-bold py-5 pl-8 text-mahallu-dark">Receipt #</TableHead>
                                <TableHead className="font-bold py-5 text-mahallu-dark">House / Family</TableHead>
                                <TableHead className="font-bold py-5 text-mahallu-dark">Category</TableHead>
                                <TableHead className="font-bold py-5 text-mahallu-dark">Date</TableHead>
                                <TableHead className="text-right py-5 text-mahallu-dark font-bold">Amount</TableHead>
                                <TableHead className="text-right py-5 pr-8 font-bold text-mahallu-dark">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-64 text-center">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <Loader2 className="h-8 w-8 animate-spin text-mahallu-primary" />
                                            <p className="text-sm text-muted-foreground">Fetching ledger entries...</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredTransactions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-64 text-center">
                                        <div className="flex flex-col items-center justify-center gap-4">
                                            <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                                <Receipt className="h-8 w-8" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="font-semibold text-mahallu-dark text-lg">No transactions found</p>
                                                <p className="text-sm text-muted-foreground">Start by recording a new payment.</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredTransactions.map((tx) => (
                                    <TableRow key={tx.id} className="hover:bg-slate-50/50 transition-colors border-slate-50">
                                        <TableCell className="font-bold py-4 pl-8">
                                            <span className="text-slate-400 text-xs mr-1">#</span>
                                            {tx.receipt_number}
                                        </TableCell>
                                        <TableCell className="py-4 font-semibold text-mahallu-dark">
                                            <div className="flex flex-col">
                                                <span>{tx.families.house_name}</span>
                                                <span className="text-xs text-muted-foreground font-normal">{tx.families.family_id}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <Badge variant="outline" className="rounded-lg px-2.5 py-0.5 font-medium text-xs">
                                                {tx.category}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="py-4 text-slate-500">
                                            {new Date(tx.transaction_date).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right py-4 font-bold text-mahallu-primary text-base">
                                            ₹{Number(tx.amount).toLocaleString()}
                                        </TableCell>
                                        <TableCell className="text-right py-4 pr-8">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-9 gap-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-mahallu-dark transition-colors"
                                                onClick={() => generateReceiptPDF(tx, tx.families)}
                                            >
                                                <Download className="h-4 w-4" />
                                                Receipt
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
