'use client';

import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Upload, Download, X, CheckCircle, AlertCircle, Loader2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ParsedFamily {
    house_name: string;
    family_id: string;
    address: string;
    phone: string;
    subscription_amount: number;
    ward_number: string;
    subscription_start_date?: string;
}

interface UploadResult {
    success: number;
    failed: number;
    errors: string[];
}

const SAMPLE_CSV = `house_name,family_id,address,phone,subscription_amount,ward_number,subscription_start_date
Al-Rahmat House,MAH-001,Ward 5 - Main Road,9876543210,100,5,2025-01-01
Noor Villa,MAH-002,Ward 3 - North Street,9876543211,100,3,2025-01-01
Barakah Manzil,MAH-003,Ward 7 - East Side,9876543212,150,7,2025-01-01
Al-Ameen Residency,MAH-004,Ward 2 - Garden Lane,9876543213,100,2,2025-01-01
Salam House,MAH-005,Ward 5 - Riverside,9876543214,200,5,2025-01-01`;

function downloadSampleCSV() {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mahallu_families_sample.csv';
    a.click();
    URL.revokeObjectURL(url);
}

function parseCSV(text: string): ParsedFamily[] {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));
    const families: ParsedFamily[] = [];

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const row: any = {};
        headers.forEach((h, idx) => { row[h] = values[idx] || ''; });

        if (row.house_name && row.family_id) {
            families.push({
                house_name: row.house_name,
                family_id: row.family_id,
                address: row.address || '',
                phone: row.phone || '',
                subscription_amount: Number(row.subscription_amount) || 100,
                ward_number: row.ward_number || '1',
                subscription_start_date: row.subscription_start_date || new Date().toISOString().slice(0, 10),
            });
        }
    }
    return families;
}

interface Props {
    onSuccess: () => void;
    onClose: () => void;
}

