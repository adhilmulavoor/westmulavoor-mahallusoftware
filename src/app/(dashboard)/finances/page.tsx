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
import { Badge } from '@/components/ui/badge';
import { AddTransactionDialog } from '@/components/dashboard/add-transaction-dialog';

export default function FinancesPage() {
    const [transactionCount, setTransactionCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [totalRevenue, setTotalRevenue] = useState(0);

    const fetchTransactions = async () => {
        try {
            setLoading(true);
            const { data: statsData, count, error } = await supabase
                .from('transactions')
                .select('amount', { count: 'exact' });

            if (error) throw error;
            
            setTransactionCount(count || 0);

            const total = (statsData || []).reduce((acc, curr) => acc + Number(curr.amount), 0);
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

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="text-3xl font-bold tracking-tight text-mahallu-dark">Financial Ledger</h2>
                    <p className="text-muted-foreground">Monitor subscriptions, donations, and community funds.</p>
                </div>
                <div className="flex items-center gap-3">
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
                        <h3 className="text-3xl font-bold text-mahallu-dark mt-1">{transactionCount}</h3>
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

            {/* Financial Status Summary */}
            <div className="card-premium p-8 mt-8 text-center bg-slate-50/50 border border-slate-100 text-slate-500">
                <Receipt className="h-10 w-10 mx-auto text-slate-300 mb-3" />
                <p>Individual transaction history has been moved to household portals to improve load times.</p>
                <p>Use the 'Record Payment' button to add General Hadya or other collective funds.</p>
            </div>
        </div>
    );
}
