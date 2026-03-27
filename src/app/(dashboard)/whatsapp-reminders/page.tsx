'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Family } from '@/types/database';
import {
    Search,
    Loader2,
    MessageCircle,
    AlertCircle,
    CheckCircle2,
    PhoneOff
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

interface FamilyWithArrears extends Family {
    monthly_arrears: number;
    sponsorship_pending: number;
    total_arrears: number;
}

export default function WhatsAppRemindersPage() {
    const [families, setFamilies] = useState<FamilyWithArrears[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusDates, setStatusDates] = useState<string[]>([]);
    const [newDateInput, setNewDateInput] = useState<string>('');
    const [statuses, setStatuses] = useState<Record<string, Record<string, string>>>({});

    const handleStatusChange = (familyId: string, date: string, status: string) => {
        setStatuses(prev => ({ 
            ...prev, 
            [familyId]: {
                ...(prev[familyId] || {}),
                [date]: status
            }
        }));
    };

    const handleAddDateColumn = () => {
        if (newDateInput && !statusDates.includes(newDateInput)) {
            setStatusDates(prev => [...prev, newDateInput]);
            setNewDateInput('');
        }
    };

    const fetchData = async () => {
        try {
            setLoading(true);

            // Fetch Families
            const { data: familiesData, error: familyError } = await supabase
                .from('families')
                .select('*')
                .order('family_id', { ascending: true });

            if (familyError) throw familyError;

            // Fetch Transactions (for Monthly Subscriptions)
            const { data: txData, error: txError } = await supabase
                .from('transactions')
                .select('*')
                .eq('category', 'Monthly Subscription');

            if (txError) throw txError;

            // Fetch Sponsorships
            const { data: spData, error: spError } = await supabase
                .from('sponsorships')
                .select('*');

            if (spError) throw spError;

            // Map transactions
            const txByFamily = new Map();
            (txData || []).forEach(tx => {
                if (!txByFamily.has(tx.family_id)) {
                    txByFamily.set(tx.family_id, []);
                }
                txByFamily.get(tx.family_id).push(tx);
            });

            // Map sponsorships
            const spByFamily = new Map();
            (spData || []).forEach(sp => {
                if (!spByFamily.has(sp.family_id)) {
                    spByFamily.set(sp.family_id, []);
                }
                spByFamily.get(sp.family_id).push(sp);
            });

            // Process arrears
            const processedFamilies = (familiesData || []).map(family => {
                const familyTx = txByFamily.get(family.id) || [];
                const familySp = spByFamily.get(family.id) || [];
                const paidSet = new Set(familyTx.map((tx: any) => `${tx.payment_year}-${tx.payment_month}`));

                // Calculate Monthly Arrears
                const startDate = new Date(family.subscription_start_date || '2025-01-01');
                const endDate = new Date();
                const paymentStatus: { month: number; year: number; isPaid: boolean }[] = [];

                let checkDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
                while (checkDate <= endDate) {
                    const m = checkDate.getMonth() + 1;
                    const y = checkDate.getFullYear();
                    const isPaid = paidSet.has(`${y}-${m}`);
                    paymentStatus.push({ month: m, year: y, isPaid });
                    checkDate.setMonth(checkDate.getMonth() + 1);
                }

                const unpaidMonths = paymentStatus.filter(p => !p.isPaid).length;
                const monthlyArrears = unpaidMonths * (Number(family.subscription_amount) || 0);
                const legacyArrears = Number(family.legacy_arrears) || 0;
                
                const totalMonthlyArrears = legacyArrears + monthlyArrears;

                // Calculate Sponsorship Pending
                const sponsorshipPending = familySp.reduce((acc: number, sp: any) => acc + (Number(sp.total_amount) - Number(sp.paid_amount)), 0);

                const totalArrears = totalMonthlyArrears + sponsorshipPending;

                return {
                    ...family,
                    monthly_arrears: totalMonthlyArrears,
                    sponsorship_pending: sponsorshipPending,
                    total_arrears: totalArrears
                };
            }).filter(f => f.total_arrears > 0).sort((a, b) => a.family_id.localeCompare(b.family_id, undefined, { numeric: true, sensitivity: 'base' }));

            setFamilies(processedFamilies);

        } catch (error: any) {
            console.error('Error fetching data:', error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredFamilies = families.filter(f =>
        f.house_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.family_id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSendWhatsApp = (family: FamilyWithArrears) => {
        if (!family.contact_number) return;
        
        // Clean phone number (remove spaces, etc. ensure it has country code if needed, but we'll prepend 91 for India if it's 10 digits as a best guess or just use as is)
        let phone = family.contact_number.replace(/\D/g, '');
        // Assume Indian numbers default if 10 digits
        if (phone.length === 10) {
            phone = '91' + phone;
        }

        const message = `അസ്സലാമു അലൈകും 🤝

പ്രിയപ്പെട്ട ${family.house_name},

വെസ്റ്റ് മുളവൂർ മഹല്ല് ജമാഅത്ത് കമ്മിറ്റിയിൽ നിന്നുള്ള ഒരു അറിയിപ്പാണിത്. നിങ്ങളുടെ കുടിശ്ശിക വിവരങ്ങൾ താഴെ നൽകുന്നു:

📍 കുടിശ്ശിക വിവരങ്ങൾ:
▫️ മാസവരി ഇനം: ₹${family.monthly_arrears.toLocaleString()}
▫️ മറ്റ് കുടിശ്ശികകൾ: ₹${family.sponsorship_pending.toLocaleString()}
💰 ആകെ തുക: ₹${family.total_arrears.toLocaleString()}

മേൽ പറഞ്ഞ തുക കമ്മിറ്റി ഭാരവാഹികളെയോ അല്ലെങ്കിൽ താഴെ കാണുന്ന G-Pay നമ്പറിലേക്കോ അയച്ച് സഹകരിക്കണമെന്ന് വിനീതമായി അഭ്യർത്ഥിക്കുന്നു.

📲 G-Pay Number: 8891285093
(പേയ്മെന്റ് ചെയ്ത ശേഷം ദയവായി സ്ക്രീൻഷോട്ട് അയക്കുക.)

നമ്മുടെ മസ്ജിദിന്റെ പുരോഗതിക്കായി നിങ്ങളുടെ സഹകരണം അത്യന്താപേക്ഷിതമാണ്. പടച്ചവൻ നമ്മുടെ സ്വദഖകൾ സ്വീകരിക്കട്ടെ. ആമീൻ... 🤲

വെസ്റ്റ് മുളവൂർ മഹല്ല് ജമാഅത്ത് കമ്മിറ്റി ✨`;

        const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="text-3xl font-bold tracking-tight text-mahallu-dark">വാട്സാപ്പ് റിമൈൻഡറുകൾ</h2>
                    <p className="text-muted-foreground">Send payment reminders to families with pending arrears.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="rounded-xl h-11 px-6 border-slate-200" onClick={fetchData}>
                        Refresh Status
                    </Button>
                </div>
            </div>

            {/* List Table */}
            <div className="card-premium overflow-hidden">
                <div className="p-6 border-b bg-slate-50/50 flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search house or ID..."
                            className="pl-10 h-11 rounded-xl bg-white border-slate-200 shadow-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow className="hover:bg-transparent border-slate-100">
                                <TableHead className="font-bold py-5 pl-8 text-mahallu-dark">Family</TableHead>
                                <TableHead className="font-bold py-5 text-mahallu-dark text-right">മാസവരി കുടിശ്ശിക</TableHead>
                                <TableHead className="font-bold py-5 text-mahallu-dark text-right">Sponsorship</TableHead>
                                <TableHead className="font-bold py-5 text-mahallu-dark text-right pr-8">Total Pending</TableHead>
                                <TableHead className="text-center py-5 font-bold text-mahallu-dark">Action</TableHead>
                                {statusDates.map(date => (
                                    <TableHead key={date} className="text-center py-5 font-bold text-mahallu-dark min-w-[140px]">
                                        Status ({new Date(date).toLocaleDateString('en-GB')})
                                    </TableHead>
                                ))}
                                <TableHead className="py-5 min-w-[200px]">
                                    <div className="flex items-center gap-2 justify-center">
                                        <Input 
                                            type="date" 
                                            value={newDateInput}
                                            onChange={(e) => setNewDateInput(e.target.value)}
                                            className="h-9 w-36 rounded-xl border-slate-200 bg-white shadow-sm"
                                        />
                                        <Button 
                                            size="sm" 
                                            variant="secondary"
                                            onClick={handleAddDateColumn}
                                            className="h-9 px-4 rounded-xl shadow-sm text-slate-700 font-medium"
                                        >
                                            Add
                                        </Button>
                                    </div>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6 + statusDates.length} className="h-64 text-center">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <Loader2 className="h-8 w-8 animate-spin text-mahallu-primary" />
                                            <p className="text-sm text-muted-foreground">Loading families...</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredFamilies.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6 + statusDates.length} className="h-64 text-center">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                                            <p className="font-semibold text-slate-700">All caught up!</p>
                                            <p className="text-sm text-muted-foreground">No families found with pending arrears.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredFamilies.map((family) => (
                                    <TableRow key={family.id} className="hover:bg-slate-50/50 border-slate-50 transition-colors">
                                        <TableCell className="py-5 pl-8">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-mahallu-dark">{family.house_name}</span>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 uppercase">{family.family_id}</span>
                                                    {family.contact_number ? (
                                                        <span className="text-[10px] text-slate-500">{family.contact_number}</span>
                                                    ) : (
                                                        <span className="text-[10px] text-rose-500 font-medium">No Contact Found</span>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>
                                        
                                        <TableCell className="py-5 text-right font-medium text-slate-600">
                                            ₹{family.monthly_arrears.toLocaleString()}
                                        </TableCell>
                                        
                                        <TableCell className="py-5 text-right font-medium text-slate-600">
                                            ₹{family.sponsorship_pending.toLocaleString()}
                                        </TableCell>

                                        <TableCell className="py-5 text-right pr-8">
                                            <span className="font-black text-rose-600">₹{family.total_arrears.toLocaleString()}</span>
                                        </TableCell>
                                        
                                        <TableCell className="text-center py-5">
                                            {family.contact_number ? (
                                                <Button 
                                                    onClick={() => handleSendWhatsApp(family)}
                                                    className="bg-[#25D366] hover:bg-[#128C7E] text-white rounded-xl h-9 px-4 shadow-sm flex items-center gap-2 mx-auto w-[100px] justify-center"
                                                >
                                                    <MessageCircle className="h-4 w-4" />
                                                    Send
                                                </Button>
                                            ) : (
                                                <Button 
                                                    disabled
                                                    variant="outline"
                                                    className="rounded-xl h-9 px-4 text-slate-400 border-slate-200 flex items-center gap-2 mx-auto w-[100px] justify-center"
                                                >
                                                    <PhoneOff className="h-4 w-4" />
                                                    N/A
                                                </Button>
                                            )}
                                        </TableCell>
                                        {statusDates.map(date => (
                                            <TableCell key={date} className="text-center py-5">
                                                <select 
                                                    value={statuses[family.id]?.[date] || 'not_sent'}
                                                    onChange={(e) => handleStatusChange(family.id, date, e.target.value)}
                                                    className="h-9 w-[130px] rounded-xl border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none focus:ring-2 focus:ring-mahallu-primary/20 text-slate-600 font-medium cursor-pointer mx-auto block"
                                                >
                                                    <option value="not_sent">Not Sent</option>
                                                    <option value="sent">Sent ✔</option>
                                                    <option value="error">Error ⚠️</option>
                                                    <option value="no_details">No Details ❌</option>
                                                </select>
                                            </TableCell>
                                        ))}
                                        {/* Empty cell to align with 'Add Date' input column */}
                                        <TableCell className="py-5"></TableCell>
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
