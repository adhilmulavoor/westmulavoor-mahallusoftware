export type Family = {
    id: string;
    family_id: string;
    house_name: string;
    address: string;
    contact_number: string | null;
    subscription_amount: number | null;
    subscription_start_date: string | null;
    is_active: boolean;
    created_at: string;
};

export type Member = {
    id: string;
    member_id: string;
    family_id: string;
    name: string;
    relation_to_head: string | null;
    dob: string | null;
    blood_group: string | null;
    occupation: string | null;
    education: string | null;
    is_head: boolean;
    created_at: string;
};

export type Certificate = {
    id: string;
    certificate_id: string;
    member_id: string;
    type: 'Marriage' | 'Death' | 'NOC' | 'Membership';
    issue_date: string;
    data: any; // PDF details or custom fields
    created_at: string;
};

export type Transaction = {
    id: string;
    receipt_number: number;
    family_id: string;
    amount: number;
    category: 'Monthly Subscription' | 'Donation' | 'Zakat' | 'Construction' | 'Other' | 'Sponsorship';
    sponsorship_id: string | null;
    transaction_date: string;
    payment_month: number | null;
    payment_year: number | null;
    notes: string | null;
    created_at: string;
};

export type Sponsorship = {
    id: string;
    family_id: string;
    project_name: string;
    total_amount: number;
    paid_amount: number;
    status: 'Pending' | 'Partial' | 'Completed';
    created_at: string;
};

export type PublicNotice = {
    id: string;
    title: string;
    content: string;
    category: 'General' | 'Event' | 'Urgent' | 'Information';
    is_active: boolean;
    created_at: string;
    updated_at: string;
};