export function BulkUploadDialog({ onSuccess, onClose }: Props) {
    const [parsed, setParsed] = useState<ParsedFamily[]>([]);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState<UploadResult | null>(null);
    const [dragOver, setDragOver] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    const handleFile = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            const rows = parseCSV(text);
            setParsed(rows);
            setResult(null);
        };
        reader.readAsText(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file?.name.endsWith('.csv')) handleFile(file);
    };

    const handleUpload = async () => {
        if (!parsed.length) return;
        setUploading(true);
        let success = 0;
        const errors: string[] = [];

        for (const family of parsed) {
            const { error } = await supabase.from('families').insert({
                house_name: family.house_name,
                family_id: family.family_id,
                address: family.address,
                phone: family.phone,
                subscription_amount: family.subscription_amount,
                ward_number: family.ward_number,
                subscription_start_date: family.subscription_start_date,
                is_active: true,
            });
            if (error) {
                errors.push(`${family.house_name}: ${error.message}`);
            } else {
                success++;
            }
        }

        setResult({ success, failed: errors.length, errors });
        setUploading(false);
        if (success > 0) onSuccess();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <div
                className="relative bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-2xl animate-in fade-in zoom-in-95 duration-150 overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                    <div>
                        <h2 className="text-lg font-bold text-mahallu-dark">Bulk Upload Families</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">Upload a CSV file to add multiple families at once</p>
                    </div>
                    <button onClick={onClose} className="h-8 w-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
                        <X className="h-4 w-4 text-slate-500" />
                    </button>
                </div>

                <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                    {/* Download Sample */}
                    <div className="flex items-center justify-between p-4 bg-mahallu-light rounded-xl border border-mahallu-primary/20">
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-xl bg-mahallu-primary/10 flex items-center justify-center">
                                <FileText className="h-4 w-4 text-mahallu-primary" />
                            </div>
                            <div>
                                <p className="font-semibold text-sm text-mahallu-dark">Download Sample CSV</p>
                                <p className="text-xs text-muted-foreground">Use this template to fill in your data</p>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl border-mahallu-primary/30 text-mahallu-primary hover:bg-mahallu-primary hover:text-white"
                            onClick={downloadSampleCSV}
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Sample CSV
                        </Button>
                    </div>

                    {/* Drop Zone */}
                    {!parsed.length && !result && (
                        <div
                            className={`border-2 border-dashed rounded-xl p-10 text-center transition-all cursor-pointer ${dragOver ? 'border-mahallu-primary bg-mahallu-light' : 'border-slate-200 hover:border-mahallu-primary/50 hover:bg-slate-50'}`}
                            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={handleDrop}
                            onClick={() => fileRef.current?.click()}
                        >
                            <div className="flex flex-col items-center gap-3">
                                <div className={`h-14 w-14 rounded-2xl flex items-center justify-center ${dragOver ? 'bg-mahallu-primary text-white' : 'bg-slate-100 text-slate-400'}`}>
                                    <Upload className="h-7 w-7" />
                                </div>
                                <div>
                                    <p className="font-semibold text-mahallu-dark">Drop your CSV file here</p>
                                    <p className="text-sm text-muted-foreground mt-1">or click to browse — supports .csv files only</p>
                                </div>
                            </div>
                            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
                        </div>
                    )}

                    {/* Preview Table */}
                    {parsed.length > 0 && !result && (
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <p className="font-semibold text-sm text-mahallu-dark">{parsed.length} families ready to import</p>
                                <button className="text-xs text-rose-500 hover:underline" onClick={() => setParsed([])}>Clear</button>
                            </div>
                            <div className="rounded-xl border border-slate-100 overflow-hidden">
                                <div className="overflow-x-auto max-h-[220px] overflow-y-auto">
                                    <table className="w-full text-xs">
                                        <thead className="bg-slate-50 sticky top-0">
                                            <tr>
                                                {['House Name', 'Family ID', 'Address', 'Phone', 'Rate'].map(h => (
                                                    <th key={h} className="text-left px-3 py-2 font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {parsed.map((f, i) => (
                                                <tr key={i} className="hover:bg-slate-50/50">
                                                    <td className="px-3 py-2.5 font-semibold text-mahallu-dark">{f.house_name}</td>
                                                    <td className="px-3 py-2.5 text-slate-500 font-mono">{f.family_id}</td>
                                                    <td className="px-3 py-2.5 text-slate-500 max-w-[150px] truncate">{f.address}</td>
                                                    <td className="px-3 py-2.5 text-slate-500">{f.phone}</td>
                                                    <td className="px-3 py-2.5 font-semibold text-mahallu-primary">₹{f.subscription_amount}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Upload Result */}
                    {result && (
                        <div className="space-y-3">
                            <div className={`flex items-center gap-3 p-4 rounded-xl ${result.failed === 0 ? 'bg-emerald-50 border border-emerald-100' : 'bg-amber-50 border border-amber-100'}`}>
                                {result.failed === 0
                                    ? <CheckCircle className="h-6 w-6 text-emerald-600 shrink-0" />
                                    : <AlertCircle className="h-6 w-6 text-amber-600 shrink-0" />}
                                <div>
                                    <p className="font-bold text-sm">{result.success} families imported successfully</p>
                                    {result.failed > 0 && <p className="text-xs text-amber-700">{result.failed} failed (may already exist)</p>}
                                </div>
                            </div>
                            {result.errors.length > 0 && (
                                <div className="text-xs text-rose-600 bg-rose-50 rounded-xl p-3 space-y-1">
                                    {result.errors.map((e, i) => <p key={i}>• {e}</p>)}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 px-6 pb-5 pt-2 border-t border-slate-50 bg-slate-50/50">
                    <Button variant="outline" className="rounded-xl" onClick={onClose}>
                        {result ? 'Close' : 'Cancel'}
                    </Button>
                    {parsed.length > 0 && !result && (
                        <Button
                            className="rounded-xl bg-mahallu-primary hover:bg-mahallu-dark text-white"
                            onClick={handleUpload}
                            disabled={uploading}
                        >
                            {uploading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Importing...</> : <><Upload className="h-4 w-4 mr-2" /> Import {parsed.length} Families</>}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
