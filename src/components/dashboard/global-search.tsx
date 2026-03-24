'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Search, Users, Wallet, FileBadge, X, ArrowRight, Home, CreditCard } from 'lucide-react';

interface SearchResult {
    id: string;
    title: string;
    subtitle: string;
    type: 'family' | 'member' | 'transaction';
    href: string;
}

const TYPE_CONFIG = {
    family: { icon: Home, color: 'text-mahallu-primary', bg: 'bg-mahallu-light', label: 'Family' },
    member: { icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Member' },
    transaction: { icon: Wallet, color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Transaction' },
};

export function GlobalSearch({ onClose }: { onClose?: () => void }) {
    const [open, setOpen] = useState(true);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState(0);
    const router = useRouter();

    const handleClose = () => {
        setOpen(false);
        onClose?.();
    };


    // Keyboard shortcut Ctrl+K / Cmd+K
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                if (!open) setOpen(true); else handleClose();
            }
            if (e.key === 'Escape') handleClose();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    // Reset on close
    useEffect(() => {
        if (!open) {
            setQuery('');
            setResults([]);
            setSelected(0);
        }
    }, [open]);

    // Search with debounce
    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            return;
        }
        const timer = setTimeout(async () => {
            setLoading(true);
            const q = query.toLowerCase();
            try {
                const [families, members, transactions] = await Promise.all([
                    supabase.from('families').select('id, house_name, family_id').ilike('house_name', `%${q}%`).limit(4),
                    supabase.from('members').select('id, name, member_id').ilike('name', `%${q}%`).limit(4),
                    supabase.from('transactions').select('id, receipt_number, amount, category').ilike('category', `%${q}%`).limit(4),
                ]);

                const combined: SearchResult[] = [
                    ...(families.data || []).map(f => ({ id: f.id, title: f.house_name, subtitle: `ID: ${f.family_id}`, type: 'family' as const, href: '/directory' })),
                    ...(members.data || []).map(m => ({ id: m.id, title: m.name, subtitle: `Member ID: ${m.member_id}`, type: 'member' as const, href: '/directory' })),
                    ...(transactions.data || []).map(t => ({ id: t.id, title: `Receipt #${t.receipt_number}`, subtitle: `${t.category} • ₹${Number(t.amount).toLocaleString()}`, type: 'transaction' as const, href: '/finances' })),
                ];
                setResults(combined);
                setSelected(0);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [query]);

    // Arrow key navigation
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (!open) return;
            if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(p => Math.min(p + 1, results.length - 1)); }
            if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(p => Math.max(p - 1, 0)); }
            if (e.key === 'Enter' && results[selected]) {
                router.push(results[selected].href);
                handleClose();
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [open, results, selected, router]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]" onClick={handleClose}>
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

            {/* Panel */}
            <div
                className="relative w-full max-w-xl mx-4 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
                onClick={e => e.stopPropagation()}
            >
                {/* Search Input */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
                    <Search className="h-5 w-5 text-muted-foreground shrink-0" />
                    <input
                        autoFocus
                        className="flex-1 text-base bg-transparent outline-none text-mahallu-dark placeholder:text-slate-400"
                        placeholder="Search families, members, transactions..."
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                    />
                    {query && (
                        <button onClick={() => setQuery('')} className="text-slate-400 hover:text-slate-600 transition-colors">
                            <X className="h-4 w-4" />
                        </button>
                    )}
                    <kbd className="hidden md:flex items-center gap-1 text-[10px] font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200">ESC</kbd>
                </div>

                {/* Results */}
                <div className="max-h-[50vh] overflow-y-auto">
                    {!query && (
                        <div className="p-6 text-center text-sm text-slate-400">
                            <Search className="h-8 w-8 mx-auto mb-2 text-slate-200" />
                            <p>Start typing to search across all modules</p>
                        </div>
                    )}

                    {loading && (
                        <div className="p-4 text-center text-sm text-slate-400">Searching...</div>
                    )}

                    {!loading && query && results.length === 0 && (
                        <div className="p-6 text-center text-sm text-slate-400">
                            No results found for <span className="font-semibold text-slate-600">&quot;{query}&quot;</span>
                        </div>
                    )}

                    {results.length > 0 && (
                        <div className="p-2">
                            {results.map((result, i) => {
                                const cfg = TYPE_CONFIG[result.type];
                                const Icon = cfg.icon;
                                return (
                                    <button
                                        key={result.id}
                                        className={`w-full flex items-center gap-4 px-3 py-3 rounded-xl text-left transition-all ${i === selected ? 'bg-mahallu-primary/10' : 'hover:bg-slate-50'
                                            }`}
                                        onClick={() => { router.push(result.href); handleClose(); }}
                                        onMouseEnter={() => setSelected(i)}
                                    >
                                        <div className={`h-9 w-9 rounded-xl ${cfg.bg} flex items-center justify-center shrink-0`}>
                                            <Icon className={`h-4 w-4 ${cfg.color}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-sm text-mahallu-dark truncate">{result.title}</p>
                                            <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color} uppercase tracking-wider`}>{cfg.label}</span>
                                            <ArrowRight className="h-3.5 w-3.5 text-slate-300" />
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-5 py-3 border-t border-slate-50 bg-slate-50/70 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-[10px] text-slate-400 font-medium">
                        <span className="flex items-center gap-1"><kbd className="bg-white border border-slate-200 rounded px-1">↑↓</kbd> navigate</span>
                        <span className="flex items-center gap-1"><kbd className="bg-white border border-slate-200 rounded px-1">↵</kbd> open</span>
                        <span className="flex items-center gap-1"><kbd className="bg-white border border-slate-200 rounded px-1">Esc</kbd> close</span>
                    </div>
                    <span className="text-[10px] text-slate-300 font-medium">Mahallu Search</span>
                </div>
            </div>
        </div>
    );
}
