'use client';

import React, { useEffect, useState } from 'react';
import {
  Users, UserPlus, IndianRupee, FileBadge,
  ArrowUpRight, ArrowDownRight, Loader2, TrendingUp, CreditCard
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';

interface MonthlyRevenue {
  month: string;
  amount: number;
}

interface CategoryData {
  name: string;
  value: number;
  color: string;
}

const PIE_COLORS = ['#10b981', '#0f172a', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function DashboardPage() {
  const [stats, setStats] = useState({ families: 0, members: 0, revenue: 0, certificates: 0, pendingCount: 0 });
  const [monthlyData, setMonthlyData] = useState<MonthlyRevenue[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [recentTx, setRecentTx] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      try {
        const [familiesRes, membersRes, transactionsRes, certsRes] = await Promise.all([
          supabase.from('families').select('*', { count: 'exact', head: true }),
          supabase.from('members').select('*', { count: 'exact', head: true }),
          supabase.from('transactions').select('amount, transaction_date, category, families(house_name)').order('transaction_date', { ascending: false }),
          supabase.from('certificates').select('*', { count: 'exact', head: true }),
        ]);

        const txData = transactionsRes.data || [];
        const totalRevenue = txData.reduce((acc, t) => acc + Number(t.amount), 0);

        // Monthly aggregation for the current year
        const currentYear = new Date().getFullYear();
        const monthly: Record<number, number> = {};
        for (let i = 0; i < 12; i++) monthly[i] = 0;
        txData.forEach(t => {
          const d = new Date(t.transaction_date);
          if (d.getFullYear() === currentYear) {
            monthly[d.getMonth()] = (monthly[d.getMonth()] || 0) + Number(t.amount);
          }
        });
        const monthlyRevenue = Object.entries(monthly).map(([idx, amount]) => ({
          month: MONTH_LABELS[Number(idx)],
          amount,
        }));

        // Category breakdown
        const catMap: Record<string, number> = {};
        txData.forEach(t => {
          catMap[t.category] = (catMap[t.category] || 0) + Number(t.amount);
        });
        const cats = Object.entries(catMap).map(([name, value], i) => ({
          name, value, color: PIE_COLORS[i % PIE_COLORS.length]
        }));

        setStats({
          families: familiesRes.count || 0,
          members: membersRes.count || 0,
          revenue: totalRevenue,
          certificates: certsRes.count || 0,
          pendingCount: 0,
        });
        setMonthlyData(monthlyRevenue);
        setCategoryData(cats);
        setRecentTx(txData.slice(0, 6));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-mahallu-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h2 className="text-3xl font-bold tracking-tight text-mahallu-dark">Overview</h2>
        <p className="text-muted-foreground">Welcome to the Mahallu Management System — Live data from Supabase.</p>
      </div>

      {/* Stats Row */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Families" value={stats.families.toString()} icon={<Users className="h-5 w-5" />} trend="+Live" trendUp={true} description="registered households" />
        <StatCard title="Total Members" value={stats.members.toString()} icon={<UserPlus className="h-5 w-5" />} trend="+Live" trendUp={true} description="community individuals" />
        <StatCard title="Total Collection" value={`₹${stats.revenue.toLocaleString()}`} icon={<IndianRupee className="h-5 w-5" />} trend="+Live" trendUp={true} description="all-time revenue" />
        <StatCard title="Certificates" value={stats.certificates.toString()} icon={<FileBadge className="h-5 w-5" />} trend="Live" trendUp={true} description="total issued" />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Area Chart */}
        <div className="card-premium lg:col-span-4 p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-mahallu-dark">Revenue Trend</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Monthly subscription & donations — {new Date().getFullYear()}</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1.5 rounded-full">
              <TrendingUp className="h-3.5 w-3.5" />
              Live Data
            </div>
          </div>
          {monthlyData.every(m => m.amount === 0) ? (
            <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground gap-2 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
              <IndianRupee className="h-8 w-8 text-slate-300" />
              <p className="text-sm">No transactions recorded for {new Date().getFullYear()} yet.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                <Tooltip formatter={(val: number) => [`₹${val.toLocaleString()}`, 'Revenue']} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Area type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={2.5} fill="url(#revenueGradient)" dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }} activeDot={{ r: 6 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie Chart */}
        <div className="card-premium lg:col-span-3 p-8">
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-mahallu-dark">Collections by Category</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Breakdown of all income sources</p>
          </div>
          {categoryData.length === 0 ? (
            <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground gap-2 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
              <CreditCard className="h-8 w-8 text-slate-300" />
              <p className="text-sm">No data to display yet.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {categoryData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(val: number) => [`₹${val.toLocaleString()}`, '']} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Legend iconType="circle" iconSize={8} formatter={(val) => <span className="text-xs text-slate-600">{val}</span>} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card-premium p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-mahallu-dark">Recent Transactions</h3>
          <a href="/finances" className="text-sm text-mahallu-primary font-semibold hover:underline">View all →</a>
        </div>
        {recentTx.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No transactions recorded yet.</p>
        ) : (
          <div className="space-y-4">
            {recentTx.map((tx, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
                <div className="flex items-center gap-4">
                  <div className="h-9 w-9 rounded-xl bg-mahallu-light flex items-center justify-center text-mahallu-primary">
                    <IndianRupee className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-mahallu-dark">{tx.families?.house_name || 'Unknown'}</p>
                    <p className="text-xs text-muted-foreground">{tx.category} • {new Date(tx.transaction_date).toLocaleDateString()}</p>
                  </div>
                </div>
                <span className="font-bold text-mahallu-primary">₹{Number(tx.amount).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, trend, trendUp, description }: {
  title: string; value: string; icon: React.ReactNode;
  trend: string; trendUp: boolean; description: string;
}) {
  return (
    <div className="card-premium p-8 relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
        {React.cloneElement(icon as React.ReactElement, { size: 80 })}
      </div>
      <div className="flex items-center justify-between mb-4">
        <div className="rounded-2xl bg-mahallu-light p-3 text-mahallu-primary shadow-sm border border-mahallu-primary/10">
          {icon}
        </div>
        <div className={`flex items-center text-xs font-bold px-2 py-1 rounded-full ${trendUp ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
          {trendUp ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : <ArrowDownRight className="h-3 w-3 mr-0.5" />}
          {trend}
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">{title}</p>
        <h3 className="text-3xl font-extrabold text-mahallu-dark tracking-tight">{value}</h3>
        <p className="text-xs text-muted-foreground font-medium pt-1">{description}</p>
      </div>
    </div>
  );
}
