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
  const [stats, setStats] = useState({ families: 0, members: 0, outstandingSubscriptions: 0, pendingSponsorship: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      try {
        setLoading(true);
        // Fetch basic counts
        const [familiesFullRes, membersRes] = await Promise.all([
          supabase.from('families').select('id, family_id, subscription_start_date, subscription_amount, legacy_arrears'),
          supabase.from('members').select('*', { count: 'exact', head: true }),
        ]);
        const familiesData = familiesFullRes.data || [];

        // Fetch transactions for arrears calculation
        let allTxData: any[] = [];
        try {
          const { data } = await supabase.from('transactions').select('family_id, amount, payment_year, payment_month, category');
          allTxData = data || [];
        } catch (txErr) {
          console.warn('Arrears data fetch failed:', txErr);
        }

        // Fetch sponsorships for pending pledge calc
        let spData: any[] = [];
        try {
          const { data: spRes } = await supabase.from('sponsorships').select('total_amount, paid_amount');
          spData = spRes || [];
        } catch { /* silent */ }
        
        const totalPendingSponsorship = spData.reduce((acc: number, s: any) =>
          acc + Math.max(0, Number(s.total_amount) - Number(s.paid_amount)), 0);

        // Arrears Calculation Logic
        const paidPerFamily: Record<string, number> = {};
        allTxData
          .filter(t => t.category === 'Monthly Subscription')
          .forEach((t: any) => {
            paidPerFamily[t.family_id] = (paidPerFamily[t.family_id] || 0) + Number(t.amount);
          });

        let totalOutstanding = 0;
        const now = new Date();
        familiesData.forEach((fam: any) => {
          if (!fam.subscription_start_date || !fam.subscription_amount) return;
          const start = new Date(fam.subscription_start_date);
          const monthlyRate = Number(fam.subscription_amount);
          const legacy = Number(fam.legacy_arrears) || 0;
          const totalMonths = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth()) + 1;
          const expected = totalMonths * monthlyRate + legacy;
          const paid = paidPerFamily[fam.id] || 0;
          totalOutstanding += Math.max(0, expected - paid);
        });

        setStats({
          families: familiesData.length,
          members: membersRes.count || 0,
          outstandingSubscriptions: totalOutstanding,
          pendingSponsorship: totalPendingSponsorship,
        });
      } catch (e) {
        console.warn('Dashboard fetch error:', e);
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
        <p className="text-muted-foreground">Welcome to the Mahallu Management System.</p>
      </div>

      {/* Stats Row */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="ആകെ കുടുംബങ്ങൾ" value={stats.families.toString()} icon={<Users className="h-5 w-5" />} trend="+Live" trendUp={true} description="രജിസ്റ്റർ ചെയ്ത കുടുംബങ്ങൾ" />
        <StatCard title="ആകെ അംഗങ്ങൾ" value={stats.members.toString()} icon={<UserPlus className="h-5 w-5" />} trend="+Live" trendUp={true} description="രജിസ്റ്റർ ചെയ്ത അംഗങ്ങൾ" />
        <StatCard title="മാസവരി കുടിശ്ശിക" value={`₹${stats.outstandingSubscriptions.toLocaleString()}`} icon={<IndianRupee className="h-5 w-5" />} trend="Arrears" trendUp={false} description="ആകെ മാസവരി കുടിശ്ശിക" color="rose" />
        <StatCard title="സ്പോൺസർഷിപ്പ് കുടിശ്ശിക" value={`₹${stats.pendingSponsorship.toLocaleString()}`} icon={<IndianRupee className="h-5 w-5" />} trend="Pledges" trendUp={false} description="സ്പോൺസർഷിപ്പ് കുടിശ്ശിക" color="amber" />
      </div>

      {/* Pendings Overview */}
      <div className="bg-white border border-slate-100 rounded-3xl shadow-xl p-10 flex flex-col items-center text-center gap-6 group hover:shadow-2xl transition-all duration-500 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-rose-400 to-transparent opacity-50"></div>
        <div className="h-16 w-16 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500 mb-2">
            <TrendingUp className="h-8 w-8" />
        </div>
        <div className="space-y-2 max-w-lg">
            <h3 className="text-2xl font-bold text-mahallu-dark">ആകെ ലഭിക്കാനുള്ള തുക</h3>
            <p className="text-sm text-muted-foreground">മാസവരി, സ്പോൺസർഷിപ്പ് എന്നിവയിൽ നിന്നുള്ള ആകെ കുടിശ്ശിക.</p>
        </div>
        <div className="flex flex-col gap-1">
            <p className="text-6xl font-black text-rose-600 tracking-tighter tabular-nums drop-shadow-sm">
                ₹{(stats.outstandingSubscriptions + stats.pendingSponsorship).toLocaleString()}
            </p>
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-rose-600 uppercase tracking-widest mt-2">
                <ArrowDownRight className="h-4 w-4" />
                Live Balance
            </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, trend, trendUp, description, color = 'mahallu' }: {
  title: string; value: string; icon: React.ReactNode;
  trend: string; trendUp: boolean; description: string;
  color?: 'mahallu' | 'emerald' | 'rose' | 'indigo' | 'amber';
}) {
  const colorClasses = {
    mahallu: {
      bg: 'bg-mahallu-light',
      text: 'text-mahallu-primary',
      border: 'border-mahallu-primary/10',
      trendUp: 'bg-emerald-50 text-emerald-600',
      trendDown: 'bg-rose-50 text-rose-600'
    },
    emerald: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      border: 'border-emerald-200',
      trendUp: 'bg-emerald-100 text-emerald-700',
      trendDown: 'bg-rose-100 text-rose-700'
    },
    rose: {
      bg: 'bg-rose-50',
      text: 'text-rose-600',
      border: 'border-rose-200',
      trendUp: 'bg-emerald-100 text-emerald-700',
      trendDown: 'bg-rose-100 text-rose-700'
    },
    indigo: {
      bg: 'bg-indigo-50',
      text: 'text-indigo-600',
      border: 'border-indigo-200',
      trendUp: 'bg-indigo-100 text-indigo-700',
      trendDown: 'bg-indigo-100 text-indigo-700'
    },
    amber: {
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      border: 'border-amber-200',
      trendUp: 'bg-amber-100 text-amber-700',
      trendDown: 'bg-amber-100 text-amber-700'
    }
  };

  const activeColor = colorClasses[color] || colorClasses.mahallu;

  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-md p-8 relative overflow-hidden group hover:shadow-lg transition-shadow duration-300">
      <div className={`absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-500 ${activeColor.text}`}>
        {React.cloneElement(icon as any, { size: 80 })}
      </div>
      <div className="flex items-center justify-between mb-4">
        <div className={`rounded-2xl ${activeColor.bg} p-3 ${activeColor.text} shadow-sm border ${activeColor.border}`}>
          {icon}
        </div>
        <div className={`flex items-center text-xs font-bold px-2 py-1 rounded-full ${trendUp ? activeColor.trendUp : activeColor.trendDown}`}>
          {trendUp ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : <ArrowDownRight className="h-3 w-3 mr-0.5" />}
          {trend}
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">{title}</p>
        <h3 className={`text-3xl font-extrabold tracking-tight ${activeColor.text}`}>{value}</h3>
        <p className="text-xs text-muted-foreground font-medium pt-1">{description}</p>
      </div>
    </div>
  );
}
