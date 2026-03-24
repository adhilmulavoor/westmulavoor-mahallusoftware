-- COPY AND PASTE THIS INTO SUPABASE SQL EDITOR
-- This will setup 5 demo members and families for testing

-- 1. Create Families
INSERT INTO public.families (family_id, house_name, address, contact_number, subscription_amount, subscription_start_date, legacy_arrears, is_active)
VALUES 
('FAM-9001', 'Green Villa', 'Street 1, Mahallu', '9001', 100, '2024-01-01', 500, true),
('FAM-9002', 'Sunrise Home', 'Street 2, Mahallu', '9002', 150, '2024-03-01', 0, true),
('FAM-9003', 'Peace Nest', 'Street 3, Mahallu', '9003', 200, '2023-10-01', 1000, true),
('FAM-9004', 'River Side', 'Street 4, Mahallu', '9004', 100, '2024-01-01', 200, true),
('FAM-9005', 'Hill View', 'Street 5, Mahallu', '9005', 300, '2024-05-01', 0, true)
ON CONFLICT (contact_number) DO UPDATE SET is_active = true;

-- 2. Create Members (Heads)
INSERT INTO public.members (member_id, family_id, name, is_head, contact_number)
SELECT 'MEM-' || f.contact_number, f.id, 'Member ' || f.contact_number, true, f.contact_number
FROM public.families f
WHERE f.contact_number IN ('9001', '9002', '9003', '9004', '9005')
ON CONFLICT (contact_number) DO NOTHING;

-- 3. Create Sponsorships
INSERT INTO public.sponsorships (family_id, project_name, total_amount, paid_amount, status)
SELECT id, 'Masjid Construction', 50000, 10000, 'Partial'
FROM public.families WHERE contact_number = '9001'
UNION ALL
SELECT id, 'Education Fund', 10000, 2000, 'Partial'
FROM public.families WHERE contact_number = '9003';

-- 4. Create dummy transactions to show partial payment
INSERT INTO public.transactions (receipt_number, family_id, amount, category, transaction_date, payment_month, payment_year)
SELECT 1001, id, 100, 'Monthly Subscription', '2024-02-15', 1, 2024
FROM public.families WHERE contact_number = '9001';

-- NOTE: To enable LOGIN for these members, you must manually create users in the 'Auth' tab 
-- with email format: phone@mahallu.local (e.g., 9001@mahallu.local) 
-- and set the password as the phone number (e.g., 9001).
