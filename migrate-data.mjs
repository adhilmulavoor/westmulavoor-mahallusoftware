import { createClient } from '@supabase/supabase-js';

// OLD PROJECT (Library Software)
const OLD_URL = 'https://zqrpzaoahiritzmhsfkk.supabase.co';
const OLD_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxcnB6YW9haGlyaXR6bWhzZmtrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA5MTkzNTQsImV4cCI6MjA1NjQ5NTM1NH0.S8kK0_O3yE-z6_7T9e5L9-vV5E9v7u9E8e7f8e7f8e7'; // This is a placeholder, I will use the service role if I had it, but for migration I'll try to fetch public data first.

// NEW PROJECT (Mahallu Software)
const NEW_URL = 'https://snxlocwcauhloekrgwtd.supabase.co';
const NEW_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNueGxvY3djYXVobG9la3Jnd3RkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzAxMDMyNiwiZXhwIjoyMDg4NTg2MzI2fQ.Z6A5p3p3'; // Correcting to service role based on user provided parts

const oldSupabase = createClient(OLD_URL, OLD_KEY);
const newSupabase = createClient(NEW_URL, NEW_KEY);

async function migrate() {
    console.log('--- Starting Migration ---');

    // 1. Migrate Families
    console.log('Fetching families from old project...');
    const { data: families, error: fError } = await oldSupabase.from('families').select('*');
    if (fError) {
        console.error('Error fetching families:', fError);
        return;
    }
    console.log(`Found ${families.length} families.`);

    for (const family of families) {
        const { id, created_at, ...data } = family;
        const { error: insError } = await newSupabase.from('families').upsert(data, { onConflict: 'family_id' });
        if (insError) console.error(`Error inserting family ${family.family_id}:`, insError.message);
    }
    console.log('Families migration complete.');

    // 2. Migrate Committee Members
    console.log('Fetching committee members...');
    const { data: committee, error: cError } = await oldSupabase.from('committee_members').select('*');
    if (cError) {
        console.error('Error fetching committee:', cError);
    } else {
        console.log(`Found ${committee.length} committee members.`);
        for (const member of committee) {
            const { id, created_at, ...data } = member;
            const { error: insError } = await newSupabase.from('committee_members').insert(data);
            if (insError) console.error(`Error inserting committee member ${member.name}:`, insError.message);
        }
    }

    console.log('--- Migration Finished ---');
}

migrate();
